#!/usr/bin/env python3
"""
把 golangstar.cn 网站的一篇 markdown 文章发布到微信公众号草稿箱。

流程：读 md → 开头拼头部(header.md：正文品牌头图+链接) → doocs/md 渲染排版(wechat_render→node)
      → 末尾拼引流尾巴(cta_footer.md，按系列选段) → 正文/头图自动上传素材库并替换链接
      → 上传显式指定的 2.35:1 专属封面 → 建草稿。停在草稿箱，由你去后台预览无误后手动群发。

排版：直接复用开源 doocs/md（md.openwrite.cn）官方渲染内核，default 主题（居中标题、蓝色
      胶囊二级标题、Mac 深色代码块）。渲染器是 vendored 的 Node 产物，详见 vendor/md-render/。

用法：
  python3 publish.py <文章.md> --digest 手写摘要 --cover 2.35:1专属封面
                      [--title 标题] [--series KEY] [--series-index N]
                      [--dry-run] [--no-header] [--no-cta]

  --title         公众号标题（默认用 frontmatter title 去掉前导序号；LLM 面试系列自动加“面试官：”）
  --series        系列 KEY（vibe-coding / llm-interview…）。默认按文章路径自动推断
  --series-index  填进引流尾巴的"第 N 篇"
  --digest        80-120 字的手写公众号摘要，不允许自动截取正文
  --cover         文章专属封面，PNG/JPG，实际像素比例必须为 2.35:1
  --dry-run       只生成本地预览 HTML，不调用任何微信接口
  --no-header     不插开头头部
  --no-cta        不追加引流尾巴

凭据：优先读本 skill 目录 config.yaml 的 wechat.{appid,secret}，
      没有则回退读全局 ~/.claude/skills/wewrite/config.yaml。
"""

import argparse
import re
import sys
from pathlib import Path

import yaml

SKILL_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(SKILL_DIR / "toolkit"))

from wechat_render import (                       # noqa: E402
    render_markdown,
    strip_frontmatter as _strip_frontmatter,
    strip_web_promo_card,
)
import wechat_api                                 # noqa: E402
from publisher import create_draft                # noqa: E402

# 路径片段 → 系列 KEY（用于自动推断该用哪套尾巴）
SERIES_BY_PATH = {
    "vibe_coding": "vibe-coding",
    "llm_interview": "llm-interview",
}

LLM_INTERVIEW_TITLE_PREFIX = "面试官："


def _read_creds(cfg: Path):
    data = yaml.safe_load(cfg.read_text(encoding="utf-8")) or {}
    w = data.get("wechat", {})
    appid, secret = str(w.get("appid", "")), str(w.get("secret", ""))
    filled = (appid and secret and "填入" not in appid and "填入" not in secret
              and "your_" not in secret and not appid.startswith("wx_your"))
    return (appid, secret, w.get("author", "") or "") if filled else None


def load_credentials() -> tuple[str, str, str]:
    local = SKILL_DIR / "config.yaml"
    # 项目内 config 存在即以它为准，不回退全局（避免误用别的公众号凭据）
    if local.exists():
        creds = _read_creds(local)
        if creds:
            return creds
        raise SystemExit(f"请在 {local} 填入正确的 appid/secret（当前为占位或无效）")
    glob = Path.home() / ".claude/skills/wewrite/config.yaml"
    if glob.exists():
        creds = _read_creds(glob)
        if creds:
            return creds
    raise SystemExit("未找到有效的微信 appid/secret（建 skill 内 config.yaml 填入）")


def image_dimensions(path: Path) -> tuple[int, int]:
    """读取 PNG/JPEG 尺寸，不引入额外图像依赖。"""
    with path.open("rb") as image:
        header = image.read(24)
        if header.startswith(b"\x89PNG\r\n\x1a\n") and header[12:16] == b"IHDR":
            return int.from_bytes(header[16:20], "big"), int.from_bytes(header[20:24], "big")

        image.seek(0)
        if image.read(2) != b"\xff\xd8":
            raise SystemExit(f"封面必须是可读取的 PNG 或 JPEG: {path}")

        sof_markers = {
            0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7,
            0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF,
        }
        while True:
            marker_start = image.read(1)
            if not marker_start:
                break
            if marker_start != b"\xff":
                continue
            marker = image.read(1)
            while marker == b"\xff":
                marker = image.read(1)
            if not marker:
                break
            marker_code = marker[0]
            if marker_code in sof_markers:
                segment_length = int.from_bytes(image.read(2), "big")
                if segment_length < 7:
                    break
                image.read(1)
                height = int.from_bytes(image.read(2), "big")
                width = int.from_bytes(image.read(2), "big")
                return width, height
            if marker_code in {0x01, 0xD8, 0xD9}:
                continue
            length_bytes = image.read(2)
            if len(length_bytes) != 2:
                break
            segment_length = int.from_bytes(length_bytes, "big")
            if segment_length < 2:
                break
            image.seek(segment_length - 2, 1)

    raise SystemExit(f"无法读取封面尺寸: {path}")


def validate_cover(path_arg: str) -> tuple[Path, int, int]:
    cover = Path(path_arg).expanduser().resolve()
    if not cover.is_file():
        raise SystemExit(f"封面不存在: {cover}")
    width, height = image_dimensions(cover)
    if height <= 0 or round(width / height, 2) != 2.35:
        raise SystemExit(
            f"封面比例必须为 2.35:1，当前为 {width}×{height} "
            f"({width / height:.3f}:1): {cover}"
        )
    return cover, width, height


def force_linebreaks(text: str) -> str:
    """给每个非空行强制加 markdown 硬换行（行尾两空格），
    避免头部/尾巴里因行尾空格数不一致导致多条链接挤成一行。"""
    return "\n".join((ln.rstrip() + "  ") if ln.strip() else ln for ln in text.splitlines())


def find_banner() -> Path | None:
    for ext in ("png", "jpg", "jpeg"):
        p = SKILL_DIR / "assets" / "images" / f"header-banner.{ext}"
        if p.exists():
            return p
    return None


def build_header() -> str:
    """开头头部 markdown；头图缺失则返回空串。"""
    hfile = SKILL_DIR / "assets" / "header.md"
    if not hfile.exists():
        return ""
    banner = find_banner()
    if not banner:
        print("  ⚠ assets/images/header-banner.* 不存在，本次跳过开头头图")
        return ""
    text = re.sub(r"<!--.*?-->", "", hfile.read_text(encoding="utf-8"), flags=re.S)
    return force_linebreaks(text.replace("{banner}", str(banner.resolve())).strip())


def infer_series(md_path: Path, override: str | None) -> str | None:
    if override:
        return override
    joined = "/".join(md_path.parts)
    for seg, key in SERIES_BY_PATH.items():
        if seg in joined:
            return key
    return None


def format_title(title: str, series: str | None) -> str:
    normalized = title.strip()
    if series != "llm-interview":
        return normalized
    question = re.sub(r"^面试官\s*[:：]\s*", "", normalized).strip()
    return f"{LLM_INTERVIEW_TITLE_PREFIX}{question}"


def build_cta(series: str | None, index: int | None) -> str:
    """按系列从 cta_footer.md 取对应段；取不到则返回空串。"""
    cfile = SKILL_DIR / "assets" / "cta_footer.md"
    if not cfile.exists():
        return ""
    raw = cfile.read_text(encoding="utf-8")
    # 按 <!-- series: KEY --> 切段
    sections: dict[str, str] = {}
    cur = None
    buf: list[str] = []
    for line in raw.splitlines():
        m = re.match(r"^\s*<!--\s*series:\s*(\S+)\s*-->\s*$", line)
        if m:
            if cur:
                sections[cur] = "\n".join(buf).strip()
            cur, buf = m.group(1), []
        elif cur:
            buf.append(line)
    if cur:
        sections[cur] = "\n".join(buf).strip()

    if not series:
        print(f"  ⚠ 未指定/推断出系列，跳过引流尾巴（可用 --series 指定，现有：{list(sections)}）")
        return ""
    if series not in sections:
        print(f"  ⚠ cta_footer.md 里没有系列 '{series}' 的尾巴，跳过（现有：{list(sections)}）")
        return ""
    text = sections[series]
    idx = str(index) if index else ""
    return force_linebreaks(text.replace("{index}", idx).replace("{}", idx))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("md")
    ap.add_argument("--title", default=None)
    ap.add_argument("--digest", required=True,
                    help="80-120字的手写公众号摘要，不允许自动截取正文")
    ap.add_argument("--series", default=None)
    ap.add_argument("--series-index", type=int, default=None)
    ap.add_argument("--cover", required=True,
                    help="文章专属封面（PNG/JPG，实际像素比例必须为2.35:1）")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--no-header", action="store_true")
    ap.add_argument("--no-cta", action="store_true")
    args = ap.parse_args()

    md_path = Path(args.md).resolve()
    if not md_path.exists():
        raise SystemExit(f"文章不存在: {md_path}")

    digest = args.digest.strip()
    if not 80 <= len(digest) <= 120:
        raise SystemExit(f"公众号摘要必须为 80-120 字，当前 {len(digest)} 字")
    cover_path, cover_width, cover_height = validate_cover(args.cover)

    series = infer_series(md_path, args.series)
    print(f"系列: {series or '(无)'}")

    # 先从文章剥掉 frontmatter、取标题——必须在拼头部之前做，
    # 否则头部会挡住 frontmatter。
    body, fm_title = _strip_frontmatter(md_path.read_text(encoding="utf-8"))
    body = strip_web_promo_card(body)  # 剥掉网站专用绿色引流卡片，公众号不需要

    parts = []
    if not args.no_header:
        h = build_header()
        if h:
            parts.append(h)
    parts.append(body)
    if not args.no_cta:
        c = build_cta(series, args.series_index)
        if c:
            parts.append(c)
    combined = "\n\n".join(parts)

    html, images = render_markdown(combined, base_dir=md_path.parent)
    title = format_title(args.title or fm_title or md_path.stem, series)
    print(f"标题: {title}")
    print(f"摘要: {digest}")
    print(f"封面: {cover_path.name} ({cover_width}×{cover_height}, 2.35:1)")
    print(f"图片(含头图): {len(images)} 张")

    if args.dry_run:
        page = ('<html><head><meta charset=utf-8></head><body style="margin:0;background:#ececec">'
                '<div style="max-width:390px;margin:0 auto;background:#fff;padding:20px 16px">'
                f'{html}</div></body></html>')
        Path("/tmp/wx_preview.html").write_text(page, encoding="utf-8")
        print("\n[dry-run] 预览已写: /tmp/wx_preview.html（不调用微信接口）")
        return

    appid, secret, author = load_credentials()
    token = wechat_api.get_access_token(appid, secret)

    local_imgs = [i for i in images if not i.startswith(("http://", "https://"))]
    url_map: dict[str, str] = {}
    for idx, path in enumerate(local_imgs, 1):
        if path in url_map:
            continue
        if not Path(path).exists():
            print(f"  ⚠ 图片缺失，跳过: {path}")
            continue
        url_map[path] = wechat_api.upload_image(token, path)
        print(f"  上传图片 {idx}/{len(local_imgs)} ✓")
    for path, wx_url in url_map.items():
        html = html.replace(path, wx_url)

    thumb_id = wechat_api.upload_thumb(token, str(cover_path))
    print(f"  封面上传: {cover_path.name} ✓")

    res = create_draft(token, title=title, html=html, digest=digest,
                       thumb_media_id=thumb_id, author=author)
    print(f"\n✅ 草稿已创建 media_id={res.media_id}")
    print("   去公众号后台「草稿箱」预览，确认无误后手动群发。")


if __name__ == "__main__":
    main()

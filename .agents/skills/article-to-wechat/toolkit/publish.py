#!/usr/bin/env python3
"""
把 golangstar.cn 网站的一篇 markdown 文章发布到微信公众号草稿箱。

流程：读 md → 开头拼头部(header.md：网站头图+链接) → doocs/md 渲染排版(wechat_render→node)
      → 末尾拼引流尾巴(cta_footer.md，按系列选段) → 正文/头图自动上传素材库并替换链接
      → 取首图作封面 → 建草稿。停在草稿箱，由你去后台预览无误后手动群发。

排版：直接复用开源 doocs/md（md.openwrite.cn）官方渲染内核，default 主题（居中标题、蓝色
      胶囊二级标题、Mac 深色代码块）。渲染器是 vendored 的 Node 产物，详见 vendor/md-render/。

用法：
  python3 publish.py <文章.md> [--title 标题] [--series KEY] [--series-index N]
                      [--cover 封面图] [--dry-run] [--no-header] [--no-cta]

  --title         公众号标题（默认用 frontmatter title 去掉前导序号）
  --series        系列 KEY（vibe-coding / llm-interview…）。默认按文章路径自动推断
  --series-index  填进引流尾巴的"第 N 篇"
  --cover         指定封面图（默认取首图——通常就是开头那张头图）
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


def first_paragraph_digest(body_md: str) -> str:
    """从正文（已剥 frontmatter）取第一段纯文本作摘要，跳过标题/图片/引用/列表。"""
    for line in body_md.splitlines():
        s = line.strip()
        if not s or s[0] in "#!>-*|" or s.startswith("```"):
            continue
        s = re.sub(r"!\[.*?\]\(.*?\)", "", s)          # 去图片
        s = re.sub(r"\[(.*?)\]\(.*?\)", r"\1", s)        # 链接留文字
        s = re.sub(r"[*`]", "", s).strip()                # 去强调/代码标记
        if s:
            return s[:100]
    return ""


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
    ap.add_argument("--digest", default=None,
                    help="公众号摘要（≤120字，吸引力强）。不传则回退截取正文开头——但应优先手写。")
    ap.add_argument("--series", default=None)
    ap.add_argument("--series-index", type=int, default=None)
    ap.add_argument("--cover", default=None)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--no-header", action="store_true")
    ap.add_argument("--no-cta", action="store_true")
    args = ap.parse_args()

    md_path = Path(args.md).resolve()
    if not md_path.exists():
        raise SystemExit(f"文章不存在: {md_path}")

    series = infer_series(md_path, args.series)
    print(f"系列: {series or '(无)'}")

    # 先从文章剥掉 frontmatter、取标题与摘要——必须在拼头部之前做，
    # 否则头部挡住开头，frontmatter 取不到、摘要会变成头部那行链接。
    body, fm_title = _strip_frontmatter(md_path.read_text(encoding="utf-8"))
    body = strip_web_promo_card(body)  # 剥掉网站专用绿色引流卡片，公众号不需要
    # 摘要：优先用手写的 --digest（吸引力强、≤120字）；没传才回退截取正文开头。
    digest = (args.digest or "").strip() or first_paragraph_digest(body)
    if len(digest) > 120:
        digest = digest[:120]

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
    title = args.title or fm_title or md_path.stem
    print(f"标题: {title}")
    print(f"摘要: {digest}")
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

    cover = args.cover or (local_imgs[0] if local_imgs and Path(local_imgs[0]).exists() else None)
    if cover and Path(cover).exists():
        thumb_id = wechat_api.upload_thumb(token, cover)
        print(f"  封面: {Path(cover).name} ✓")
    else:
        thumb_id = wechat_api.upload_default_thumb(token)
        print("  封面: 占位白图（无可用图片）")

    res = create_draft(token, title=title, html=html, digest=digest,
                       thumb_media_id=thumb_id, author=author)
    print(f"\n✅ 草稿已创建 media_id={res.media_id}")
    print("   去公众号后台「草稿箱」预览，确认无误后手动群发。")


if __name__ == "__main__":
    main()

"""
Python ↔ Node 渲染桥接：调 vendored doocs/md 渲染器把 markdown → 公众号内联 HTML。

为什么不在 Python 里渲染：排版直接复用 doocs/md（md.openwrite.cn）官方渲染内核
（marked + highlight.js + 主题 CSS + juice 内联），保真度 100%、跟官方主题同步，
不再手写复刻。Node 侧产物已是公众号草稿 API 可直接用的"行内样式 HTML"。

本模块只做两件 API 相关的后处理，且**用 regex 外科式处理、不整体过 HTML 解析器**——
因为 doocs 产物含大小写敏感的内联 SVG（Mac 代码块三色点的 viewBox）与 <br>/&nbsp;，
经 BeautifulSoup round-trip 会被破坏：
  1. 图片 src：相对路径→绝对路径（相对文章目录），并收集图片列表供上传；
  2. 剥掉非公众号链接（站内/外链会触发建草稿 45166 invalid content），保留 mp.weixin。
"""

import json
import re
import subprocess
import tempfile
from pathlib import Path

SKILL_DIR = Path(__file__).resolve().parent.parent
RENDER_JS = SKILL_DIR / "vendor" / "md-render" / "render.mjs"


def strip_frontmatter(text: str) -> tuple[str, str]:
    """删除头部 frontmatter，返回 (正文, title)；title 去掉前导序号（"4. xxx" → "xxx"）。
    doocs 渲染器自身也会解析 frontmatter，但我们在 publish.py 拼头部前就要先剥掉并取标题，
    故保留这个独立工具。"""
    title = ""
    if text.startswith("---"):
        end = text.find("\n---", 3)
        if end != -1:
            for line in text[3:end].splitlines():
                m = re.match(r"\s*title\s*:\s*(.+?)\s*$", line)
                if m:
                    title = m.group(1).strip().strip("'\"")
                    break
            text = text[end + 4:].lstrip("\n")
    title = re.sub(r"^\s*\d+[\.、]\s*", "", title)
    return text, title

# 默认渲染参数：doocs default 主题 + 经典蓝 + Mac 深色代码块（atom-one-dark）+ 两端对齐。
DEFAULT_OPTS = {
    "theme": "default",
    "primaryColor": "#0F4C81",
    "fontSize": "16px",
    "isMacCodeBlock": True,
    "isUseJustify": True,
    "legend": "alt",
    "codeBlockTheme": "atom-one-dark",
}


# 网站文章末尾自带的绿色引流卡片起始签名（全站文章完全一致）。这是网站页面专用的
# 「关注公众号·领取面试题库」promo，发公众号时要剥掉——公众号自有引流尾巴(cta_footer.md)。
_PROMO_CARD_START = '<div style="background-color: #f0f9eb'


def strip_web_promo_card(md: str) -> str:
    """剥掉网站正文里的绿色引流卡片 <div ...#f0f9eb...>…</div>（含其中嵌套 div，用配平定位闭合）。"""
    start = md.find(_PROMO_CARD_START)
    if start == -1:
        return md
    depth = 0
    end = None
    for m in re.finditer(r"<div\b|</div>", md[start:]):
        if m.group() == "</div>":
            depth -= 1
            if depth == 0:
                end = start + m.end()
                break
        else:
            depth += 1
    if end is None:
        return md  # 配平失败则保守不删
    return (md[:start].rstrip() + "\n\n" + md[end:].lstrip()).strip()


def render_markdown(markdown: str, base_dir: Path, opts: dict | None = None) -> tuple[str, list[str]]:
    """markdown → (公众号内联 HTML, 图片绝对路径列表)。"""
    if not RENDER_JS.exists():
        raise SystemExit(f"渲染器缺失: {RENDER_JS}\n  请按 vendor/md-render/build.sh 重建产物。")
    merged = {**DEFAULT_OPTS, **(opts or {})}
    with tempfile.TemporaryDirectory() as td:
        mdf = Path(td) / "in.md"
        mdf.write_text(markdown, encoding="utf-8")
        optf = Path(td) / "opts.json"
        optf.write_text(json.dumps(merged), encoding="utf-8")
        try:
            proc = subprocess.run(
                ["node", str(RENDER_JS), str(mdf), str(optf)],
                capture_output=True, text=True, check=True,
            )
        except FileNotFoundError:
            raise SystemExit("未找到 node：渲染器需要 Node.js，请先安装（node -v 应可用）。")
        except subprocess.CalledProcessError as e:
            raise SystemExit(f"渲染失败（node render.mjs 退出码 {e.returncode}）：\n{e.stderr.strip()}")
    html = proc.stdout
    html, images = _resolve_images(html, base_dir)
    html = _strip_nonwx_links(html)
    return html, images


def _resolve_images(html: str, base_dir: Path) -> tuple[str, list[str]]:
    """把 <img src> 的相对/本地路径解析为绝对路径，并按出现顺序收集（含开头头图）。"""
    images: list[str] = []

    def repl(m: re.Match) -> str:
        src = m.group(2)
        if not src.startswith(("http://", "https://")):
            p = Path(src)
            if not p.is_absolute():
                p = (base_dir / src).resolve()
            src = str(p)
        images.append(src)
        return m.group(1) + src + m.group(3)

    html = re.sub(r'(<img\b[^>]*?\bsrc=")([^"]*)(")', repl, html)
    return html, images


def _strip_nonwx_links(html: str) -> str:
    """公众号正文不接受站内/外链（会 45166），把非 mp.weixin 的 <a> 拆成纯文本，保留其内联内容。"""
    def repl(m: re.Match) -> str:
        href = m.group(1)
        if href.startswith(("https://mp.weixin.qq.com", "http://mp.weixin.qq.com")):
            return m.group(0)
        return m.group(2)

    return re.sub(r'<a\b[^>]*?\bhref="([^"]*)"[^>]*>(.*?)</a>', repl, html, flags=re.S)

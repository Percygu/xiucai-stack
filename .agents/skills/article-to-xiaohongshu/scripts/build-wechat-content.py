#!/usr/bin/env python3
"""Build/validate the Xiaolvshu body only. No network or publishing actions."""
import argparse
import html
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

FOOTER = Path(__file__).resolve().parents[1] / 'assets/wechat-project-footer.html'
LEARNING_SITE = ('秀才的进阶之路', 'https://mp.weixin.qq.com/s/FV93xYRR9R2BCWwKHC1A8A')
# Verified from WeChat draft/update -> draft/get on 2026-09-27: the short link
# above is expanded by the platform. Only this exact article is equivalent.
LEARNING_ARTICLE_ID = {'__biz': 'Mzk0MTYxNDgyNA==', 'mid': '2247494997',
                       'idx': '1', 'sn': '291a6d209a8fa9e107ba7ff1840ed2b5'}
PROJECTS = [
    ('AI模拟面试官', '2247494548', '1', '86554b8c20d457c28811ca153f76e049'),
    ('DevSupport智能客服系统', '2247494916', '2', 'bdcd1be97223e7017e312f61fbc8bd51'),
]


class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.current = None
        self.text = []

    def handle_starttag(self, tag, attrs):
        if tag == 'a':
            self.current = dict(attrs)
            self.current['label'] = ''

    def handle_data(self, data):
        self.text.append(data)
        if self.current is not None:
            self.current['label'] += data

    def handle_endtag(self, tag):
        if tag == 'a' and self.current is not None:
            self.links.append(self.current)
            self.current = None


def without_footer(content):
    body = re.split(r'(?m)^\s*(?:学习网站|Agent项目)[：:]\s*$', content, maxsplit=1)[0].rstrip()
    lines = body.splitlines()
    while lines and (not lines[-1].strip() or re.fullmatch(r'(?:#[^\s#]+\s*)+', lines[-1].strip())):
        lines.pop()
    return '\n'.join(lines).rstrip()


def is_learning_link(href):
    if href == LEARNING_SITE[1]:
        return True
    url = urlsplit(href)
    query = parse_qs(url.query)
    return (url.scheme == 'https' and url.netloc == 'mp.weixin.qq.com'
            and url.path == '/s' and 'poc_token' not in query
            and all(query.get(k) == [v] for k, v in LEARNING_ARTICLE_ID.items()))


def validate_content(content, platform_readback=False):
    parser = LinkParser()
    parser.feed(content)
    if re.search(r'(?m)^\s*#\S', ''.join(parser.text)):
        raise ValueError('小绿书正文不得追加话题标签')
    if len(parser.links) != 3:
        raise ValueError('小绿书结尾必须包含学习网站和两个 Agent 项目的三条真实超链接，不能是 Markdown 或纯文本')
    learning = parser.links[0]
    if learning['label'] != LEARNING_SITE[0] or not is_learning_link(learning.get('href', '')):
        raise ValueError('学习网站名称、链接或顺序不正确，应在两个 Agent 项目之前')
    for link, (label, mid, idx, sn) in zip(parser.links[1:], PROJECTS):
        url = urlsplit(link.get('href', ''))
        q = parse_qs(url.query)
        expected = {'__biz': 'Mzk0MTYxNDgyNA==', 'mid': mid, 'idx': idx, 'sn': sn}
        if url.scheme != 'https' or url.netloc != 'mp.weixin.qq.com' or url.path != '/s':
            raise ValueError('项目链接必须是指定的公众号文章')
        if any(q.get(k) != [v] for k, v in expected.items()) or link['label'] != label:
            raise ValueError('项目名称、链接或顺序不正确')
        if 'poc_token' in q:
            raise ValueError('不要固化临时 poc_token')
    for link in parser.links:
        if not {'normal_text_link', 'mp_article_text_link'}.issubset(link.get('class', '').split()):
            raise ValueError('缺少公众号文章链接样式标识')
        if link.get('data-itemshowtype') != '0':
            raise ValueError('缺少公众号文章链接显示类型')
    visible = re.sub(r'\s+', '', ''.join(parser.text))
    expected_footer = '学习网站：' + LEARNING_SITE[0] + 'Agent项目：' + ''.join(p[0] for p in PROJECTS)
    if not visible.endswith(expected_footer) or visible.count('学习网站：') != 1 or visible.count('Agent项目：') != 1:
        raise ValueError('结尾顺序必须是正文、学习网站及其链接、Agent项目及两条链接，且只出现一次')
    # A local submission budget, not proof of a platform limit. WeChat expands
    # short URLs on save, so a valid readback can exceed the submitted byte size.
    if not platform_readback and len(content.encode('utf-8')) > 2048:
        raise ValueError('小绿书正文 HTML 超过本地提交预算 2048 UTF-8 字节，应精简正文，保留三条链接')
    return parser.links


def build_content(body, already_html=False):
    clean = without_footer(body)
    clean = '\n'.join(line.strip() for line in clean.splitlines() if line.strip())
    if not already_html:
        clean = html.escape(clean, quote=False)
    content = clean + '\n' + FOOTER.read_text(encoding='utf-8').strip()
    validate_content(content)
    return content


def read_copy_text(raw):
    title = re.search(r'^1\. (.+)$', raw, re.M)
    body = re.search(r'^小绿书正文：\s*\n(.*?)(?=\n+(?:标签|小红书/抖音候选标签)：|\Z)', raw, re.M | re.S)
    if not title or not body:
        raise ValueError('copy.md 缺少标题或小绿书正文')
    return title.group(1).strip(), build_content(body.group(1).strip())


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('copy', type=Path)
    ap.add_argument('--output', type=Path)
    args = ap.parse_args()
    title, content = read_copy_text(args.copy.read_text(encoding='utf-8'))
    if args.output:
        args.output.write_text(content, encoding='utf-8')
        print(f'PASS {title}: 1 个学习网站 + 2 个项目超链接，无话题，{len(content.encode("utf-8"))} bytes')
    else:
        print(content)


if __name__ == '__main__':
    main()

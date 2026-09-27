#!/usr/bin/env python3
"""Read-only validation of the delivered HTML and its correspondence to copy.md."""
import importlib.util
import re
import sys
from pathlib import Path

spec = importlib.util.spec_from_file_location('wechat_builder', Path(__file__).with_name('build-wechat-content.py'))
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)

def validate(job):
    raw = (job / 'copy.md').read_text(encoding='utf-8')
    match = re.search(r'^小绿书正文[：:]\s*\n(.*?)(?=\n(?:小红书正文|抖音正文|小红书/抖音候选标签|标签)[：:]|\Z)', raw, re.M | re.S)
    if not match:
        raise ValueError('缺少小绿书正文')
    actual = (job / 'wechat-content.html').read_text(encoding='utf-8')
    builder.validate_content(actual)
    expected = builder.build_content(match.group(1).strip())
    def visible(value):
        parser = builder.LinkParser()
        parser.feed(value)
        return re.sub(r'\s+', '', ''.join(parser.text))
    if visible(actual) != visible(expected):
        raise ValueError('wechat-content.html 与 copy.md 正文不一致，可能仍是旧版')
    if re.search(r'(?:^|\s)#[\w\u4e00-\u9fff]+', re.sub(r'<[^>]*>', '', actual)):
        raise ValueError('小绿书可见正文含话题标签')

if __name__ == '__main__':
    try:
        validate(Path(sys.argv[1]))
        print('PASS final WeChat HTML: links, text correspondence, byte limit')
    except Exception as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)

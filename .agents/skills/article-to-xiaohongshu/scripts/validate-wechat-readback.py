#!/usr/bin/env python3
"""Offline verification of an existing-draft update. No network or publishing."""
import argparse
import importlib.util
import json
from datetime import datetime, timezone
from pathlib import Path

spec = importlib.util.spec_from_file_location('wechat_builder', Path(__file__).with_name('build-wechat-content.py'))
b = importlib.util.module_from_spec(spec)
spec.loader.exec_module(b)


def visible(content):
    p = b.LinkParser()
    p.feed(content)
    return ''.join(p.text).strip()


def validate(request, after, before=None):
    index = request.get('index', 0)
    if not isinstance(index, int) or index < 0:
        raise ValueError('Invalid article index')
    items = after.get('news_item', [])
    if index >= len(items):
        raise ValueError('Missing target article in readback')
    actual = items[index]
    expected = request['articles']
    if actual.get('article_type') != 'newspic':
        raise ValueError('Readback is not a newspic draft')
    requested_links = b.validate_content(expected['content'])
    saved_links = b.validate_content(actual['content'], platform_readback=True)
    if visible(expected['content']) != visible(actual['content']):
        raise ValueError('正文或链接显示名称与提交内容不同')
    if [x['href'] for x in requested_links[1:]] != [x['href'] for x in saved_links[1:]]:
        raise ValueError('项目链接与提交内容不同')
    for key, value in expected.items():
        if key != 'content' and actual.get(key) != value:
            raise ValueError('提交字段回读不一致：' + key)
    if before:
        old = before['news_item'][index]
        if len(before['news_item']) != len(items):
            raise ValueError('草稿条目数量变化')
        for key in ('author', 'content_source_url'):
            if key not in expected and old.get(key) != actual.get(key):
                raise ValueError('未要求修改的字段变化：' + key)
    return {'status': 'PASS', 'checked_at': datetime.now(timezone.utc).isoformat(),
        'media_id': request['media_id'], 'title': actual.get('title'),
        'body_and_submitted_fields_match': True,
        'learning_short_link_expanded': requested_links[0]['href'] != saved_links[0]['href'],
        'links': [{'label': x['label'], 'href': x['href']} for x in saved_links],
        'image_count': len(actual.get('image_info', {}).get('image_list', [])),
        'submitted_utf8_bytes': len(expected['content'].encode()),
        'stored_utf8_bytes': len(actual['content'].encode()),
        'evidence_scope': 'API request and readback only; not visual or click verification'}


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('request', type=Path)
    ap.add_argument('after', type=Path)
    ap.add_argument('--before', type=Path)
    ap.add_argument('--report', type=Path)
    args = ap.parse_args()
    read = lambda path: json.loads(path.read_text(encoding='utf-8'))
    result = validate(read(args.request), read(args.after), read(args.before) if args.before else None)
    if args.report:
        args.report.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    try:
        main()
    except (ValueError, KeyError, IndexError, TypeError) as error:
        print('FAIL ' + str(error))
        raise SystemExit(1)

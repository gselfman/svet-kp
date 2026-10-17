#!/usr/bin/env python3
"""Validate the static site using only the Python standard library."""
import json
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1] / 'public'
errors = []


def check_path(value, document):
    parsed = urlsplit(value)
    if parsed.scheme or parsed.netloc or not parsed.path:
        return
    rel = unquote(parsed.path)
    dest = (ROOT / rel.lstrip('/')) if rel.startswith('/') else document.parent / rel
    try:
        dest.resolve().relative_to(ROOT.resolve())
    except ValueError:
        errors.append(f'{document.relative_to(ROOT)}: path outside public/: {value}')
        return
    if not dest.exists():
        errors.append(f'{document.relative_to(ROOT)}: missing {value}')
    elif dest.is_file() and dest.stat().st_size == 0:
        errors.append(f'{document.relative_to(ROOT)}: empty {value}')


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.path = path
        self.ids = []
        self.json_ld = False
        self.json_text = ''

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get('id'):
            self.ids.append(a['id'])
        for key in ('src', 'href', 'data-full'):
            if a.get(key):
                check_path(a[key], self.path)
        if tag == 'img' and a.get('src') and not a.get('alt'):
            errors.append(f'{self.path}: image has no alt: {a["src"]}')
        if tag == 'script' and a.get('type') == 'application/ld+json':
            self.json_ld = True
            self.json_text = ''

    def handle_data(self, text):
        if self.json_ld:
            self.json_text += text

    def handle_endtag(self, tag):
        if tag == 'script' and self.json_ld:
            try:
                json.loads(self.json_text)
            except json.JSONDecodeError as exc:
                errors.append(f'{self.path}: invalid JSON-LD: {exc}')
            self.json_ld = False


for path in ROOT.rglob('*.html'):
    page = Page(path)
    page.feed(path.read_text())
    for ident, count in Counter(page.ids).items():
        if count > 1:
            errors.append(f'{path.relative_to(ROOT)}: duplicate id {ident}')

for path in ROOT.rglob('*.json'):
    try:
        json.loads(path.read_text())
    except json.JSONDecodeError as exc:
        errors.append(f'{path}: {exc}')

handbook = json.loads((ROOT / 'guest/content.json').read_text())
for section in handbook['sections']:
    check_path(section['imageUrl'], ROOT / 'guest/index.html')
    for photo in section.get('photos', []):
        check_path(photo['url'], ROOT / 'guest/index.html')

sitemap = ET.parse(ROOT / 'sitemap.xml')
for node in sitemap.iter():
    if node.tag.endswith('}loc'):
        value = node.text or ''
        if urlsplit(value).netloc != 'svet-kp.ru':
            errors.append(f'Sitemap has an unexpected domain: {value}')
        else:
            check_path(urlsplit(value).path, ROOT / 'index.html')

if errors:
    raise SystemExit('\n'.join(errors))
print('OK: local resources, image alt, IDs, guest photos, JSON-LD and sitemap')

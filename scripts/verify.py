"""Validate the complete, intentionally small public publication tree."""
from pathlib import Path
from html.parser import HTMLParser
import hashlib
import re
import struct
import subprocess
import zlib

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://az9713.github.io/gpt-6-astra-builds/'
HASHES = {
    '01-trojan-vase': '3dd321b03a4ae28a5ed2e121dac826d1c774bba1ce20488c439ebabd1850e378',
    '02-sisyphus-relief': '005e9e154cac0a3e18187f1d71d81b02ef5d20403a3f14001e5d46b20907e6b7',
    '03-paris-balloon': '987c416dcc558198413b277b43aaf5b8d51cc8bb5383240a508a6da15d66f216',
    '04-golden-gate': '2cf766fb41a702d2424e4112a332d497b08bca115332f7b7aad22f808a518eac',
    '05-tortoise-hare': 'ebebcd59a85d02e9c29e91a5c3cfe2c411b3bac8e2736e55af69c472692b6e13',
}
ALLOWED = {'.gitignore', '.gitattributes', '.nojekyll', 'README.md', 'index.html',
           'scripts/verify.py', '.github/workflows/pages.yml'}
for slug in HASHES:
    ALLOWED.update((f'{slug}/index.html', f'screenshots/{slug}.png'))


class Document(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.tags = []
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, dict(attrs)))


def check(condition, message):
    if not condition:
        raise SystemExit(message)


files = {p.relative_to(ROOT).as_posix() for p in ROOT.rglob('*')
         if p.is_file() and '.git' not in p.relative_to(ROOT).parts
         and '_site' not in p.relative_to(ROOT).parts}
check(files == ALLOWED, f'Unexpected or missing publication files: {files ^ ALLOWED}')
if (ROOT / '.git').is_dir():
    tracked = set(subprocess.check_output(['git', 'ls-files'], cwd=ROOT, text=True).splitlines())
    check(tracked == ALLOWED, f'Tracked allowlist mismatch: {tracked ^ ALLOWED}')

for name in sorted(ALLOWED):
    data = (ROOT / name).read_bytes()
    if not name.endswith('.png'):
        text = data.decode('utf-8')
        check(not re.search(r'(?i)(?:[a-z]:[\\/](?:users|documents)[\\/]|file:[/]{3}|/(?:home|Users)/)', text), f'Local path found: {name}')
        check(not re.search(r'(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|sk-[A-Za-z0-9]{30,}|-----BEGIN [A-Z ]+PRIVATE KEY-----)', text), f'Credential pattern found: {name}')

for slug, expected in HASHES.items():
    data = (ROOT / slug / 'index.html').read_bytes()
    check(hashlib.sha256(data).hexdigest() == expected, f'Animation integrity mismatch: {slug}')
    source = data.decode('utf-8')
    doc = Document(source)
    check(sum(t == 'canvas' for t, _ in doc.tags) == 1, f'Expected one visible canvas: {slug}')
    check(not any(t in {'svg', 'img', 'video', 'audio', 'iframe', 'input', 'button', 'a'} for t, _ in doc.tags), f'Unexpected asset, navigation, or UI: {slug}')
    check([a for t, a in doc.tags if t == 'link'] == [{'rel': 'icon', 'href': 'data:,'}], f'Expected only the empty inline favicon: {slug}')
    check(not any(t == 'script' and 'src' in a for t, a in doc.tags), f'External script: {slug}')
    check(not re.search(r'https?://|\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b|\bimport\s*\(|\bnew\s+Image\b', source), f'External asset mechanism: {slug}')
    check("modelRequested:'gpt-6-astra'" in source and "reasoningEffortRequested:'xhigh'" in source, f'Generation attribution missing: {slug}')
    png = (ROOT / 'screenshots' / f'{slug}.png').read_bytes()
    check(png[:8] == b'\x89PNG\r\n\x1a\n', f'Invalid screenshot: {slug}')
    offset = 8
    dimensions = None
    chunks = []
    while offset < len(png):
        size = struct.unpack('>I', png[offset:offset + 4])[0]
        kind = png[offset + 4:offset + 8]
        payload = png[offset + 8:offset + 8 + size]
        crc = struct.unpack('>I', png[offset + 8 + size:offset + 12 + size])[0]
        check(zlib.crc32(kind + payload) & 0xffffffff == crc, f'PNG CRC mismatch: {slug}')
        check(kind in {b'IHDR', b'IDAT', b'IEND', b'sRGB', b'gAMA', b'pHYs', b'cHRM'}, f'Unexpected screenshot metadata: {slug}')
        if kind == b'IHDR':
            dimensions = struct.unpack('>II', payload[:8])
        chunks.append(kind)
        offset += size + 12
    check(offset == len(png) and chunks[-1] == b'IEND' and dimensions == (1600, 900), f'Screenshot dimensions or payload invalid: {slug}')

gallery = Document((ROOT / 'index.html').read_text(encoding='utf-8'))
readme = (ROOT / 'README.md').read_text(encoding='utf-8')
links = [attrs.get('href') for tag, attrs in gallery.tags if tag == 'a' and attrs.get('class') == 'card']
images = [attrs.get('src') for tag, attrs in gallery.tags if tag == 'img']
check(links == [BASE + slug + '/index.html' for slug in HASHES], 'Gallery destinations differ from live animation paths')
check(images == [f'screenshots/{slug}.png' for slug in HASHES], 'Gallery screenshot references differ')
for slug in HASHES:
    check(re.search(r'\[!\[[^\]]+\]\(screenshots/' + re.escape(slug) + r'\.png\)\]\(' + re.escape(BASE + slug + '/index.html') + r'\)', readme), f'Clickable README screenshot missing: {slug}')
check('Arena AI' in readme and 'https://www.youtube.com/watch?v=r0ymhRtcTeI&t=1689s' in readme, 'Prompt credit missing')
print(f'PASS: {len(ALLOWED)} allowlisted files, 5 exact Astra sources, 5 clean screenshots, and 10 screenshot links.')

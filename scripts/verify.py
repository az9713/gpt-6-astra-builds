"""Verify the public allowlist, preserved comparisons, local assets and privacy."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urljoin,urlsplit,unquote
import hashlib,json,re,struct,subprocess,zlib
ROOT=Path(__file__).resolve().parents[1]
CONFIG=json.loads((ROOT/'scripts/public-manifest.json').read_text())
def check(ok,message):
    if not ok:raise SystemExit(message)
class Document(HTMLParser):
    def __init__(self,text):super().__init__();self.tags=[];self.feed(text)
    def handle_starttag(self,tag,attrs):self.tags.append((tag,dict(attrs)))
allowed=set(CONFIG['allowed'])
files={p.relative_to(ROOT).as_posix() for p in ROOT.rglob('*') if p.is_file() and '.git' not in p.relative_to(ROOT).parts and '_site' not in p.relative_to(ROOT).parts}
check(files==allowed,f'Publication allowlist mismatch: {files^allowed}')
if (ROOT/'.git').is_dir():
    tracked=set(subprocess.check_output(['git','ls-files'],cwd=ROOT,text=True).splitlines())
    check(tracked==allowed,f'Tracked file allowlist mismatch: {tracked^allowed}')
for name,expected in CONFIG['pinned'].items():
    check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==expected,f'Artifact changed: {name}')
for name in allowed:
    p=ROOT/name
    if p.suffix not in {'.png','.bin'} and '/vendor/' not in name:
        text=p.read_text(encoding='utf-8')
        check(not re.search(r'(?i)(?:[a-z]:[\\/](?:users|documents)[\\/]|file:[/]{3}|/(?:home|Users)/)',text),f'Local personal path: {name}')
        check(not re.search(r'(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|sk-[A-Za-z0-9]{30,}|-----BEGIN [A-Z ]+PRIVATE KEY-----)',text),f'Credential pattern: {name}')
        private_pattern=r'libfile_[A-Za-z0-9]+|file_[0-9a-f]{24,}|sol-6\.1-builds|'+'source_'+'thread_id'+'|sedi'+'ment://'
        check(not re.search(private_pattern,text),f'Private artifact identifier: {name}')
    if p.suffix=='.png':
        png=p.read_bytes();check(png[:8]==b'\x89PNG\r\n\x1a\n',f'Invalid PNG: {name}');off=8;dimensions=None
        while off<len(png):
            size=struct.unpack('>I',png[off:off+4])[0];kind=png[off+4:off+8];data=png[off+8:off+8+size];crc=struct.unpack('>I',png[off+8+size:off+12+size])[0]
            check(zlib.crc32(kind+data)&0xffffffff==crc,f'PNG integrity: {name}')
            check(kind in {b'IHDR',b'IDAT',b'IEND',b'sRGB',b'gAMA',b'pHYs',b'cHRM'},f'Unexpected image metadata: {name}')
            if kind==b'IHDR':dimensions=struct.unpack('>II',data[:8])
            off+=size+12
        check(dimensions==(1600,900) and off==len(png),f'Screenshot dimensions: {name}')
    if p.suffix=='.html':
        for tag,attrs in Document(p.read_text(encoding='utf-8')).tags:
            for attr in ('src','href'):
                value=attrs.get(attr,'');url=urlsplit(value)
                if not value or url.scheme or url.netloc or value.startswith('#'):continue
                dest=(p.parent/unquote(url.path)).resolve()
                check(dest.is_relative_to(ROOT),f'Escaping local link: {name}: {value}')
                check(dest.exists(),f'Broken local link: {name}: {value}')
base=CONFIG['base'];readme=(ROOT/'README.md').read_text(encoding='utf-8');scenes=CONFIG['scenes']
for gallery,prefix in [('index.html','latest/'),('three.html','three/'),('canvas.html','')]:
    doc=Document((ROOT/gallery).read_text(encoding='utf-8'))
    links=[urljoin(base,a.get('href','')) for t,a in doc.tags if t=='a' and a.get('class')=='card']
    check(links==[base+prefix+s[0]+'/index.html' for s in scenes],f'Gallery links: {gallery}')
    images=[a.get('src') for t,a in doc.tags if t=='img']
    check(images==[prefix+'screenshots/'+s[0]+'.png' for s in scenes],f'Gallery images: {gallery}')
for slug,*_ in scenes:
    old=(ROOT/slug/'index.html').read_text(encoding='utf-8');check('Canvas 2D' in old and '<svg' not in old,f'Canvas preservation: {slug}')
    for generation in ['three','latest']:
        page=(ROOT/generation/slug/'index.html').read_text(encoding='utf-8');doc=Document(page)
        check(not any(t in {'img','svg','button','input','a','nav','video','audio'} for t,a in doc.tags),f'Unexpected UI/art: {generation}/{slug}')
        check('"three/webgpu":"../vendor/three.webgpu.js"' in page and '"three/tsl":"../vendor/three.tsl.js"' in page,f'Local import map: {generation}/{slug}')
        for src in (ROOT/generation/slug).rglob('*.js'):
            code=src.read_text(encoding='utf-8')
            check(not re.search(r'https?://|TextureLoader|GLTFLoader|SVGLoader|ImageLoader',code),f'External asset loader: {src.relative_to(ROOT)}')
    check(re.search(r'\[!\[[^\]]+\]\(latest/screenshots/'+re.escape(slug)+r'\.png\)\]\('+re.escape(base+'latest/'+slug+'/index.html')+r'\)',readme),f'README screenshot link: {slug}')
for generation in ['three','latest']:
    runtime=(ROOT/generation/'shared/runtime.js').read_text(encoding='utf-8')
    check("threeVersion:'0.186.1'" in runtime and 'new THREE.WebGPURenderer' in runtime and "from 'three/tsl'" in runtime,'Three.js/TSL provenance')
    check('MIT' in (ROOT/generation/'vendor/LICENSE').read_text(),'Three.js license')
check('Arena AI' in readme and 'https://www.youtube.com/watch?v=r0ymhRtcTeI&t=1689s' in readme,'Prompt credit')
print(f'PASS: {len(allowed)} allowlisted files; five latest scenes; preserved Three.js and Canvas comparisons; clean screenshot metadata; local imports and gallery/guide links.')

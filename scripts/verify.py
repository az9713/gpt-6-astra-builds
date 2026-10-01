"""Verify the explicit public showcase tree and immutable animation assets."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urljoin
import hashlib,re,struct,subprocess,zlib
CONFIG={'allowed': ['.gitattributes', '.github/workflows/pages.yml', '.gitignore', '.nojekyll', '01-trojan-vase/index.html', '02-sisyphus-relief/index.html', '03-paris-balloon/index.html', '04-golden-gate/index.html', '05-tortoise-hare/index.html', 'README.md', 'canvas.html', 'index.html', 'screenshots/01-trojan-vase.png', 'screenshots/02-sisyphus-relief.png', 'screenshots/03-paris-balloon.png', 'screenshots/04-golden-gate.png', 'screenshots/05-tortoise-hare.png', 'scripts/verify.py', 'three/01-trojan-vase/index.html', 'three/01-trojan-vase/scene.js', 'three/02-sisyphus-relief/index.html', 'three/02-sisyphus-relief/scene.js', 'three/03-paris-balloon/index.html', 'three/03-paris-balloon/scene.js', 'three/04-golden-gate/index.html', 'three/04-golden-gate/scene.js', 'three/05-tortoise-hare/index.html', 'three/05-tortoise-hare/scene.js', 'three/screenshots/01-trojan-vase.png', 'three/screenshots/02-sisyphus-relief.png', 'three/screenshots/03-paris-balloon.png', 'three/screenshots/04-golden-gate.png', 'three/screenshots/05-tortoise-hare.png', 'three/shared/runtime.js', 'three/vendor/LICENSE', 'three/vendor/three.core.js', 'three/vendor/three.tsl.js', 'three/vendor/three.webgpu.js'], 'pinned': {'01-trojan-vase/index.html': '3dd321b03a4ae28a5ed2e121dac826d1c774bba1ce20488c439ebabd1850e378', '02-sisyphus-relief/index.html': '005e9e154cac0a3e18187f1d71d81b02ef5d20403a3f14001e5d46b20907e6b7', '03-paris-balloon/index.html': '987c416dcc558198413b277b43aaf5b8d51cc8bb5383240a508a6da15d66f216', '04-golden-gate/index.html': '2cf766fb41a702d2424e4112a332d497b08bca115332f7b7aad22f808a518eac', '05-tortoise-hare/index.html': 'ebebcd59a85d02e9c29e91a5c3cfe2c411b3bac8e2736e55af69c472692b6e13', 'screenshots/01-trojan-vase.png': 'f7c5d1a30194808620516fabbed9926fad8b0b68edbb743f6e2e5c1ecf4b94db', 'screenshots/02-sisyphus-relief.png': 'd85befd3de08ffeb1c9e08fd37174e50cacad6b60ef3f3c7d79d291c05a75480', 'screenshots/03-paris-balloon.png': '04b27951ecaa5cd3225e3caca3454b604097213c2113ea2534e87ab9492a7f21', 'screenshots/04-golden-gate.png': '0341d63626003cc97ea2e3bdb6eb25e3d40b8f3c3b4985df1017c87ac5b31e47', 'screenshots/05-tortoise-hare.png': '14d992d7367ee5a41e7471f770583a5eff18ff1f6fa96d8d0a406fc262788236', 'three/01-trojan-vase/index.html': '16557dce8ad10d8669f649359ad7051609ff729e09518bf82bb2a8372dd70f34', 'three/01-trojan-vase/scene.js': 'd74e5ebea6765e39bb2d338d165b2679b9d7d0ae4eb5f49d52b3d20c552e24a6', 'three/screenshots/01-trojan-vase.png': '53b867e67a1f44d0cbf6d3551ece210bbe540d4ea1c064e2f8321aeb199f2fa0', 'three/02-sisyphus-relief/index.html': 'e9bf22e88957a448c5bff3edc4ea41da5dc04590f26b71092a21c582456af7c4', 'three/02-sisyphus-relief/scene.js': 'bb80bd368b5ef0a18318c4fac031e1902a4ec86dd72e15bed31efa163b616bc0', 'three/screenshots/02-sisyphus-relief.png': 'a443270b8c79f1ac78f2f985020e945f6e4b5065365bd1c6f0b5e5b14a43a962', 'three/03-paris-balloon/index.html': 'c393cb5bc2ce07cf2da7b4a7ecdd0248997a2adf723759d09a5d9427607c3011', 'three/03-paris-balloon/scene.js': '197234e6d9541adcaf92c78dff9084ec16e3d207f0fc8ff92ec9fde293e02089', 'three/screenshots/03-paris-balloon.png': '84eb6928c040b541732983341cdc3fb766a1b60187e6ca4be254e766536516a5', 'three/04-golden-gate/index.html': 'fe981b67b604f7aa2e67ab520f9fcdcd780e56dd857806738af3c0d741fe96b2', 'three/04-golden-gate/scene.js': '42955b5fea2c0bcd0282876ad16b06ec6896b18647c26a3a0ad82be5bc1e9582', 'three/screenshots/04-golden-gate.png': 'f0e9166257403381aaab45cf3aa269d41edba2475b6668b65ea8558b4b8bd179', 'three/05-tortoise-hare/index.html': 'd1452c89fd0c5ee1b8ff74cc05a947a444c11eafac3d9e8e00ed0ac912a6558c', 'three/05-tortoise-hare/scene.js': 'b920c311706b8fbeb2a50da9607a92232ea60cd0e4b8b87d79d3496bf214c1c8', 'three/screenshots/05-tortoise-hare.png': '2f173ab78f128e3566f909a198579559a74047fff19e234b333fa8bb44a2a2e6', 'three/shared/runtime.js': '74d38772b14e753524e4f132e879644fb8298ddb8330c9224154ea07642e7bb9', 'three/vendor/three.webgpu.js': '15cfce5c653541704fd9a3463c39d3e8b854bb6265ccd854d7cfe74090625cc6', 'three/vendor/three.core.js': '9edde002b066a9a05676a6127f67735b62baf399bdea529f2f7e31657da769e6', 'three/vendor/three.tsl.js': '6e6b92d8ce467818944f73815a96abadc6392fb34de577d479a23810b6aeeed0', 'three/vendor/LICENSE': '8b378ebe60e2fe500158cb0ac71cb5e8b7d92953c2abcc63a0eb90499653b5bc'}, 'scenes': [('01-trojan-vase', 'Troy, Written in Clay', 20, 'A rotating 3D vessel with a living pigment mask and TSL terracotta glaze.'), ('02-sisyphus-relief', 'Sisyphus, in Stone', 0, 'Articulated sculpture, a rolling boulder and procedural limestone in a seamless loop.'), ('03-paris-balloon', 'Above Paris', 12, 'Woven silk and raised gold ornament rise above a procedural city and river.'), ('04-golden-gate', 'Joining the Golden Gate', 20, 'Workers guide suspended steelwork above a bay with shader-driven waves.'), ('05-tortoise-hare', 'Slowly Wins the Day', 20, 'Expressive 3D characters race through a woodland of procedural trees and ferns.')], 'base': 'https://az9713.github.io/gpt-6-astra-builds/'}
ROOT=Path(__file__).resolve().parents[1]
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
for name,expected in CONFIG['pinned'].items():check(hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==expected,f'Artifact changed: {name}')
for name in allowed:
 p=ROOT/name
 if p.suffix!='.png' and not name.startswith('three/vendor/'):
  text=p.read_text(encoding='utf-8')
  check(not re.search(r'(?i)(?:[a-z]:[\\/](?:users|documents)[\\/]|file:[/]{3}|/(?:home|Users)/)',text),f'Local personal path: {name}')
  check(not re.search(r'(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|sk-[A-Za-z0-9]{30,}|-----BEGIN [A-Z ]+PRIVATE KEY-----)',text),f'Credential pattern: {name}')
 if p.suffix=='.png':
  png=p.read_bytes();check(png[:8]==b'\x89PNG\r\n\x1a\n',f'Invalid PNG: {name}');off=8;dimensions=None
  while off<len(png):
   size=struct.unpack('>I',png[off:off+4])[0];kind=png[off+4:off+8];data=png[off+8:off+8+size];crc=struct.unpack('>I',png[off+8+size:off+12+size])[0]
   check(zlib.crc32(kind+data)&0xffffffff==crc,f'PNG integrity: {name}')
   check(kind in {b'IHDR',b'IDAT',b'IEND',b'sRGB',b'gAMA',b'pHYs',b'cHRM'},f'Unexpected image metadata: {name}')
   if kind==b'IHDR':dimensions=struct.unpack('>II',data[:8])
   off+=size+12
  check(dimensions==(1600,900) and off==len(png),f'Screenshot dimensions: {name}')
base=CONFIG['base'];readme=(ROOT/'README.md').read_text(encoding='utf-8')
for gallery,prefix in [('index.html','three/'),('canvas.html','')]:
 doc=Document((ROOT/gallery).read_text(encoding='utf-8'))
 links=[urljoin(base,a.get('href','')) for t,a in doc.tags if t=='a' and a.get('class')=='card']
 check(links==[base+prefix+s[0]+'/index.html' for s in CONFIG['scenes']],f'Gallery links: {gallery}')
 images=[a.get('src') for t,a in doc.tags if t=='img']
 check(images==[prefix+'screenshots/'+s[0]+'.png' for s in CONFIG['scenes']],f'Gallery images: {gallery}')
for slug,*_ in CONFIG['scenes']:
 old=(ROOT/slug/'index.html').read_text(encoding='utf-8');check('Canvas 2D' in old and '<svg' not in old,f'Canvas preservation: {slug}')
 page=(ROOT/'three'/slug/'index.html').read_text(encoding='utf-8');doc=Document(page)
 check(not any(t in {'img','svg','button','input','a','nav','video','audio'} for t,a in doc.tags),f'Unexpected UI or art asset: {slug}')
 check('"three/webgpu":"../vendor/three.webgpu.js"' in page and '"three/tsl":"../vendor/three.tsl.js"' in page,f'Local import map: {slug}')
 code=(ROOT/'three'/slug/'scene.js').read_text(encoding='utf-8')
 check("from'../shared/runtime.js'" in code and not re.search(r'https?://|TextureLoader|GLTFLoader|SVGLoader|ImageLoader',code),f'Scene import/asset contract: {slug}')
 check(re.search(r'\[!\[[^\]]+\]\(three/screenshots/'+re.escape(slug)+r'\.png\)\]\('+re.escape(base+'three/'+slug+'/index.html')+r'\)',readme),f'README screenshot link: {slug}')
runtime=(ROOT/'three/shared/runtime.js').read_text(encoding='utf-8')
check("threeVersion:'0.186.1'" in runtime and 'new THREE.WebGPURenderer' in runtime and "from 'three/tsl'" in runtime,'Three.js/TSL provenance')
check('Arena AI' in readme and 'https://www.youtube.com/watch?v=r0ymhRtcTeI&t=1689s' in readme,'Prompt credit')
check('MIT' in (ROOT/'three/vendor/LICENSE').read_text(),'Three.js license')
print(f'PASS: {len(allowed)} allowlisted files; 5 Three.js/TSL scenes; 5 unchanged Canvas scenes; 10 clean screenshots; local vendor imports and correct gallery/README links.')

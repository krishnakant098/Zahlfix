"""Validate the selected R4 SVG sources, then decode them in Chromium.

Uses embedded image documents, not a production HTTP/CSP test. Creates a self-contained
asset review page and PNG board. No external resources or font files are embedded.
"""
import argparse,base64,json,os,re,xml.etree.ElementTree as ET
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
p=argparse.ArgumentParser();p.add_argument('--executable',default=os.environ.get('CHROMIUM_EXECUTABLE'));a=p.parse_args()
names=[f'document-{t}{s}' for t in ['report','analytics','code','data','workflow','approval'] for s in ['', '-compact']]+['z-observatory-gold','z-observatory-ink','z-observatory-compact','z-transition-mask','capture-aperture','orbital-observatory','engraved-system','process-instrument','atom-observatory']
results=[];manifest=[]
for name in names:
 file=ROOT/'public/assets/scene-01-05'/f'{name}.svg';data=file.read_text();el=ET.fromstring(data)
 ids=[node.attrib['id'] for node in el.iter() if 'id' in node.attrib];references=[]
 for node in el.iter():
  for k,v in node.attrib.items():
   if k.endswith('href') and v.startswith('#'):references.append(v[1:])
   references.extend(re.findall(r'url\(#([^)]*)\)',v))
 tags=[node.tag.split('}')[-1] for node in el.iter()]
 checks={'unique_ids':len(set(ids))==len(ids),'internal_references_resolve':all(x in ids for x in references),'no_script_or_foreignobject':not any(t in tags for t in ['script','foreignObject']),'no_expensive_filters':'filter' not in tags,'viewbox':len(el.attrib['viewBox'].split())==4}
 for label,ok in checks.items():results.append({'test':f'{name}: {label}','passed':ok})
 manifest.append({'file':str(file.relative_to(ROOT)),'bytes':file.stat().st_size,'source':'Tabler interior motif + ZahlFix R4 plate' if name.startswith('document') else 'ZahlFix geometry and material artwork with user-supplied ribbon image','material':'layered SVG; ribbon core embeds an optimized user-supplied bitmap','references':len(references)})
# Board assets are isolated SVG image documents, so IDs cannot cross-contaminate.
def image(name):
 data=(ROOT/'public/assets/scene-01-05'/f'{name}.svg').read_bytes()
 return 'data:image/svg+xml;base64,'+base64.b64encode(data).decode()
featured=[('orbital-observatory','01 / ORBITAL OBSERVATORY','Three exact tracks, shared illumination, nine precision records.','dark'),('z-observatory-gold','CORE / SATIN GOLD','Supplied black-and-gold ribbon, optical resizing and matched vector silhouette.','dark'),('capture-aperture','02 / CAPTURE APERTURE','Elliptical rim, dark well and progressive concealment.','dark'),('atom-observatory','05 / ORBITAL INSTRUMENT','Three real curves, ink-brass nucleus and dimensional beads.','gold'),('engraved-system','04 / ENGRAVED SYSTEM','Functional rings supported by subordinate calibration detail.','gold'),('process-instrument','05 / PROCESS RAILS','The same curves and material layers, unrolled into rails.','gold')]
cards=''.join(f'<article class="card"><div class="art {theme}"><img src="{image(name)}" alt="{label}"></div><h2>{label}</h2><p>{description}</p></article>' for name,label,description,theme in featured)
docs=''.join(f'<figure><img src="{image("document-"+n)}" alt="{n}"><figcaption>{n.title()}</figcaption></figure>' for n in ['report','analytics','code','data','workflow','approval'])
html=f'''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ZahlFix R4 / Gold Observatory - asset review</title><style>*{{box-sizing:border-box}}body{{margin:0;background:#080C12;color:#EAE6DC;font-family:Arial,sans-serif}}main{{max-width:1120px;margin:auto;padding:36px}}header{{border-bottom:1px solid #383320;margin-bottom:28px;padding-bottom:22px}}header small{{color:#BEA265;letter-spacing:.16em;font-size:11px}}h1{{font-size:30px;margin:12px 0}}header p{{color:#A1A7AB;max-width:780px;line-height:1.6;margin:0}}.grid{{display:grid;grid-template-columns:1fr 1fr;gap:24px}}.card{{min-width:0}}.art{{height:315px;border:1px solid #272B30;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#0A0E16}}.art.gold{{background:#C39438}}.art img{{width:100%;height:100%;object-fit:contain}}h2{{font-size:11px;letter-spacing:.1em;color:#D6BA79;margin:14px 0 8px}}p{{color:#8F989E;font-size:12px;line-height:1.5;margin:0}}.documents{{display:flex;justify-content:space-around;gap:12px;padding:28px 20px;background:#10151B;border:1px solid #282D30;margin:16px 0 30px}}figure{{margin:0;text-align:center}}figure img{{width:54px;height:74px}}figcaption{{font-size:11px;color:#A8AAA6;margin-top:12px}}footer{{color:#899297;font-size:11px;line-height:1.7;border-top:1px solid #33352C;padding-top:18px}}@media(max-width:680px){{main{{padding:20px}}.grid{{grid-template-columns:1fr}}.documents{{flex-wrap:wrap}}}}</style><main><header><small>ZAHLFIX / RESOURCE SYSTEM / R4</small><h1>Gold Observatory</h1><p>Layered vector materials built on the repaired scene geometry. Dark scenes use satin gold; gold scenes use engraved ink and brass. This is an asset review, not a replacement for the website composition.</p></header><div class="grid">{cards}</div><h2>DOCUMENT PLATES / SIX EDITED MOTIFS</h2><section class="documents">{docs}</section><footer>R4 resources are authored from the supplied brand silhouette and visual direction. Document interior motifs are adapted from Tabler (MIT); the licence is included with the source. No v8 SVG masters were provided or extracted from the reference PNG.<br>Standalone resources are intentionally isolated; their SVG IDs do not conflict. The production page uses one namespaced material-definition set.</footer></main></html>'''
out=ROOT/'qa/r4';out.mkdir(exist_ok=True)
review=ROOT/'docs/r4/ASSET_REVIEW.html';review.write_text(html)
with sync_playwright() as pw:
 opts={'headless':True,'args':['--no-sandbox','--disable-dev-shm-usage']}
 if a.executable:opts['executable_path']=a.executable
 browser=pw.chromium.launch(**opts);page=browser.new_page(viewport={'width':1120,'height':900},device_scale_factor=1)
 page.set_content(html,wait_until='load');page.screenshot(path=str(out/'asset-board.png'),full_page=True)
 for name in names:
  ok=page.evaluate('src=>new Promise(resolve=>{const i=new Image;i.onload=()=>resolve(i.naturalWidth>0&&i.naturalHeight>0);i.onerror=()=>resolve(false);i.src=src;})',image(name));results.append({'test':name+': Chromium image decode','passed':ok})
 browser.close()
(ROOT/'docs/r4/ASSET_MANIFEST.json').write_text(json.dumps(manifest,indent=2))
report={'scope':'strict XML, internal references and isolated Chromium image-document decode','passed':sum(x['passed'] for x in results),'failed':sum(not x['passed'] for x in results),'assets':len(names),'results':results}
(out/'asset-verification.json').write_text(json.dumps(report,indent=2));print(json.dumps({k:v for k,v in report.items() if k!='results'},indent=2))
raise SystemExit(bool(report['failed']))

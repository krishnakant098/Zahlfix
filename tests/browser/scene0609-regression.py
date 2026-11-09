"""Scenes 06-09 in-memory Chromium acceptance. Network/CSP and native-device tests are separate."""
import json,os,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
from harness import ROOT,markup
OUT=ROOT/'qa/scene0609';(OUT/'screenshots').mkdir(parents=True,exist_ok=True)
profiles={'desktop':(1440,900,False),'phone':(390,844,True),'small':(320,568,True),'landscape':(844,390,True),'tablet':(768,1024,True)}
results=[];errors=[]
def rec(name,ok,detail=None):results.append({'test':name,'passed':bool(ok),'detail':detail});print(('PASS ' if ok else 'FAIL ')+name,flush=True)
def seek(pg,p):pg.evaluate('p=>window.__ZAHLFIX_NAV__.seek(p,true)',p);pg.wait_for_timeout(90)
def effective(pg,sel):
 return pg.locator(sel).evaluate('''e=>{let a=1;for(let n=e;n;n=n.parentElement)a*=Number(getComputedStyle(n).opacity||1);return a}''')
def overlap(a,b,pad=0):
 ar=a['x']+a['width'];ab=a['y']+a['height'];br=b['x']+b['width'];bb=b['y']+b['height'];return not(ar+pad<=b['x'] or br+pad<=a['x'] or ab+pad<=b['y'] or bb+pad<=a['y'])
html=markup()
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None,headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--disable-webgl'])
 for name,(w,h,touch) in profiles.items():
  ctx=b.new_context(viewport={'width':w,'height':h},has_touch=touch);pg=ctx.new_page();pg.set_default_timeout(5000);pg.on('pageerror',lambda e:errors.append(str(e)))
  try:
   pg.set_content(html,wait_until='domcontentloaded');pg.wait_for_function('window.__ZAHLFIX_SCENES0609__');pg.wait_for_timeout(1000)
   rec(name+': bridge initialized',pg.locator('[data-p2]').count()==1 and pg.evaluate("document.documentElement.classList.contains('p2-ready')"))
   # Final approved atom -> Scene 06 handoff.
   seek(pg,.229);rec(name+': atom handoff overlays without empty interval',effective(pg,'[data-p1-principle]')+effective(pg,'[data-p2]')>.85)
   # Scene 06: strings and three note-documents.
   seek(pg,.26);snap=pg.evaluate('window.__ZAHLFIX_SCENES0609__.snapshot()')
   rec(name+': Scene 06 is strings',snap['form']=='strings',snap['form'])
   rec(name+': three document-notes are visible',pg.locator('[data-p2-note]').count()==3 and all(effective(pg,f'[data-p2-note="{i}"]')>.7 for i in range(3)))
   rec(name+': three master paths retained',pg.locator('[data-p2] [data-p1-track]').count()==3)
   text=pg.locator('.story-beat--06 strong').bounding_box();arts=pg.locator('[data-p2] [data-p1-track],[data-p2] [data-p2-note]').evaluate_all('els=>els.map(e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height}})');rec(name+': Scene 06 artwork does not obscure copy',all(not overlap(text,a,2) for a in arts),{'text':text,'art':arts})
   pg.screenshot(path=str(OUT/'screenshots'/f'{name}-06.png'))
   # Scene 07 hybrid.
   seek(pg,.291);snap=pg.evaluate('window.__ZAHLFIX_SCENES0609__.snapshot()')
   rec(name+': Scene 07 is hybrid orbital system',snap['form']=='hybrid',snap['form'])
   rec(name+': document-notes retired before hybrid hold',all(effective(pg,f'[data-p2-note="{i}"]')<.03 for i in range(3)))
   rec(name+': three tracked planets visible in hybrid',sum(effective(pg,f'[data-p2] [data-p1-bead="{i}"]')>.5 for i in range(3))==3)
   rec(name+': three companion planets enrich approved atom',pg.locator('[data-p2-companion]').count()==3 and all(effective(pg,f'[data-p2-companion="{i}"]')>.45 for i in range(3)))
   rec(name+': Scene 05 source is fully retired in Scene 07',effective(pg,'[data-p1-principle]')<.001)
   rec(name+': Scene 06 notes are fully retired in Scene 07',effective(pg,'[data-p2-note-layer]')<.03)
   pg.screenshot(path=str(OUT/'screenshots'/f'{name}-07.png'))
   # Scene 08 brand-centred enlarged system and clean gold hold.
   seek(pg,.33);snap=pg.evaluate('window.__ZAHLFIX_SCENES0609__.snapshot()')
   rec(name+': Scene 08 is ZahlFix-centred system',snap['form']=='zahlfix-system',snap['form'])
   rec(name+': Scene 07-only notes remain retired in Scene 08',effective(pg,'[data-p2-note-layer]')<.03)
   rec(name+': source Scene 05 remains isolated in Scene 08',effective(pg,'[data-p1-principle]')<.001)
   rec(name+': brand label visible',effective(pg,'[data-p2-brand-label]')>.8)
   paper=pg.locator('.field--paper').evaluate('e=>getComputedStyle(e).clipPath');rec(name+': Scene 08 reading hold remains fully gold','100%' in paper,paper)
   pg.screenshot(path=str(OUT/'screenshots'/f'{name}-08.png'))
   # Transition into services and completed Scene 09.
   seek(pg,.356);snap=pg.evaluate('window.__ZAHLFIX_SCENES0609__.snapshot()');rec(name+': Scene 08-09 becomes organising guides',snap['form']=='guides',snap['form'])
   seek(pg,.39);rec(name+': Scene 09 service grid is fully present',pg.locator('.service-card').count()==10 and effective(pg,'.service-matrix')>.85)
   rec(name+': cinematic guide retires by Scene 09 hold',effective(pg,'[data-p2]')<.02)
   rec(name+': no horizontal page overflow',pg.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
   pg.screenshot(path=str(OUT/'screenshots'/f'{name}-09.png'))
   # Reverse reconstruction.
   seek(pg,.26);a=pg.locator('[data-p2] [data-p1-track]').evaluate_all('els=>els.map(e=>e.getAttribute("d"))');seek(pg,.33);seek(pg,.26);c=pg.locator('[data-p2] [data-p1-track]').evaluate_all('els=>els.map(e=>e.getAttribute("d"))');rec(name+': reverse scroll reconstructs exact strings',a==c)
  except Exception as e:rec(name+': suite completed',False,str(e))
  ctx.close()
 b.close()
rec('no uncaught browser errors',not errors,errors)
report={'mode':'in-memory Chromium harness; no network/CSP/native-device certification','passed':sum(r['passed'] for r in results),'failed':sum(not r['passed'] for r in results),'results':results}
(OUT/'results.json').write_text(json.dumps(report,indent=2));print(json.dumps({k:v for k,v in report.items() if k!='results'},indent=2));sys.exit(report['failed']>0)

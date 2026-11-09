"""Fast in-memory regression that all 20 reading states remain reachable after Scenes 06-09 work."""
import json,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
from harness import ROOT,markup
registry=json.loads((ROOT/'public/assets/v6/scene-registry.js').read_text().split('Object.freeze(',1)[1].split('.map(Object.freeze)',1)[0])
profiles={'small':(320,568),'phone':(390,844),'tablet':(768,1024),'landscape':(844,390),'desktop':(1440,900)}
results=[];errors=[]
def rec(n,ok,d=None):results.append({'test':n,'passed':bool(ok),'detail':d});print(('PASS ' if ok else 'FAIL ')+n)
def eff(pg,sel):return pg.locator(sel).evaluate('e=>{let o=1;for(let n=e;n;n=n.parentElement)o*=Number(getComputedStyle(n).opacity||1);return o}')
html=markup()
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None,headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--disable-webgl'])
 for name,(w,h) in profiles.items():
  ctx=b.new_context(viewport={'width':w,'height':h},has_touch=name!='desktop');pg=ctx.new_page();pg.set_default_timeout(5000);pg.on('pageerror',lambda e:errors.append(str(e)))
  pg.set_content(html,wait_until='domcontentloaded');pg.wait_for_function('window.__ZAHLFIX_NAV__ && window.__ZAHLFIX_SCENES0609__');pg.wait_for_timeout(600)
  for scene in registry:
   target=1 if scene['number']==20 and name!='desktop' else scene['target'];pg.evaluate('p=>window.__ZAHLFIX_NAV__.seek(p,true)',target);pg.wait_for_timeout(20)
   rec(f'{name}: scene {scene["number"]:02d} readable',eff(pg,scene['selector'])>.83)
  rec(name+': ten services retained',pg.locator('.service-card').count()==10)
  rec(name+': no horizontal overflow',pg.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
  ctx.close()
 b.close()
rec('no uncaught browser errors',not errors,errors)
out=ROOT/'qa/scene0609/fullstory-smoke.json';out.write_text(json.dumps({'mode':'in-memory Chromium harness','passed':sum(r['passed'] for r in results),'failed':sum(not r['passed'] for r in results),'results':results},indent=2));sys.exit(any(not r['passed'] for r in results))

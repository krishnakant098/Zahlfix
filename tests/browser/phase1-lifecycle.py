# HISTORICAL R2/R3 TEST. R4 entrypoints: r4-regression.py, r4-lifecycle.py, r4-assets.py.
"""Repeatable in-memory lifecycle and fault checks. These deliberately inject events,
not native back/forward navigation or device backgrounding."""
from pathlib import Path
import sys,json,base64,os
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests/browser'))
from harness import markup,module_url
import argparse
parser=argparse.ArgumentParser(description='In-memory R3 failure and lifecycle event injection; not a native BFCache certification.')
parser.add_argument('--executable',default=os.environ.get('CHROMIUM_EXECUTABLE'))
a=parser.parse_args()
out=ROOT/'qa/r3';results=[]
def rec(n,v,d=None):results.append({'test':n,'passed':bool(v),'detail':d});print(('PASS ' if v else 'FAIL ')+n,flush=True)
def load(page):page.set_content(markup(),wait_until='domcontentloaded');page.wait_for_function('window.__ZAHLFIX_PHASE1__');page.wait_for_timeout(1000)
def snap(page):return page.evaluate('window.__ZAHLFIX_PHASE1__.snapshot()')
def seek(page,p):
 t=page.evaluate('(p)=>{scrollTo({top:(document.documentElement.scrollHeight-innerHeight)*p,behavior:"instant"});return scrollY/(document.documentElement.scrollHeight-innerHeight);}',p)
 page.wait_for_function('(p)=>Math.abs(window.__ZAHLFIX_PHASE1__.snapshot().p-p)<1e-8',arg=t)
with sync_playwright() as pw:
 opts={'headless':True,'args':['--no-sandbox']};
 if a.executable:opts['executable_path']=a.executable
 b=pw.chromium.launch(**opts)
 pg=b.new_page(viewport={'width':1440,'height':900});load(pg)
 seek(pg,.143);a=snap(pg);pg.set_viewport_size({'width':390,'height':844});pg.wait_for_timeout(200);c=snap(pg)
 rec('resize during wipe retains narrative progress',abs(a['p']-c['p'])<.001,{'before':a['p'],'after':c['p']})
 error=pg.evaluate('''()=>{const f=e=>new DOMPoint(60,60).matrixTransform(e.getScreenCTM());let a=f(document.querySelector('[data-p1-z-core]')),b=f(document.querySelector('[data-p1-z-takeover]'));return Math.hypot(a.x-b.x,a.y-b.y)}''')
 rec('resize during wipe retains exact shared origin',error<1,error)
 seek(pg,.225);s=snap(pg);r=pg.locator('[data-p1-principle]').bounding_box();rec('resized atom stays on screen',r['x']>=0 and r['x']+r['width']<390 and r['y']>70 and r['y']+r['height']<790,r)
 seek(pg,0);pg.evaluate('dispatchEvent(new PageTransitionEvent("pagehide",{persisted:true}))');s1=snap(pg);pg.wait_for_timeout(500);s2=snap(pg)
 rec('persisted page pause stops orbital time',s1['time']==s2['time'])
 pg.evaluate('dispatchEvent(new PageTransitionEvent("pageshow",{persisted:true}))');pg.wait_for_timeout(100);s3=snap(pg)
 rec('persisted page resume does not add hidden elapsed time',0<=s3['time']-s2['time']<.2,s3['time']-s2['time'])
 # Deterministic event injection. Native Chromium freezing is a separate real-device gate.
 pg.evaluate('document.dispatchEvent(new Event("freeze"))');f1=snap(pg);pg.wait_for_timeout(500);f2=snap(pg)
 rec('injected freeze event stops the active orbital clock',f1['time']==f2['time'])
 pg.evaluate('document.dispatchEvent(new Event("resume"))');pg.wait_for_timeout(100);f3=snap(pg)
 rec('injected resume excludes frozen time and starts one RAF chain',0<=f3['time']-f2['time']<.2,f3['time']-f2['time'])
 # Runtime failure is isolated: patch only the same imported module's prototype.
 u=module_url(ROOT/'public/assets/v6/phase1-visuals.js')
 pg.evaluate('async u=>{const m=await import(u);m.Phase1Visuals.prototype.render=function(){throw new Error("TEST injected phase1 failure")}}',u)
 pg.wait_for_timeout(100)
 rec('phase renderer failure restores a complete static opening',pg.locator('.phase1-world.is-fallback [data-p1-doc]').count()==9 and pg.locator('.phase1-world.is-fallback').is_visible())
 pg.locator('#continueCue').click();pg.wait_for_timeout(1600)
 rec('navigation remains usable after phase renderer failure',pg.evaluate('document.documentElement.dataset.story')=='consulting')
 pg.close()
 # Initial template stays useful while main import is deliberately delayed.
 pg=b.new_page(viewport={'width':1440,'height':900})
 url=module_url(ROOT/'public/assets/v6/main.js');src=base64.b64decode(url.split(',',1)[1]).decode();slow='data:text/javascript;base64,'+base64.b64encode(('await new Promise(r=>setTimeout(r,2000));\n'+src).encode()).decode()
 html=markup();boot_url=module_url(ROOT/'public/assets/v6/boot.js');boot_src=base64.b64decode(boot_url.split(',',1)[1]).decode().replace(url,slow);slow_boot='data:text/javascript;base64,'+base64.b64encode(boot_src.encode()).decode();html=html.replace(boot_url,slow_boot)
 pg.set_content(html,wait_until='domcontentloaded');pg.wait_for_timeout(100)
 rec('complete static artwork exists before main initializes',pg.locator('[data-p1-doc]').count()==9 and pg.locator('[data-p1-space]').is_visible() and not pg.locator('.phase1-world').evaluate('e=>e.classList.contains("is-ready")'))
 pg.wait_for_function('window.__ZAHLFIX_PHASE1__');rec('delayed main upgrades static artwork without duplication',pg.locator('.phase1-world').count()==1 and pg.locator('[data-p1-doc]').count()==9)
 pg.close()
 ctx=b.new_context(viewport={'width':320,'height':568},reduced_motion='reduce');pg=ctx.new_page();pg.set_content(markup(),wait_until='domcontentloaded');pg.wait_for_timeout(200)
 rec('reduced motion selects readable text, not accelerated motion',pg.evaluate('document.documentElement.dataset.mode')=='text' and not pg.locator('.phase1-world').is_visible())
 rec('reduced motion retains all twenty narrative beats',pg.locator('.story-transcript ol>li').count()==20)
 ctx.close();b.close()
report={'mode':'in-memory DOM and deliberate fault/lifecycle injection','passed':sum(r['passed'] for r in results),'failed':sum(not r['passed'] for r in results),'results':results}
(out/'lifecycle-and-fallback.json').write_text(json.dumps(report,indent=2));print(report['passed'],report['failed'],flush=True)
raise SystemExit(report['failed']>0)

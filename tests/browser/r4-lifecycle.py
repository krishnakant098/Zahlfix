"""Synthetic lifecycle/viewport, graceful degradation and static page checks.
Not native mobile, BFCache, virtual-keyboard or Netlify end-to-end certification.
"""
import argparse, json, os, sys, subprocess
from pathlib import Path
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
from harness import ROOT, PUBLIC, markup, module_url, data_url
parser=argparse.ArgumentParser();parser.add_argument('--executable',default=os.environ.get('CHROMIUM_EXECUTABLE') or ('/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None));args=parser.parse_args()
OUT=ROOT/'qa/r4';OUT.mkdir(parents=True,exist_ok=True);results=[]
def rec(name,ok,detail=None):
 results.append({'test':name,'passed':bool(ok),'detail':detail});print(('PASS ' if ok else 'FAIL ')+name,flush=True)
def snap(pg):return pg.evaluate('window.__ZAHLFIX_PHASE1__.snapshot()')
def load(pg,**kwargs):
 pg.set_content(markup(**kwargs),wait_until='domcontentloaded');pg.wait_for_timeout(1400)
def seek(pg,p):pg.evaluate('p=>window.__ZAHLFIX_NAV__.seek(p,true)',p);pg.wait_for_timeout(60)
def static_html(source):
 h=BeautifulSoup(source,'html.parser')
 for l in h.select('link[rel="stylesheet"]'):
  tag=h.new_tag('style');tag.string=(PUBLIC/l['href'].lstrip('/')).read_text();l.replace_with(tag)
 for img in h.select('img[src^="/"]'):img['src']=data_url(PUBLIC/img['src'].lstrip('/'))
 return str(h)
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=args.executable,headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--disable-webgl'])
 ctx=b.new_context(viewport={'width':390,'height':744},has_touch=True);pg=ctx.new_page();load(pg)
 for label,pause,resume in [('page-transition','dispatchEvent(new PageTransitionEvent("pagehide",{persisted:true}))','dispatchEvent(new PageTransitionEvent("pageshow",{persisted:true}))'),('freeze','document.dispatchEvent(new Event("freeze"))','document.dispatchEvent(new Event("resume"))')]:
  pg.evaluate(pause);a=snap(pg);pg.wait_for_timeout(400);c=snap(pg);rec(label+' pauses active orbital time',a['time']==c['time'])
  pg.evaluate(resume);pg.wait_for_timeout(90);d=snap(pg);rec(label+' resume excludes elapsed paused time',0<=d['time']-c['time']<.22,d['time']-c['time'])
 pg.locator('#menuTrigger').click();a=snap(pg);pg.wait_for_timeout(300);rec('open menu pauses orbital time',a['time']==snap(pg)['time']);pg.keyboard.press('Escape')
 seek(pg,.143);p=snap(pg)['p'];pg.set_viewport_size({'width':744,'height':390});pg.wait_for_timeout(850)
 rec('orientation in Z takeover preserves progress',abs(snap(pg)['p']-p)<.002)
 anchor=pg.evaluate('''()=>{const t=e=>new DOMPoint(60,60).matrixTransform(e.getScreenCTM());const a=t(document.querySelector('[data-p1-z-core]')),b=t(document.querySelector('[data-p1-z-takeover]'));return Math.hypot(a.x-b.x,a.y-b.y);}''')
 rec('orientation in takeover keeps the same visible origin',anchor<1,anchor)
 pg.set_viewport_size({'width':390,'height':744});pg.wait_for_timeout(800);seek(pg,.168)
 stable=pg.evaluate('({y:scrollY,h:window.__ZAHLFIX_LAYOUT__.height,p:window.__ZAHLFIX_LAYOUT__.progressAt()})')
 pg.set_viewport_size({'width':390,'height':844});pg.wait_for_timeout(800);now=pg.evaluate('({y:scrollY,h:window.__ZAHLFIX_LAYOUT__.height,p:window.__ZAHLFIX_LAYOUT__.progressAt()})')
 rec('synthetic touch-toolbar expansion keeps stage and scroll stable',stable==now,{'before':stable,'after':now})
 seek(pg,1);pg.locator('#contact-challenge').fill('Preserved during viewport and motion changes.');before=pg.locator('#contact-challenge').input_value()
 # Simulated visible viewport is deliberately not a native on-screen keyboard.
 pg.evaluate('Object.defineProperty(visualViewport,"height",{configurable:true,get:()=>400});visualViewport.dispatchEvent(new Event("resize"))');pg.wait_for_timeout(250)
 rec('synthetic keyboard resize leaves narrative mapping unchanged',pg.evaluate('window.__ZAHLFIX_LAYOUT__.height')==stable['h'])
 rec('synthetic keyboard keeps field reachable in visible region',pg.locator('#contact-challenge').bounding_box()['y']+pg.locator('#contact-challenge').bounding_box()['height']<=400)
 rec('synthetic keyboard does not discard enquiry',pg.locator('#contact-challenge').input_value()==before)
 pg.evaluate('delete visualViewport.height;document.activeElement.blur();visualViewport.dispatchEvent(new Event("resize"))')
 pg.evaluate('document.documentElement.style.fontSize="32px";dispatchEvent(new Event("resize"))');pg.wait_for_timeout(600)
 rec('enlarged root type selects flowing readable presentation',pg.evaluate('document.documentElement.dataset.mode')=='text')
 rec('flowing presentation retains all 20 narrative beats',pg.locator('.story-transcript ol>li').count()==20 and pg.locator('.story-transcript').is_visible())
 rec('in-place fallback retains entered enquiry',pg.locator('#contact-challenge').input_value()==before)
 clock=snap(pg)['time'];pg.evaluate('document.dispatchEvent(new Event("resume"))');pg.wait_for_timeout(300)
 rec('resume cannot restart animation after readable fallback',snap(pg)['time']==clock)
 rec('text fallback clears gold-scene header theme',pg.evaluate('document.documentElement.dataset.theme')=='dark')
 pg.locator('.challenge-trigger').click();rec('text fallback contact navigation reaches natural-flow title',-.5<=pg.locator('#contact-title').bounding_box()['y']<300)
 ctx.close()
 for mode in ['reduced-motion','module-failure','no-javascript']:
  ctx=b.new_context(viewport={'width':320,'height':568},reduced_motion='reduce' if mode=='reduced-motion' else 'no-preference',java_script_enabled=mode!='no-javascript');pg=ctx.new_page()
  load(pg,script=mode!='no-javascript',fail_main=mode=='module-failure')
  rec(mode+' retains readable narrative',pg.locator('.story-transcript ol>li').count()==20 and pg.locator('.story-transcript').is_visible())
  rec(mode+' removes blocking loader',not pg.locator('#siteLoader').is_visible())
  pg.locator('.contact-method a').scroll_into_view_if_needed();rec(mode+' retains direct email access',pg.locator('.contact-method a').is_visible())
  rec(mode+' has no horizontal overflow',pg.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
  ctx.close()
 ctx=b.new_context(viewport={'width':390,'height':844},has_touch=True);pg=ctx.new_page();load(pg)
 u=module_url(PUBLIC/'assets/v6/phase1-visuals.js');pg.evaluate('async u=>{const m=await import(u);m.Phase1Visuals.prototype.render=function(){throw Error("TEST injected scene failure")}}',u);pg.wait_for_timeout(200)
 rec('isolated scene failure retains complete static artwork',pg.locator('.phase1-world.is-fallback [data-p1-doc]').count()==9)
 pg.locator('#continueCue').click();pg.wait_for_timeout(1700);rec('isolated scene failure leaves navigation working',pg.evaluate('document.documentElement.dataset.story')=='consulting');ctx.close()
 # Render GET-generated login/setup templates with a deliberately in-memory Blobs contract.
 script='''import {MemoryStore} from './tests/unit/memory-store.mjs';globalThis.__TEST_BLOB_STORE__=new MemoryStore();import fs from 'node:fs';import {createConfig} from './netlify/functions/_auth.mjs';import login from './netlify/functions/login.mjs';import setup from './netlify/functions/setup.mjs';process.env.ZAHLFIX_SETUP_KEY='fixture-secret';let r=await setup(new Request('https://fixture.invalid/setup'),{});fs.writeFileSync('qa/r4/setup-fixture.html',await r.text());await createConfig('6367');r=await login(new Request('https://fixture.invalid/login'),{});fs.writeFileSync('qa/r4/login-fixture.html',await r.text());'''
 proc=subprocess.run(['node','--import','./tests/unit/register.mjs','--input-type=module','-e',script],cwd=ROOT,capture_output=True,text=True)
 rec('PIN authentication templates generated from request handlers',proc.returncode==0,proc.stderr[-800:])
 pages={'login':OUT/'login-fixture.html','setup':OUT/'setup-fixture.html','impressum':PUBLIC/'impressum.html','datenschutz':PUBLIC/'datenschutz.html'}
 for label,path in pages.items():
  if not path.exists():rec(label+' fixture exists',False);continue
  for width,height in [(320,568),(844,390)]:
   pg=b.new_page(viewport={'width':width,'height':height});pg.set_content(static_html(path.read_text()),wait_until='domcontentloaded');pg.wait_for_timeout(200)
   rec(label+f' {width} has no horizontal clipping',pg.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
   inputs=pg.locator('input:not([type="hidden"])')
   if inputs.count():
    el=inputs.last;el.scroll_into_view_if_needed();bb=el.bounding_box();rec(label+f' {width} input reachable',bb['y']>=0 and bb['y']+bb['height']<=height+.5,bb)
   pg.close()
 b.close()
 # Separate software WebGL availability smoke; not a GPU frame-rate benchmark.
 b=pw.chromium.launch(executable_path=args.executable,headless=True,args=['--no-sandbox','--enable-unsafe-swiftshader']);pg=b.new_page(viewport={'width':390,'height':844});errors=[];pg.on('pageerror',lambda e:errors.append(str(e)));load(pg)
 seek(pg,.39);seek(pg,.68);seek(pg,.87);rec('default WebGL/fallback path initializes later scenes without uncaught errors',not errors,errors)
 rec('ribbon image loads with WebGL enabled',pg.locator('[data-p1-z-core] image').count()==1)
 b.close()
report={'mode':'in-memory fixtures and synthetic viewport/lifecycle/failure injection; authentication templates use in-memory storage; separate software WebGL smoke','passed':sum(r['passed'] for r in results),'failed':sum(not r['passed'] for r in results),'results':results}
(OUT/'lifecycle-fallback.json').write_text(json.dumps(report,indent=2));print(report['passed'],report['failed'],flush=True);sys.exit(report['failed']>0)

"""R4 behavior, real rendered bounds and SVG fidelity. --harness embeds local assets only.
Remote media and deployed CSP/auth are not certified by the harness.
"""
import argparse,json,sys,time,os
from pathlib import Path
from playwright.sync_api import sync_playwright
from harness import ROOT,markup
parser=argparse.ArgumentParser();parser.add_argument('--harness',action='store_true');parser.add_argument('--base-url',default='http://127.0.0.1:4173');parser.add_argument('--executable',default=os.environ.get('CHROMIUM_EXECUTABLE') or ('/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None));parser.add_argument('--profiles',default='small,phone,tablet,landscape,desktop');parser.add_argument('--screenshots',action='store_true');a=parser.parse_args()
profiles={'small':(320,568),'medium':(360,640),'phone':(390,844),'large-phone':(430,932),'tablet':(768,1024),'large-tablet':(1024,1366),'landscape':(844,390),'zoom':(720,450),'desktop':(1440,900)}
OUT=ROOT/'qa/r4';(OUT/'screenshots').mkdir(parents=True,exist_ok=True)
registry=json.loads((ROOT/'public/assets/v6/scene-registry.js').read_text().split('Object.freeze(',1)[1].split('.map(Object.freeze)',1)[0])
results=[];errors=[];layouts=[];runfile=OUT/('acceptance-'+a.profiles.replace(',','-')+'.json')
def record(name,ok,detail=None):
 results.append({'test':name,'passed':bool(ok),'detail':detail});print(('PASS ' if ok else 'FAIL ')+name,flush=True)
 if not ok:print(str(detail)[:1000],flush=True)
 runfile.write_text(json.dumps({'mode':'in-memory Chromium SVG/DOM fixture, WebGL disabled' if a.harness else 'HTTP','passed':sum(x['passed'] for x in results),'failed':sum(not x['passed'] for x in results),'results':results,'errors':errors,'layouts':layouts},indent=2))
def effective(page,selector):return page.locator(selector).evaluate('e=>{let o=1;while(e instanceof Element){o*=Number(getComputedStyle(e).opacity);e=e.parentElement;}return o;}')

def wait_eval(page,expression,arg=None,timeout=8000):
 deadline=time.monotonic()+timeout/1000
 last=None
 while time.monotonic()<deadline:
  try:
   if page.evaluate(expression,arg):return
  except Exception as exc:last=exc
  page.wait_for_timeout(50)
 raise TimeoutError(f"Timed out waiting for browser state: {expression}; last={last}")
def seek(page,p):
 expected=page.evaluate('p=>{window.__ZAHLFIX_NAV__.seek(p,true);return window.__ZAHLFIX_LAYOUT__.progressAt();}',p)
 wait_eval(page,'p=>Math.abs(window.__ZAHLFIX_NAV__.snapshot().progress-p)<.000001',expected,10000);page.wait_for_timeout(30)
def load(page):
 if a.harness:page.set_content(html,wait_until='domcontentloaded')
 else:page.goto(a.base_url+'/?skipintro=1',wait_until='domcontentloaded')
 wait_eval(page,'()=>Boolean(window.__ZAHLFIX_NAV__)',None,8000);page.wait_for_timeout(900)
html=markup() if a.harness else None
with sync_playwright() as pw:
 for label in a.profiles.split(','):
  w,h=profiles[label];browser=pw.chromium.launch(executable_path=a.executable,headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--disable-webgl'])
  ctx=browser.new_context(viewport={'width':w,'height':h},has_touch=label!='desktop',device_scale_factor=1,reduced_motion='no-preference');page=ctx.new_page();page.set_default_timeout(6000)
  if a.harness:page.route('https://**/*',lambda route:route.abort())
  page.on('pageerror',lambda error:errors.append(str(error)[:500]))
  try:
   load(page)
   record(label+': complete opening at scroll zero',page.evaluate('scrollY===0') and effective(page,'[data-p1-space]')>.99)
   record(label+': ribbon surface loaded locally',page.locator('[data-p1-z-core] image').count()==1 and page.locator('.brand img').evaluate('e=>e.complete&&e.naturalWidth>0'))
   snap=page.evaluate('window.__ZAHLFIX_PHASE1__.snapshot()');layouts.append({'label':label,'layout':snap['layout']})
   record(label+': nine records and three precise tracks',len(snap['poses'])==9 and page.locator('[data-p1-orbit]').count()==3)
   headerTargets=page.locator('.topbar a,.topbar button').evaluate_all('els=>els.map(e=>{const b=e.getBoundingClientRect();return {w:b.width,h:b.height};})')
   record(label+': primary touch controls at least 44px high',all(b['h']>=43.5 for b in headerTargets),headerTargets)
   if label!='desktop':record(label+': menu target is at least 44px wide',page.locator('#menuTrigger').bounding_box()['width']>=44)
   page.locator('#continueCue').click();wait_eval(page,'()=>document.documentElement.dataset.story==="consulting"',None,8000);page.wait_for_timeout(1100)
   record(label+': pointer Continue reaches readable consulting state',effective(page,'.story-beat--02')>.97)
   record(label+': focus follows scene navigation',page.locator('#scene-consulting').evaluate('e=>e===document.activeElement'))
   page.locator('#continueCue').focus();page.keyboard.press('Enter');page.wait_for_timeout(1600)
   record(label+': keyboard Continue reaches implementation state',effective(page,'.story-beat--03')>.97)
   for scene in registry:
    target=1 if scene['number']==20 and label!='desktop' else scene['target'];seek(page,target)
    op=effective(page,scene['selector']);record(label+f': scene {scene["number"]:02d} readable hold',op>.85,round(op,4))
    if scene['number']<20:
     bb=page.locator(scene['selector']).evaluate('''e=>{let boxes=[];for(const n of e.querySelectorAll('h1,h2,strong,small,p,.story-number,.kicker,.eyebrow')){if(getComputedStyle(n).display==='none')continue;const r=n.getBoundingClientRect();if(r.width&&r.height)boxes.push({l:r.left,r:r.right,t:r.top,b:r.bottom});}return boxes;}''')
     record(label+f': scene {scene["number"]:02d} text stays within viewport',all(r['l']>=-1 and r['r']<=w+1 and r['t']>=40 and r['b']<=h-48 for r in bb),bb)
    if a.screenshots and scene['number'] in [1,2,3,4,5,9,10,14,19,20]:page.screenshot(path=str(OUT/'screenshots'/f'{label}-{scene["number"]:02d}.png'))
   seek(page,.075);one=page.evaluate('window.__ZAHLFIX_PHASE1__.snapshot().poses');page.wait_for_timeout(300);two=page.evaluate('window.__ZAHLFIX_PHASE1__.snapshot().poses')
   record(label+': capture trajectory stays stable on scroll hold',max(abs(x['x']-y['x'])+abs(x['y']-y['y']) for x,y in zip(one,two))<.05)
   seek(page,.122);anchor=page.locator('[data-p1-z-core]').evaluate('e=>{const p=new DOMPoint(60,60).matrixTransform(e.getScreenCTM());return {x:p.x,y:p.y};}')
   seek(page,.143);wipe=page.locator('[data-p1-z-takeover]').evaluate('e=>{const p=new DOMPoint(60,60).matrixTransform(e.getScreenCTM());return {x:p.x,y:p.y};}')
   record(label+': ribbon takeover origin remains within one CSS pixel',abs(anchor['x']-wipe['x'])<1 and abs(anchor['y']-wipe['y'])<1,{'core':anchor,'wipe':wipe})
   seek(page,.14899)
   coverage=page.evaluate('''()=>{const g=document.querySelector('[data-p1-z-takeover]'),p=document.querySelector('#p1-z-master'),s=window.__ZAHLFIX_PHASE1__.snapshot().layout,m=g.getScreenCTM().inverse();let ok=0;for(let y=0;y<=6;y++)for(let x=0;x<=10;x++)ok+=p.isPointInFill(new DOMPoint(x*(s.w-1)/10,y*(s.h-1)/6).matrixTransform(m))?1:0;return ok;}''')
   record(label+': actual ribbon silhouette covers viewport before handoff',coverage==77,coverage)
   for name,p in [('ring',.168),('unroll',.191),('rail',.21),('curl',.216),('atom',.225)]:
    seek(page,p)
    detail=page.evaluate('''()=>{const s=window.__ZAHLFIX_PHASE1__.snapshot();let error=0;const boxes=[];for(let i=0;i<3;i++){const p=document.querySelector('[data-p1-track="'+i+'"]'),n=document.querySelector('[data-p1-node="'+i+'"]'),pt=p.getPointAtLength(p.getTotalLength()*s.systemPoints[i].fraction);error=Math.max(error,Math.hypot(pt.x-+n.getAttribute('cx'),pt.y-+n.getAttribute('cy'))*s.layout.systemScale);const r=p.getBoundingClientRect();boxes.push({l:r.left,r:r.right,t:r.top,b:r.bottom});}return {error,boxes};}''')
    record(label+': '+name+' nodes track exact drawn curves',detail['error']<.8,detail['error'])
    record(label+': '+name+' geometry stays clear of viewport edges',all(r['l']>=1 and r['r']<=w-1 and r['t']>=64 and r['b']<=h-64 for r in detail['boxes']),detail['boxes'])
    if a.screenshots and name=='atom':page.screenshot(path=str(OUT/'screenshots'/f'{label}-atom.png'))
   seek(page,.39)
   for i in [0,7,9]:
    el=page.locator(f'[data-service-select="{i}"]');el.scroll_into_view_if_needed();el.click();page.wait_for_timeout(800)
    record(label+f': service {i+1:02d} reachable and selectable',el.get_attribute('aria-pressed')=='true')
   seek(page,.522);page.set_viewport_size({'width':h,'height':w});page.wait_for_timeout(1400)
   record(label+': orientation preserves scene progress',abs(page.evaluate('window.__ZAHLFIX_NAV__.snapshot().progress')-.522)<.003)
   page.set_viewport_size({'width':w,'height':h});page.wait_for_timeout(1200)
   page.locator('.challenge-trigger').click();page.wait_for_timeout(2400)
   record(label+': contact CTA lands on visible contact title',page.locator('#contact-title').bounding_box()['y']>=50 and page.locator('#contact-title').bounding_box()['y']<h-40)
   record(label+': header and menu remain reachable in native contact',page.locator('#menuTrigger').is_visible() and 0<=page.locator('#menuTrigger').bounding_box()['y']<h-44)
   if label!='desktop':record(label+': contact belongs to native page flow',page.locator('#contact').evaluate('e=>e.parentElement.id==="app"&&getComputedStyle(e).position==="relative"&&getComputedStyle(e).overflowY==="visible"'))
   for field,value in [('name','Local Test'),('company','Test Company'),('email','test@example.com'),('phone','+49 30 000000'),('challenge','Local acceptance test. Not sent.')]:
    page.locator(f'#challengeForm [name="{field}"]').fill(value)
   before=page.locator('#contact-challenge').input_value()
   page.set_viewport_size({'width':h,'height':w});page.wait_for_timeout(1200)
   record(label+': form text survives orientation',page.locator('#contact-challenge').input_value()==before)
   page.set_viewport_size({'width':w,'height':h});page.wait_for_timeout(1200)
   submit=page.locator('.challenge-submit');submit.scroll_into_view_if_needed();bb=submit.bounding_box()
   record(label+': enquiry action reachable without clipping',bb['y']>=0 and bb['y']+bb['height']<=h+1,bb)
   page.locator('#copyEnquiry').click();page.wait_for_timeout(200)
   record(label+': copy action gives feedback without sending mail',bool(page.locator('#challengeFormStatus').inner_text().strip()))
   page.locator('.contact-legal').scroll_into_view_if_needed();bb=page.locator('.contact-legal').bounding_box();record(label+': legal links reachable',bb['y']>=0 and bb['y']+bb['height']<=h+1,bb)
   if a.screenshots:page.screenshot(path=str(OUT/'screenshots'/f'{label}-contact-controls.png'))
   page.locator('#menuTrigger').click();page.locator('#menuOverlay [data-scene-target="contact"]').scroll_into_view_if_needed()
   record(label+': menu internally scrolls to last destination',page.locator('#menuOverlay [data-scene-target="contact"]').is_visible())
   page.keyboard.press('Escape');record(label+': Escape restores focus to menu trigger',page.locator('#menuTrigger').evaluate('e=>document.activeElement===e'))
   seek(page,.075);seek(page,.963);seek(page,.21);record(label+': reverse/fast seek restores intended reading state',effective(page,'.story-beat--05')>.97)
   record(label+': no horizontal document overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
  except Exception as e:record(label+': unexpected exception',False,str(e)[:1800])
  finally:browser.close()
record('no uncaught browser errors',not errors,errors)
(OUT/'measured-layouts.json').write_text(json.dumps(layouts,indent=2))
(OUT/'layouts.json').write_text(json.dumps(layouts,indent=2))
print(json.dumps({'passed':sum(r['passed'] for r in results),'failed':sum(not r['passed'] for r in results)}),flush=True)
sys.exit(any(not x['passed'] for x in results))

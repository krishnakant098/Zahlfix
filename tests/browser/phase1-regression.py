# HISTORICAL R2/R3 TEST. R4 entrypoints: r4-regression.py, r4-lifecycle.py, r4-assets.py.
"""R3 acceptance: actual poses, path fidelity and continuous-state checks.

Default: HTTP local server. --harness: in-memory DOM fixture for environments that
block browser navigation; does not certify deployed network/CSP or GPU hardware.
"""
from pathlib import Path
import argparse,json,sys,os,time
from playwright.sync_api import sync_playwright
from harness import ROOT,markup,module_url
parser=argparse.ArgumentParser();parser.add_argument('--harness',action='store_true');parser.add_argument('--base-url',default='http://127.0.0.1:4173');parser.add_argument('--executable',default=os.environ.get('CHROMIUM_EXECUTABLE'));parser.add_argument('--profiles',default='desktop,mobile,small,landscape');parser.add_argument('--screenshots',action='store_true');a=parser.parse_args()
PROFILES={'desktop':(1440,900,1),'user-window':(1666,820,1),'large':(1920,1080,1),'mobile':(390,844,2),'small':(320,568,1),'landscape':(844,390,1),'tablet':(768,1024,2),'zoom-equivalent':(720,450,1)}
OUT=ROOT/'qa/r3';(OUT/'screenshots').mkdir(parents=True,exist_ok=True)
results=[];errors=[];layouts=[];perf=[]
report_file=OUT/('browser-acceptance.json' if len(a.profiles.split(','))==8 else 'browser-'+a.profiles.replace(',','-')+'.json')
def record(name,ok,detail=None):
    results.append({'test':name,'passed':bool(ok),'detail':detail});print(('PASS ' if ok else 'FAIL ')+name,flush=True)
    report_file.write_text(json.dumps({'mode':'in-memory DOM fixture' if a.harness else 'HTTP','passed':sum(r['passed'] for r in results),'failed':sum(not r['passed'] for r in results),'results':results,'performance':perf},indent=2))
def snap(page):return page.evaluate('window.__ZAHLFIX_PHASE1__.snapshot()')
def seek(page,v):
    expected=page.evaluate('(v)=>{scrollTo({top:(document.documentElement.scrollHeight-innerHeight)*v,behavior:"instant"});return scrollY/(document.documentElement.scrollHeight-innerHeight);}',v)
    page.wait_for_function('(v)=>Math.abs(window.__ZAHLFIX_PHASE1__.snapshot().p-v)<1e-8',arg=expected,timeout=5000)
    page.wait_for_timeout(30)
def effective(page,selector):
    return page.locator(selector).evaluate('e=>{let o=1;while(e instanceof Element){o*=Number(getComputedStyle(e).opacity);e=e.parentElement;}return o;}')
def geometry_check(page):
    return page.evaluate('''() => {
        const s=window.__ZAHLFIX_PHASE1__.snapshot(),svg=document.querySelector('.p1-svg');
        const errors=[],bounds=[];
        for(let i=0;i<3;i++){
          const path=document.querySelector('[data-p1-track="'+i+'"]'),node=document.querySelector('[data-p1-node="'+i+'"]');
          const target=s.systemPoints[i],pt=path.getPointAtLength(path.getTotalLength()*target.fraction);
          errors.push(Math.hypot(pt.x-+node.getAttribute('cx'),pt.y-+node.getAttribute('cy'))*s.layout.systemScale);
          const b=path.getBoundingClientRect();bounds.push({left:b.left,right:b.right,top:b.top,bottom:b.bottom});
        }
        return {maxError:Math.max(...errors),bounds,systemOpacity:Number(document.querySelector('[data-p1-principle]').getAttribute('opacity'))};
    }''')
html=markup() if a.harness else None
with sync_playwright() as pw:
 opts={'headless':True,'args':['--no-sandbox','--disable-dev-shm-usage']}
 if a.executable:opts['executable_path']=a.executable
 browser=pw.chromium.launch(**opts)
 for label in a.profiles.split(','):
  w,h,dpr=PROFILES[label];ctx=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=dpr,reduced_motion='no-preference');page=ctx.new_page();page.set_default_timeout(6000)
  page.on('pageerror',lambda e:errors.append(str(e)))
  try:
   if a.harness:page.set_content(html,wait_until='domcontentloaded')
   else:page.goto(a.base_url+'/?skipintro=1',wait_until='domcontentloaded')
   page.wait_for_function('window.__ZAHLFIX_PHASE1__');page.wait_for_timeout(1050)
   s=snap(page);layouts.append({'label':label,'layout':s['layout']})
   record(label+': complete opening at EXACT scroll zero',page.evaluate('scrollY===0') and s['p']==0 and effective(page,'[data-p1-space]')>.99)
   record(label+': nine visible document identities and three tracks',page.locator('[data-p1-doc]').count()==9 and page.locator('[data-p1-orbit]').count()==3 and all(x['opacity']==1 for x in s['poses']))
   record(label+': layered metal core, no blur filter',page.locator('[data-p1-z-core]').evaluate('e=>getComputedStyle(e).filter')=='none' and effective(page,'[data-p1-z-core]')>.99)
   record(label+': R3 material stage is active',page.locator('[data-phase1]').get_attribute('data-phase1')=='r3')
   record(label+': one namespace, local gradients and no SVG filters',page.locator('.p1-svg filter').count()==0 and page.locator('#p1m-gold-face').count()==1 and page.locator('#p1m-bead-ink').count()==1)
   record(label+': core uses layered satin material',page.locator('[data-p1-z-core] [data-material="satin-gold"]').count()==1 and page.locator('[data-p1-z-core] use').count()>=3)
   record(label+': orbit material retains front/back separation',page.locator('.p1-orbit-near').count()==3 and page.locator('.p1-orbit-far').count()==3)
   record(label+': no duplicate SVG IDs',page.evaluate('(()=>{const ids=[...document.querySelectorAll("[id]")].map(e=>e.id);return new Set(ids).size===ids.length;})()'))
   bb=page.locator('[data-p1-doc]').evaluate_all('els=>els.map(e=>{const b=e.getBoundingClientRect();return {left:b.left,right:b.right,top:b.top,bottom:b.bottom};})')
   record(label+': individual document bounds on screen',all(r['left']>=0 and r['right']<=w and r['top']>=70 and r['bottom']<=h-54 for r in bb),bb)
   if a.screenshots:page.screenshot(path=str(OUT/'screenshots'/f'{label}-01.png'))
   # At most 2 captures; wall-clock pause must not alter locked trajectories.
   seek(page,.075);s=snap(page)
   record(label+': ordered capture at scene 02 reading state',sum(x['state']=='capture' for x in s['poses']) in [1,2] and any(x['state']=='captured' for x in s['poses']) and any(x['state']=='orbit' for x in s['poses']))
   page.wait_for_timeout(500);one=snap(page);page.wait_for_timeout(250);two=snap(page)
   delta=max(((x['x']-y['x'])**2+(x['y']-y['y'])**2)**.5 for x,y in zip(one['poses'],two['poses']))
   record(label+': no trajectory drift during scroll hold',delta<.02,delta)
   if a.screenshots:page.screenshot(path=str(OUT/'screenshots'/f'{label}-02.png'))
   seek(page,.122);s=snap(page)
   record(label+': same nine identities form complete matrix',all(x['state']=='matrix' and x['opacity']==1 for x in s['poses']))
   record(label+': implementation module visible behind completed matrix',effective(page,'[data-p1-module]')>.99)
   core=page.locator('[data-p1-z-core]').evaluate('e=>{const p=new DOMPoint(60,60).matrixTransform(e.getScreenCTM());return {x:p.x,y:p.y};}')
   if a.screenshots:page.screenshot(path=str(OUT/'screenshots'/f'{label}-03.png'))
   seek(page,.143)
   wipe=page.locator('[data-p1-z-takeover]').evaluate('e=>{const p=new DOMPoint(60,60).matrixTransform(e.getScreenCTM());return {x:p.x,y:p.y};}')
   record(label+': shared Z origin below 1 CSS pixel error',abs(core['x']-wipe['x'])<1 and abs(core['y']-wipe['y'])<1,{'core':core,'wipe':wipe})
   record(label+': fine Z material simplifies during expansion',effective(page,'[data-p1-wipe-material]')<.1)
   record(label+': one Z visible during takeover, no early flat gold',effective(page,'[data-p1-z-core]')<.01 and effective(page,'[data-p1-z-takeover]')>.99 and page.locator('.field--yellow').evaluate('e=>Number(getComputedStyle(e).opacity)')==0)
   if a.screenshots:page.screenshot(path=str(OUT/'screenshots'/f'{label}-wipe.png'))
   seek(page,.14899)
   coverage=page.evaluate('''()=>{const s=window.__ZAHLFIX_PHASE1__.snapshot(),g=document.querySelector('[data-p1-z-takeover]'),path=document.querySelector('#p1-z-master'),inv=g.getScreenCTM().inverse();let total=0,covered=0;for(let y=0;y<=8;y++)for(let x=0;x<=12;x++){total++;const p=new DOMPoint(x*(s.layout.w-1)/12,y*(s.layout.h-1)/8).matrixTransform(inv);covered+=path.isPointInFill(p)?1:0;}return {total,covered};}''')
   record(label+': actual Z fill covers the viewport before gold handoff',coverage['total']==coverage['covered'],coverage)
   seek(page,.1492);record(label+': completed wipe resolves to opaque gold',page.locator('.field--yellow').evaluate('e=>Number(getComputedStyle(e).opacity)')==1)
   for name,v in [('04',.168),('unroll',.191),('05',.21),('curl',.216),('atom',.225)]:
    seek(page,v);g=geometry_check(page)
    record(label+f': {name} nodes remain on their exact paths',g['maxError']<=.75,g['maxError'])
    record(label+f': {name} track bounds stay within safe viewport',all(b['left']>=2 and b['right']<=w-24 and b['top']>=80 and b['bottom']<=h-54 for b in g['bounds']),g['bounds'])
    record(label+f': {name} material subpaths share exact cubic sections',page.evaluate('''()=>[...document.querySelectorAll('[data-p1-material-segment]')].every(g=>{const paths=[...g.querySelectorAll('path')].map(e=>e.getAttribute('d'));return paths.length===4&&paths.every(d=>d===paths[0]);})'''))
    if name=='05':record(label+': rail terminals present and circular calibration retired',effective(page,'[data-p1-rail-terminals]')>.99 and effective(page,'[data-p1-system-calibration]')<.01)
    if name=='atom':
     record(label+': atom segments and beads share back-to-front ordering',page.evaluate('''()=>{const a=[...document.querySelector('[data-p1-system-depth]').children].map(g=>g.classList.contains('p1-atom-core')?0:Number(g.getAttribute('data-depth')));return a.every((v,i)=>!i||v>=a[i-1]-.0002); }'''))
     record(label+': dimensional brand nucleus is resolved',page.locator('.p1-atom-core [data-material="ink-brass"]').count()==1)
    if a.screenshots:page.screenshot(path=str(OUT/'screenshots'/f'{label}-{name}.png'))
   record(label+': final atom AND copy fully visible before fade',effective(page,'[data-p1-principle]')>.98 and effective(page,'.p1-atom-core')>.98 and effective(page,'.story-beat--05')>.98)
   record(label+': atom uses the same silhouette and three real SVG paths',page.locator('.p1-atom-core use').evaluate_all("els=>els.length>=3 && els.every(e=>e.getAttribute('href')==='#p1-z-master')") and page.locator('path[data-p1-track]').count()==3)
   # Reverse traversal exact geometry state, independent of wall time.
   seek(page,.191);a_paths=page.locator('[data-p1-track]').evaluate_all('els=>els.map(e=>e.getAttribute("d"))')
   seek(page,.225);seek(page,.191);b_paths=page.locator('[data-p1-track]').evaluate_all('els=>els.map(e=>e.getAttribute("d"))')
   record(label+': reverse scrubbing reproduces the same geometry',a_paths==b_paths)
   seek(page,0);page.wait_for_timeout(250);page.locator('#menuTrigger').click();page.wait_for_timeout(80);s1=snap(page);page.wait_for_timeout(220);s2=snap(page)
   record(label+': menu pauses ambient orbital clock',s1['time']==s2['time'])
   page.locator('#menuClose').click();page.wait_for_timeout(100);s3=snap(page)
   record(label+': menu close resumes without accumulated time jump',0<=s3['time']-s2['time']<.20,s3['time']-s2['time'])
   record(label+': no horizontal document overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
   if label in ['desktop','mobile']:
    intervals=page.evaluate('''()=>new Promise(resolve=>{let last=0,values=[];const tick=t=>{if(last)values.push(t-last);last=t;if(values.length<180)requestAnimationFrame(tick);else resolve(values);};requestAnimationFrame(tick);})''')
    st=snap(page)['stats'];vals=sorted(intervals);costs=sorted(st['samples']);perf.append({'profile':label,'environment':'headless Chromium, in-memory harness' if a.harness else 'headless Chromium HTTP','frameIntervalP95Ms':vals[int(.95*(len(vals)-1))],'frameIntervalMaxMs':max(vals),'phase1UpdateP95Ms':costs[int(.95*(len(costs)-1))],'samples':len(vals),'frameIntervals':intervals})
    record(label+': measured render samples finite',all(x>=0 for x in costs),perf[-1])
  except Exception as e:record(label+': suite completed',False,str(e))
  ctx.close()
 browser.close()
record('no uncaught R3 browser errors',not errors,errors)
(OUT/('measured-layouts-'+a.profiles.replace(',','-')+'.json')).write_text(json.dumps(layouts,indent=2))
# Maintain the measured-layout input for the separate ten-minute numerical sweep.
layout_file=OUT/'layouts.json'
prior=json.loads(layout_file.read_text()) if layout_file.exists() else []
merged={row['label']:row for row in prior}
for row in layouts:merged[row['label']]=row
layout_file.write_text(json.dumps(list(merged.values()),indent=2))
print(json.dumps({'passed':sum(x['passed'] for x in results),'failed':sum(not x['passed'] for x in results)},indent=2),flush=True)
raise SystemExit(any(not x['passed'] for x in results))

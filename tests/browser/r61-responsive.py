"""R6.1 responsive authenticated-entry target checks."""
import json, os, sys
from pathlib import Path
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
from harness import ROOT, PUBLIC, markup, data_url, module_url

OUT=ROOT/'qa/r61';OUT.mkdir(parents=True,exist_ok=True)
EXE=os.environ.get('CHROMIUM_EXECUTABLE') or '/usr/bin/chromium'
results=[]
def rec(name,ok,detail=None):
    results.append({'test':name,'passed':bool(ok),'detail':detail});print(('PASS ' if ok else 'FAIL ')+name,flush=True)

def embedded_login():
    h=BeautifulSoup((OUT/'login.html').read_text(),'html.parser')
    for link in h.select('link[rel="stylesheet"]'):
        tag=h.new_tag('style');tag.string=(PUBLIC/link['href'].lstrip('/')).read_text();link.replace_with(tag)
    for img in h.select('img[src^="/"]'):img['src']=data_url(PUBLIC/img['src'].lstrip('/'))
    for script in h.select('script[src^="/"]'):script.decompose()
    return str(h)

if not (OUT/'login.html').exists():
    print('FAIL R6.1 login fixture missing; run r61-entry.py first',flush=True);sys.exit(1)
login_html=embedded_login()
viewports=[('phone',390,844,True),('tablet',768,1024,True),('landscape',844,390,False)]
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=EXE,headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--disable-webgl'])
    for name,w,h,mobile in viewports:
        ctx=browser.new_context(viewport={'width':w,'height':h},is_mobile=mobile,has_touch=mobile)
        page=ctx.new_page();page.set_content(login_html,wait_until='domcontentloaded')
        page.evaluate("()=>{window.fetch=async()=>new Response(JSON.stringify({ok:true,next:'/',entry:'authenticated-orbit'}),{status:200,headers:{'Content-Type':'application/json'}})}")
        page.add_script_tag(content=(PUBLIC/'assets/login-transition.js').read_text());page.fill('#pin','6367');page.click('#loginForm button');page.wait_for_timeout(500)
        bridge=page.evaluate("()=>window.__ZAHLFIX_LOGIN__.snapshot().bridge")
        rec(f'{name}: login bridge stays horizontally bounded by clipped stage',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),bridge)
        ctx.close()

        ctx=browser.new_context(viewport={'width':w,'height':h},is_mobile=mobile,has_touch=mobile)
        page=ctx.new_page();page.set_content(markup(script=False),wait_until='domcontentloaded')
        page.evaluate("""b=>{const r=document.documentElement;r.style.setProperty('--entry-start-x',b.cx+'px');r.style.setProperty('--entry-start-y',b.cy+'px');r.style.setProperty('--entry-start-w',b.width+'px');r.style.setProperty('--entry-start-core',b.core+'px');r.classList.add('entry-auth-pending');window.__ZAHLFIX_ENTRY_BOOT__={authenticated:true,entry:{mode:'authenticated-orbit-v2'},start:b};}""",bridge)
        page.add_script_tag(type='module',url=module_url(PUBLIC/'assets/v6/boot.js'))
        page.wait_for_function('()=>Boolean(window.__ZAHLFIX_NAV__)');page.wait_for_function('()=>document.documentElement.classList.contains("entry-phase1-reveal")',timeout=5000)
        target=page.evaluate("()=>{const L=window.__ZAHLFIX_PHASE1__.snapshot().layout,r=document.querySelector('#main-stage').getBoundingClientRect(),b=document.querySelector('#entryBridge').getBoundingClientRect();return {e:{x:r.left+L.cx,y:r.top+L.cy,w:L.radii[2]*2.4},a:{x:b.left+b.width/2,y:b.top+b.height/2,w:b.width},mobile:L.mobile}}")
        rec(f'{name}: bridge lands on responsive Scene 01 center',abs(target['a']['x']-target['e']['x'])<6 and abs(target['a']['y']-target['e']['y'])<6,target)
        rec(f'{name}: bridge scale matches responsive Scene 01',abs(target['a']['w']-target['e']['w'])<7,target)
        ctx.close()
    browser.close()
report={'passed':sum(r['passed'] for r in results),'failed':sum(not r['passed'] for r in results),'results':results}
(OUT/'r61-responsive.json').write_text(json.dumps(report,indent=2));print(json.dumps({'passed':report['passed'],'failed':report['failed']}),flush=True);sys.exit(report['failed']>0)

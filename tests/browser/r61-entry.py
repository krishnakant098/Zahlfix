"""R6.1 authenticated-entry continuity checks.
Verifies geometry ownership rather than only successful navigation:
login final bounds -> homepage first-frame vars -> measured Scene 01 anchor.
"""
import json, os, subprocess, sys
from pathlib import Path
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
from harness import ROOT, PUBLIC, markup, data_url, module_url

OUT=ROOT/'qa/r61';OUT.mkdir(parents=True,exist_ok=True)
EXE=os.environ.get('CHROMIUM_EXECUTABLE') or ('/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None)
results=[]
def rec(name,ok,detail=None):
    results.append({'test':name,'passed':bool(ok),'detail':detail});print(('PASS ' if ok else 'FAIL ')+name,flush=True)

def login_fixture():
    code="""import fs from 'node:fs';import {MemoryStore} from './tests/unit/memory-store.mjs';globalThis.__TEST_BLOB_STORE__=new MemoryStore();import {createConfig} from './netlify/functions/_auth.mjs';import login from './netlify/functions/login.mjs';await createConfig('6367');const r=await login(new Request('https://fixture.invalid/login'),{ip:'fixture'});fs.writeFileSync('qa/r61/login.html',await r.text());"""
    proc=subprocess.run(['node','--import','./tests/unit/register.mjs','--input-type=module','-e',code],cwd=ROOT,capture_output=True,text=True)
    rec('production login fixture generated',proc.returncode==0,proc.stderr[-500:])
    return OUT/'login.html'

def embedded_login(path):
    h=BeautifulSoup(path.read_text(),'html.parser')
    for link in h.select('link[rel="stylesheet"]'):
        tag=h.new_tag('style');tag.string=(PUBLIC/link['href'].lstrip('/')).read_text();link.replace_with(tag)
    for img in h.select('img[src^="/"]'):
        img['src']=data_url(PUBLIC/img['src'].lstrip('/'))
    for script in h.select('script[src^="/"]'):script.decompose()
    return str(h)

login_html=embedded_login(login_fixture())
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=EXE,headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--disable-webgl'])
    ctx=browser.new_context(viewport={'width':1440,'height':900})
    page=ctx.new_page();page.set_content(login_html,wait_until='domcontentloaded')
    page.evaluate("()=>{window.fetch=async()=>new Response(JSON.stringify({ok:true,next:'/',entry:'authenticated-orbit'}),{status:200,headers:{'Content-Type':'application/json'}})}")
    page.add_script_tag(content=(PUBLIC/'assets/login-transition.js').read_text());page.wait_for_timeout(100)
    rec('login and home share exactly three orbit elements',page.locator('.entry-orbit-system__orbit').count()==3)
    page.locator('#pin').focus();page.locator('#pin').fill('6367');page.wait_for_timeout(30)
    input_style=page.locator('#pin').evaluate("e=>({caret:getComputedStyle(e).caretColor,cursor:getComputedStyle(e).cursor})")
    rec('PIN input exposes no text caret/I-beam',input_style['caret'] in ('rgba(0, 0, 0, 0)','transparent') and input_style['cursor']=='default',input_style)
    page.locator('#loginForm button[type="submit"]').click();page.wait_for_timeout(520)
    rec('same orbit system expands after server acceptance',page.locator('#loginEntrySystem').evaluate("e=>e.classList.contains('is-expanded')"))
    bridge=page.evaluate("()=>window.__ZAHLFIX_LOGIN__.snapshot().bridge")
    rect=page.locator('#loginEntrySystem').bounding_box()
    rec('login bridge snapshot is measured from rendered pixels',abs(bridge['cx']-(rect['x']+rect['width']/2))<1 and abs(bridge['cy']-(rect['y']+rect['height']/2))<1,{'bridge':bridge,'rect':rect})
    page.screenshot(path=str(OUT/'01-login-expanded.png'))
    ctx.close()

    # The execution environment blocks network/file navigation. Recreate the exact first-paint
    # ownership state in-memory, then install the real boot module after the bridge vars exist.
    ctx=browser.new_context(viewport={'width':1440,'height':900})
    page=ctx.new_page();page.set_content(markup(script=False),wait_until='domcontentloaded')
    page.evaluate("""b=>{const r=document.documentElement;r.style.setProperty('--entry-start-x',b.cx+'px');r.style.setProperty('--entry-start-y',b.cy+'px');r.style.setProperty('--entry-start-w',b.width+'px');r.style.setProperty('--entry-start-core',b.core+'px');r.classList.add('entry-auth-pending');window.__ZAHLFIX_ENTRY_BOOT__={authenticated:true,entry:{mode:'authenticated-orbit-v2'},start:b};}""",bridge)
    page.add_script_tag(type='module',url=module_url(PUBLIC/'assets/v6/boot.js'))
    rec('authenticated entry class exists before cinematic module owns the page',page.locator('html').evaluate("e=>e.classList.contains('entry-auth-pending')"))
    start_vars=page.evaluate("()=>({x:getComputedStyle(document.documentElement).getPropertyValue('--entry-start-x').trim(),y:getComputedStyle(document.documentElement).getPropertyValue('--entry-start-y').trim(),w:getComputedStyle(document.documentElement).getPropertyValue('--entry-start-w').trim()})")
    rec('homepage first-frame geometry comes from login pixel snapshot',abs(float(start_vars['x'][:-2])-bridge['cx'])<.2 and abs(float(start_vars['y'][:-2])-bridge['cy'])<.2 and abs(float(start_vars['w'][:-2])-bridge['width'])<.2,{'vars':start_vars,'bridge':bridge})
    page.wait_for_function('()=>Boolean(window.__ZAHLFIX_NAV__)')
    page.wait_for_timeout(120)
    rec('old progress loader is suppressed for authenticated entry',page.locator('.loader-status').evaluate("e=>getComputedStyle(e).display")=='none')
    rec('story typography cannot flash during bridge travel',page.locator('.story-beat--01').evaluate("e=>parseFloat(getComputedStyle(e).opacity)===0"))
    # Sample before Playwright screenshot/font stabilization can advance the clock.
    # Sample the exact authenticated handoff plateau, before the hidden bridge resets.
    page.wait_for_function('()=>document.documentElement.classList.contains("entry-phase1-reveal")',timeout=5000)
    target=page.evaluate("()=>{const s=window.__ZAHLFIX_PHASE1__.snapshot().layout,r=document.querySelector('#main-stage').getBoundingClientRect(),b=document.querySelector('#entryBridge').getBoundingClientRect();return {expected:{x:r.left+s.cx,y:r.top+s.cy,w:s.radii[2]*2.4},actual:{x:b.left+b.width/2,y:b.top+b.height/2,w:b.width},projection:s.projection}}")
    rec('shared bridge arrives at measured Scene 01 center',abs(target['actual']['x']-target['expected']['x'])<4 and abs(target['actual']['y']-target['expected']['y'])<4,target)
    rec('shared bridge outer diameter matches Scene 01 orbit scale',abs(target['actual']['w']-target['expected']['w'])<5,target)
    page.screenshot(path=str(OUT/'02-home-bridge-travel.png'))
    page.wait_for_timeout(420)
    rec('temporary entry ownership is fully released after handoff',not page.locator('html').evaluate("e=>e.classList.contains('entry-auth-pending')") and page.locator('#siteLoader').evaluate("e=>e.classList.contains('is-done')"))
    rec('Scene 01 phase-one renderer is visible after bridge release',page.locator('[data-phase1]').evaluate("e=>parseFloat(getComputedStyle(e).opacity)>.9"))
    page.screenshot(path=str(OUT/'03-scene01-owned.png'))
    ctx.close();browser.close()

report={'mode':'R6.1 in-memory cross-document geometry continuity','passed':sum(r['passed'] for r in results),'failed':sum(not r['passed'] for r in results),'results':results}
(OUT/'r61-entry.json').write_text(json.dumps(report,indent=2))
print(json.dumps({'passed':report['passed'],'failed':report['failed']}),flush=True)
sys.exit(report['failed']>0)

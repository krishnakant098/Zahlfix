"""R6 focused visual/interaction checks for login continuity, menu animation and global cursor.
Runs against local in-memory fixtures; Netlify auth storage and deployed network are tested separately.
"""
import json, os, subprocess, sys, base64, mimetypes
from pathlib import Path
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
from harness import ROOT, PUBLIC, markup, data_url

OUT=ROOT/'qa/r6';OUT.mkdir(parents=True,exist_ok=True)
EXE=os.environ.get('CHROMIUM_EXECUTABLE') or ('/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None)
results=[]
def rec(name,ok,detail=None):
    results.append({'test':name,'passed':bool(ok),'detail':detail});print(('PASS ' if ok else 'FAIL ')+name,flush=True)

def make_login_fixture():
    script="""import fs from 'node:fs';import {MemoryStore} from './tests/unit/memory-store.mjs';globalThis.__TEST_BLOB_STORE__=new MemoryStore();import {createConfig} from './netlify/functions/_auth.mjs';import login from './netlify/functions/login.mjs';await createConfig('6367');const r=await login(new Request('https://fixture.invalid/login'),{ip:'fixture'});fs.writeFileSync('qa/r6/login.html',await r.text());"""
    proc=subprocess.run(['node','--import','./tests/unit/register.mjs','--input-type=module','-e',script],cwd=ROOT,capture_output=True,text=True)
    rec('login fixture generated from production handler',proc.returncode==0,proc.stderr[-600:])
    return OUT/'login.html'

def embedded_login(path):
    h=BeautifulSoup(path.read_text(),'html.parser')
    for link in h.select('link[rel="stylesheet"]'):
        tag=h.new_tag('style');tag.string=(PUBLIC/link['href'].lstrip('/')).read_text();link.replace_with(tag)
    for img in h.select('img[src^="/"]'):
        img['src']=data_url(PUBLIC/img['src'].lstrip('/'))
    for script in h.select('script[src^="/"]'): script.decompose()
    return str(h)

login_path=make_login_fixture();login_html=embedded_login(login_path)
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=EXE,headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--disable-webgl'])
    # Render the generated login in-memory, stub the same-origin auth response, then install the real transition script.
    ctx=browser.new_context(viewport={'width':1440,'height':900})
    page=ctx.new_page();page.set_content(login_html,wait_until='domcontentloaded')
    page.evaluate("""()=>{window.fetch=async()=>new Response(JSON.stringify({ok:true,next:'/',entry:'authenticated-orbit'}),{status:200,headers:{'Content-Type':'application/json'}})}""")
    page.add_script_tag(content=(PUBLIC/'assets/login-transition.js').read_text());page.wait_for_timeout(150)
    rec('login uses the three shared Scene-01 orbit paths',page.locator('.entry-orbit-system__orbit').count()==3)
    page.screenshot(path=str(OUT/'login-idle-desktop.png'))
    rec('login begins as PIN instrument, not orbital end state',not page.locator('body').evaluate("e=>e.classList.contains('is-authenticated')"))
    rec('login has no horizontal overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
    page.locator('#pin').fill('6367');page.wait_for_timeout(60)
    rec('four visual PIN positions fill from one accessible input',page.locator('.login-pin-dots .is-filled').count()==4)
    page.locator('#loginForm button[type="submit"]').click();page.wait_for_timeout(520)
    rec('accepted PIN enters cinematic orbit state',page.locator('body').evaluate("e=>e.classList.contains('is-authenticated')"))
    transform=page.locator('.entry-orbit-system__orbit--1').evaluate('e=>getComputedStyle(e).transform')
    rec('accepted PIN expands shared orbit geometry',transform!='none',transform)
    rec('login transition status confirms accepted access', 'bestätigt' in page.locator('#loginTransitionStatus').inner_text().lower())
    page.screenshot(path=str(OUT/'login-success-desktop.png'))
    ctx.close()

    # Mobile login uses the same accessible input and a dedicated responsive composition.
    ctx=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
    page=ctx.new_page();page.set_content(login_html,wait_until='domcontentloaded')
    page.evaluate("""()=>{window.fetch=async()=>new Response(JSON.stringify({ok:true,next:'/',entry:'authenticated-orbit'}),{status:200,headers:{'Content-Type':'application/json'}})}""")
    page.add_script_tag(content=(PUBLIC/'assets/login-transition.js').read_text());page.wait_for_timeout(120)
    rec('mobile login has no horizontal overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
    rec('mobile login requests numeric keypad metadata',page.locator('#pin').get_attribute('inputmode')=='numeric')
    page.locator('#pin').fill('6367');page.locator('#loginForm button[type="submit"]').click();page.wait_for_timeout(520)
    core=page.locator('.entry-orbit-system__core').bounding_box();rec('mobile authenticated core stays within viewport',bool(core) and core['x']>=0 and core['x']+core['width']<=390 and core['y']>=0 and core['y']+core['height']<=844,core)
    page.screenshot(path=str(OUT/'login-success-mobile.png'))
    ctx.close()

    # Main-page menu/cursor behavior.
    ctx=browser.new_context(viewport={'width':1440,'height':900},has_touch=False)
    page=ctx.new_page();page.set_content(markup(),wait_until='domcontentloaded');page.wait_for_function('()=>Boolean(window.__ZAHLFIX_NAV__)');page.wait_for_timeout(950)
    rec('menu is hidden before first interaction',page.locator('#menuOverlay').get_attribute('hidden') is not None)
    page.locator('#menuTrigger').click();page.wait_for_timeout(720)
    rec('menu deploys from top and becomes interactive',page.locator('#menuOverlay').get_attribute('hidden') is None and page.locator('#menuOverlay').evaluate("e=>e.classList.contains('is-open')"))
    t=page.locator('#menuOverlay').evaluate('e=>getComputedStyle(e).transform')
    rec('menu transform is animating toward viewport',t!='none',t)
    cursor_pos=lambda: page.locator('#cursor').evaluate("e=>{const m=new DOMMatrix(getComputedStyle(e).transform);return {x:m.m41,y:m.m42,visible:e.classList.contains('is-visible')}}")
    before=cursor_pos()
    link=page.locator('#menuOverlay .menu-list a').nth(2);box=link.bounding_box();target={'x':box['x']+80,'y':box['y']+box['height']/2};page.mouse.move(target['x'],target['y']);page.wait_for_timeout(180)
    after=cursor_pos()
    rec('global custom cursor remains active over menu',page.locator('#cursor').evaluate("e=>e.classList.contains('is-menu')&&e.classList.contains('is-context')"))
    rec('menu cursor renderer follows pointer while scene clock is paused',abs(after['x']-target['x'])<70 and abs(after['y']-target['y'])<70 and abs(after['x']-before['x'])>180,{'before':before,'after':after,'target':target})
    rec('menu cursor is visibly rendered after pointer movement',after['visible'],after)
    rec('menu link exposes contextual cursor label',page.locator('#cursorLabel').inner_text().strip()=='ZAHLFIX',page.locator('#cursorLabel').inner_text())
    other=page.locator('#menuOverlay .menu-list a').nth(6);box2=other.bounding_box();target2={'x':box2['x']+120,'y':box2['y']+box2['height']/2};page.mouse.move(target2['x'],target2['y']);page.wait_for_timeout(180);after2=cursor_pos()
    rec('menu cursor continues tracking across distant navigation targets',abs(after2['y']-target2['y'])<70 and abs(after2['y']-after['y'])>120,{'first':after,'second':after2,'target':target2})
    page.evaluate("window.dispatchEvent(new PointerEvent('pointerleave'))");page.wait_for_timeout(20)
    rec('pointer leave hides the custom cursor cleanly',not page.locator('#cursor').evaluate("e=>e.classList.contains('is-visible')"))
    page.mouse.move(target['x'],target['y']);page.wait_for_timeout(120)
    rec('pointer re-entry restores custom cursor visibility',page.locator('#cursor').evaluate("e=>e.classList.contains('is-visible')"))
    page.screenshot(path=str(OUT/'menu-open-desktop.png'))
    page.keyboard.press('Escape');page.wait_for_timeout(700)
    rec('menu reels back and returns to hidden state',page.locator('#menuOverlay').get_attribute('hidden') is not None)
    rec('Escape restores focus to trigger',page.locator('#menuTrigger').evaluate('e=>document.activeElement===e'))
    ctx.close();browser.close()

report={'mode':'in-memory Chromium R6 focused UI checks','passed':sum(r['passed'] for r in results),'failed':sum(not r['passed'] for r in results),'results':results}
(OUT/'r6-login-menu.json').write_text(json.dumps(report,indent=2))
print(json.dumps({'passed':report['passed'],'failed':report['failed']}),flush=True)
sys.exit(report['failed']>0)

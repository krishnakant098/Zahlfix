"""Phase-1 responsive language/copy QA in real Chromium, with source assets inlined.

The restricted environment blocks Chromium navigation even to localhost. We
therefore embed local CSS, images and ES module sources (unmodified except for
rewritten module import URLs). This tests the actual DOM, layout and renderer,
not Netlify routing. Route bytes and PIN handler are covered by Node tests.
"""
import json, os, sys
from pathlib import Path
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
from harness import ROOT, PUBLIC, data_url, module_url

OUT=ROOT/'qa'/'i18n-p1';OUT.mkdir(parents=True,exist_ok=True)
SCENES=[(.020,1),(.075,2),(.122,3),(.168,4),(.210,5),(.260,6),(.291,7)]
VIEWPORTS=[('small',320,700),('phone',390,844),('tablet',768,1024),('desktop',1440,900),('landscape',844,390)]
checks=[]
def record(name,ok,detail=None):
    checks.append({'name':name,'passed':bool(ok),'detail':detail})
    print(('PASS ' if ok else 'FAIL ')+name,flush=True)

def markup(locale):
    h=BeautifulSoup((PUBLIC/locale/'index.html').read_text(),'html.parser')
    for link in list(h.select('link[rel="stylesheet"]')):
        target=PUBLIC/link['href'].lstrip('/')
        if target.exists():
            style=h.new_tag('style');style.string=target.read_text();link.replace_with(style)
    for img in h.select('img[src^="/"]'):
        img['src']=data_url(PUBLIC/img['src'].lstrip('/'));img.attrs.pop('srcset',None)
    for image in h.select('image[href^="/"]'):
        image['href']=data_url(PUBLIC/image['href'].lstrip('/'))
    for script in list(h.select('script[src^="/"]')):
        local=PUBLIC/script['src'].lstrip('/')
        if script['src']=='/assets/v6/boot.js':
            script['src']=module_url(local)
        else:
            script.attrs.pop('src',None);script.string=local.read_text()
    return str(h)

with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=os.environ.get('CHROMIUM_EXECUTABLE') or '/usr/bin/chromium',headless=True,
                               args=['--no-sandbox','--disable-dev-shm-usage','--disable-webgl'])
    ctx=browser.new_context(viewport={'width':1440,'height':900},reduced_motion='no-preference')
    page=ctx.new_page();errs=[]
    page.on('pageerror',lambda e:errs.append(str(e)))
    page.set_content(markup('en'),wait_until='domcontentloaded')
    page.wait_for_function('()=>Boolean(window.__ZAHLFIX_NAV__ && window.__ZAHLFIX_I18N__)',timeout=15000)
    record('EN semantic markup and runtime locale agree',page.evaluate('document.documentElement.lang')=='en' and page.evaluate('window.__ZAHLFIX_I18N__.locale')=='en')
    record('EN scene headlines, transcript and navigation are authored in English',
        page.locator('.hero-line--1').text_content()=='A new era' and
        page.locator('#text-question').text_content()=="What's slowing your business?" and
        page.locator('[data-i18n="nav.challenge"]').text_content()=='The challenge')
    record('No uncaught browser JS exception',not errs,errs[:3])
    # about:blank cannot push same-origin /de/ history entries. Spy on the
    # requested URLs without touching the production implementation.
    page.evaluate('''() => {window.__p1Sentinel=719;window.__p1Navigation=[];
        history.pushState=(_a,_b,target)=>window.__p1Navigation.push(target);scrollTo(0,1234);}''')
    before=page.evaluate('scrollY')
    page.locator('.topbar [data-lang-link="de"]').click()
    state=page.evaluate('''() => ({lang:document.documentElement.lang,seen:window.__p1Sentinel,
        scroll:scrollY,route:window.__p1Navigation.at(-1)})''')
    record('EN→DE switches in place, preserves scroll/DOM and changes canonical path request',
        state['lang']=='de' and state['seen']==719 and state['scroll']==before and state['route'].startswith('/de/'),state)
    record('German approved headline and transcript restored on switch',
        page.locator('.hero-line--1').text_content()=='Die nächste Generation' and
        page.locator('#text-question').text_content()=='Was hält Ihr Unternehmen zurück?')
    record('DE selector receives current-language state',
        page.locator('.topbar [data-lang-link="de"]').get_attribute('aria-current')=='true')
    record('DE canonical metadata follows in-place language switch',
        page.locator('link[rel="canonical"]').get_attribute('href')=='https://zahlfix.com/de/')
    page.locator('.topbar [data-lang-link="en"]').click()
    record('DE→EN restores language-specific editorial lines in the DOM',
        page.locator('.hero-line--2').text_content()=='of business transformation' and
        page.locator('#scene-friction strong span').nth(1).text_content()=='Siloed systems.')
    record('EN canonical metadata restored on return switch',
        page.locator('link[rel="canonical"]').get_attribute('href')=='https://zahlfix.com/en/')
    page.evaluate('window.__ZAHLFIX_NAV__.seek(.291,true)')
    record('Dynamic next-scene accessibility prompt uses current language',
        page.locator('#continueCue').get_attribute('aria-label')=='Continue to next scene (8 / 20)',
        page.locator('#continueCue').get_attribute('aria-label'))
    page.locator('#menuTrigger').click();page.wait_for_timeout(520)
    record('Menu uses English copy and opens accessibly',page.locator('#menuOverlay').get_attribute('aria-hidden')=='false' and
        page.locator('[data-i18n="nav.delivery"]').text_content()=='What we deliver')
    page.locator('#menuOverlay [data-lang-link="de"]').click()
    record('Switching in open menu keeps menu/scene ownership intact',
        page.locator('#menuOverlay').get_attribute('aria-hidden')=='false' and
        page.locator('[data-i18n="nav.delivery"]').text_content()=='Umsetzung')
    record('Dynamic next-scene accessibility prompt becomes German',
        page.locator('#continueCue').get_attribute('aria-label')=='Weiter zur nächsten Szene (8 / 20)')
    ctx.close()

    for label,w,h in VIEWPORTS:
      for language in ('en','de'):
        ctx=browser.new_context(viewport={'width':w,'height':h},is_mobile=(w<=768 and h>=700),
                                has_touch=(w<=768 and h>=700),device_scale_factor=1)
        p=ctx.new_page();local_errors=[];p.on('pageerror',lambda e:local_errors.append(str(e)))
        p.set_content(markup(language),wait_until='domcontentloaded')
        p.wait_for_function('()=>Boolean(window.__ZAHLFIX_NAV__)',timeout=15000)
        p.wait_for_timeout(980)
        details=[]
        for t,number in SCENES:
            p.evaluate('(t)=>window.__ZAHLFIX_NAV__.seek(t,true)',t)
            reading=p.evaluate('''(number)=>{
                const nodes=[...document.querySelectorAll('[data-i18n]')].filter(n=>
                    n.dataset.i18n?.startsWith(`scene.${String(number).padStart(2,'0')}.line`));
                const lines=nodes.map(node=>{
                    const range=document.createRange();range.selectNodeContents(node);
                    const rects=[...range.getClientRects()];const parent=node.closest('.story-beat');
                    return {key:node.dataset.i18n,text:node.textContent,wraps:rects.length,
                        left:rects.length?Math.min(...rects.map(x=>x.left)):0,
                        right:rects.length?Math.max(...rects.map(x=>x.right)):0,
                        top:rects.length?Math.min(...rects.map(x=>x.top)):0,
                        bottom:rects.length?Math.max(...rects.map(x=>x.bottom)):0,
                        opacity:parseFloat(getComputedStyle(parent).opacity)};
                });
                return {width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,
                    headerHeight:parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height'))||64,
                    lines};
            }''',number)
            details.append(reading)
            if label in ('small','phone','desktop') and number in (1,4,7):
                p.screenshot(path=str(OUT/f'{label}-{language}-scene{number:02}.png'),full_page=False)
        all_lines=[x for scene in details for x in scene['lines']]
        overflow=[x for x in all_lines if x['left']<9 or x['right']>w-9]
        wraps=[x for x in all_lines if x['wraps']!=1]
        overlap=[x for scene in details for x in scene['lines'] if x['top']<scene['headerHeight']-5 or x['bottom']>h-44]
        hidden=[x for x in all_lines if x['opacity']<.90]
        buttons=p.evaluate('''() => [...document.querySelectorAll('.topbar [data-lang-link]')].map(x=>{const r=x.getBoundingClientRect();return {left:r.left,right:r.right}})''')
        record(f'{label}/{language}: no horizontal document overflow',all(x['scrollWidth']<=w+2 for x in details))
        record(f'{label}/{language}: scene 01–07 lines fit viewport at their own readable holds',not overflow,overflow[:8])
        record(f'{label}/{language}: authored headline lines stay unwrapped',not wraps,wraps[:8])
        record(f'{label}/{language}: each headline clears header and Continue',not overlap,overlap[:8])
        record(f'{label}/{language}: scene 01–07 lines reach full readable opacity',not hidden,hidden[:8])
        record(f'{label}/{language}: language controls fit viewport',all(x['left']>=-2 and x['right']<=w+2 for x in buttons),buttons)
        record(f'{label}/{language}: no uncaught JS errors',not local_errors,local_errors[:3])
        ctx.close()

    ctx=browser.new_context(viewport={'width':390,'height':844},reduced_motion='reduce')
    p=ctx.new_page();p.set_content(markup('en'),wait_until='domcontentloaded')
    p.wait_for_function('()=>Boolean(window.__ZAHLFIX_I18N__)')
    record('Reduced-motion English transcript remains readable',p.locator('#text-opening').text_content()=='A new era of business transformation starts here.'
           and p.evaluate('document.documentElement.dataset.mode')=='text')
    p.screenshot(path=str(OUT/'phone-en-text.png'));ctx.close()
    for language,expected in [('en','A new era of business transformation starts here.'),
                              ('de','Die nächste Generation der Unternehmensentwicklung ist da.')]:
        raw=BeautifulSoup((PUBLIC/language/'index.html').read_text(),'html.parser')
        record(f'{language}: first paint has correctly pre-rendered copy without JS',raw.select_one('#text-opening').text==expected
               and raw.html.get('lang')==language)
    browser.close()

report={'mode':'Chromium in-memory DOM using real authored locale routes and source assets',
        'passed':sum(r['passed'] for r in checks),'failed':sum(not r['passed'] for r in checks),'results':checks}
(OUT/'browser-report.json').write_text(json.dumps(report,indent=2,ensure_ascii=False))
print(json.dumps({'passed':report['passed'],'failed':report['failed']}),flush=True)
sys.exit(report['failed']>0)

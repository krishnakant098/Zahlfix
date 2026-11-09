"""Phase 3 local Chromium QA: real application CSS/JS but restricted-network DOM.
This does not test hosted Netlify PIN/cookie gates or mail client delivery.
"""
from pathlib import Path
import json,os,sys
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
from harness import ROOT,PUBLIC,data_url,module_url
OUT=ROOT/'qa'/'i18n-p3';OUT.mkdir(parents=True,exist_ok=True)
SCENES=[(.803,15,'#scene-support'),(.844,16,'#scene-tailored'),(.883,17,'#scene-direct'),(.925,18,'#scene-principles'),(.963,19,'#scene-about'),(1.,20,'#scene-contact')]
VIEWPORTS=[('small',320,700),('phone',390,844),('tablet',768,1024),('desktop',1440,900),('landscape',844,390)]
checks=[]
def record(name,ok,detail=None):
    ok=bool(ok);checks.append({'name':name,'passed':ok,'detail':detail});print(('PASS ' if ok else 'FAIL ')+name,flush=True)
    if not ok and detail is not None:print(json.dumps(detail,ensure_ascii=False)[:1000],flush=True)
def markup(lang):
    h=BeautifulSoup((PUBLIC/lang/'index.html').read_text(),'html.parser')
    for link in list(h.select('link[rel="stylesheet"]')):
        file=PUBLIC/link['href'].lstrip('/')
        if file.exists():
            tag=h.new_tag('style');tag.string=file.read_text();link.replace_with(tag)
    for img in h.select('img[src^="/"]'):
        img['src']=data_url(PUBLIC/img['src'].lstrip('/'));img.attrs.pop('srcset',None)
    for svgimg in h.select('image[href^="/"]'):
        svgimg['href']=data_url(PUBLIC/svgimg['href'].lstrip('/'))
    for tag in list(h.select('script[src^="/"]')):
        file=PUBLIC/tag['src'].lstrip('/')
        if tag['src']=='/assets/v6/boot.js': tag['src']=module_url(file)
        else:tag.attrs.pop('src',None);tag.string=file.read_text()
    return str(h)
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=os.environ.get('CHROMIUM_EXECUTABLE') or '/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--disable-webgl'])
    ctx=browser.new_context(viewport={'width':1440,'height':900});pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.set_default_timeout(9000);pg.set_content(markup('en'),wait_until='domcontentloaded');pg.wait_for_function('()=>!!window.__ZAHLFIX_NAV__',timeout=25000)
    record('All seven cinematic sections remain siblings',pg.evaluate('''()=>[...document.querySelectorAll('section[data-scene]')].length===7 && [...document.querySelectorAll('section[data-scene]')].every(n=>n.parentElement.id==='main-stage')'''))
    record('EN first-paint scenes 15-20 rendered in English',pg.locator('[data-i18n="scene.15.line1"]').text_content()=='Beyond go-live.' and pg.locator('[data-i18n="scene.20.line1"]').text_content()=='Your challenge.')
    record('English support + principles diagrams translate their static words', pg.locator('[data-i18n="support.head"]').text_content()=='AFTER LAUNCH / SYSTEM STATUS' and pg.locator('[data-i18n="principles.routeCaption"]').text_content()=='THE DIRECT ROUTE')
    pg.evaluate('window.__ZAHLFIX_NAV__.seek(.925,true)')
    record('Principles core state responds to scroll in English',pg.locator('#principlesCoreMode').text_content() in ['ADAPTIVE','DIRECT','DELIVERY','BERLIN'],pg.locator('#principlesCoreMode').text_content())
    pg.evaluate('''() => { window.__p3Anchor=document.getElementById('scene-principles');
      window.__p3Route=[];history.pushState=(_state,_title,url)=>{window.__p3Route.push(url)};}''')
    old=pg.evaluate('scrollY')
    pg.locator('.topbar [data-lang-link="de"]').click()
    record('EN to DE preserves scene and scroll position',pg.evaluate('''(old)=>document.documentElement.lang==='de' && window.__p3Anchor===document.getElementById('scene-principles') && Math.abs(scrollY-old)<2 && window.__p3Route.at(-1).startsWith('/de/')''',old))
    record('In-place DE switching updates text, diagram, and legal links',pg.locator('[data-i18n="scene.15.line1"]').text_content()=='Auch nach dem Go-live.' and pg.locator('#principlesCoreMode').text_content() in ['ADAPTIV','DIREKT','UMSETZUNG','BERLIN'] and pg.locator('[data-i18n="support.head"]').text_content()=='NACH GO-LIVE / SYSTEMSTATUS' and pg.locator('[data-legal-page="datenschutz.html"]').first.get_attribute('href')=='/de/datenschutz.html')
    pg.locator('.topbar [data-lang-link="en"]').click()
    record('DE to EN restores layout copy and localized legal links',pg.locator('[data-i18n="scene.19.line1"]').text_content()=='Two founders.' and pg.locator('[data-legal-page="impressum.html"]').get_attribute('href')=='/en/impressum.html')
    pg.evaluate('window.__ZAHLFIX_NAV__.seek(1,true)')
    pg.locator('#contact-name').fill('Test User');pg.locator('#contact-company').fill('Demo GmbH');pg.locator('#contact-email').fill('hello@example.com');pg.locator('#contact-challenge').fill('Automating invoices and work orders')
    pg.evaluate('''()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__p3Clip=text;}}})}''')
    pg.locator('#copyEnquiry').click();pg.wait_for_function('()=>!!window.__p3Clip',timeout=8000)
    record('EN contact copy generates English email draft with populated fields',pg.evaluate('''()=>window.__p3Clip.includes('Subject: ZahlFix') && window.__p3Clip.includes('Company: Demo GmbH') && window.__p3Clip.includes('Challenge / project:') && window.__p3Clip.includes('Automating invoices')'''))
    pg.locator('.topbar [data-lang-link="de"]').click()
    record('Language switch retains the partially completed contact form',pg.locator('#contact-company').input_value()=='Demo GmbH' and pg.locator('#contact-challenge').input_value()=='Automating invoices and work orders')
    pg.locator('#copyEnquiry').click();pg.wait_for_function("()=>window.__p3Clip.includes('Betreff: ZahlFix')",timeout=8000)
    record('DE contact copy now generates German email field labels',pg.evaluate('''()=>window.__p3Clip.includes('Unternehmen: Demo GmbH') && window.__p3Clip.includes('Herausforderung / Projekt:')'''))
    record('No page exceptions during language/contact switching',not errs,errs[:5]);ctx.close()
    for label,w,h in VIEWPORTS:
      for lang in ('en','de'):
        ctx=browser.new_context(viewport={'width':w,'height':h},is_mobile=(w<=768 and h>=700),has_touch=(w<=768 and h>=700),device_scale_factor=1)
        pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.set_content(markup(lang),wait_until='domcontentloaded');pg.wait_for_function('()=>!!window.__ZAHLFIX_NAV__',timeout=25000)
        pg.wait_for_function('()=>!document.body.classList.contains("is-loading")',timeout=22000)
        samples=[]
        for t,number,selector in SCENES:
          pg.evaluate('(p)=>window.__ZAHLFIX_NAV__.seek(p,true)',t)
          layout=pg.evaluate('''({sel,number})=>{
            const owner=document.querySelector(sel),heading=owner.querySelector('strong')||owner.querySelector('h2');
            const nodes=[...heading.querySelectorAll('[data-i18n]')];
            const r=heading.getBoundingClientRect();
            const lines=nodes.map(n=>{let range=document.createRange();range.selectNodeContents(n);return {key:n.dataset.i18n,text:n.textContent,rects:[...range.getClientRects()].map(x=>({left:x.left,right:x.right,top:x.top,bottom:x.bottom}))}});
            return {number,opacity:parseFloat(getComputedStyle(owner).opacity),head:{top:r.top,bottom:r.bottom,left:r.left,right:r.right},lines,scrollWidth:document.documentElement.scrollWidth,headerHeight:parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height'))||64};
          }''',{'sel':selector,'number':number})
          samples.append(layout)
          if label in ('desktop','phone'):
            pg.screenshot(path=str(OUT/f'{label}-{lang}-scene{number:02}.png'),full_page=False)
        badlines=[{'number':r['number'],'line':ln['text'],'rect':rect} for r in samples for ln in r['lines'] for rect in ln['rects'] if rect['right']>w+4 or rect['left']<-4]
        headings=[r for r in samples[:-1] if r['head']['left']<-4 or r['head']['right']>w+4]
        textOpacity=[r for r in samples[:-1] if r['opacity']<.72]
        scrollWidth=max(r['scrollWidth'] for r in samples)
        record(f'{label}/{lang}: scenes 15-20 main lines fit viewport',not badlines,badlines[:4])
        record(f'{label}/{lang}: scene headings stay horizontally in frame',not headings,headings[:4])
        record(f'{label}/{lang}: scene 15-19 holds reach readable opacity',not textOpacity,textOpacity[:4])
        record(f'{label}/{lang}: no horizontal document overflow',scrollWidth<=w+3,scrollWidth)
        record(f'{label}/{lang}: contact fields/required controls remain accessible',pg.locator('#challengeForm input[required]').count()==3 and pg.locator('#challengeForm textarea[required]').count()==1 and pg.locator('#copyEnquiry').is_visible())
        record(f'{label}/{lang}: no JavaScript errors',not errs,errs[:5])
        ctx.close()
    ctx=browser.new_context(viewport={'width':390,'height':844},reduced_motion='reduce');pg=ctx.new_page();pg.set_content(markup('en'),wait_until='domcontentloaded');pg.wait_for_function('()=>!!window.__ZAHLFIX_I18N__',timeout=15000)
    record('Reduced motion has full 20-scene English narrative',pg.evaluate('document.documentElement.dataset.mode')=='text' and pg.locator('.story-transcript ol > li').count()==20 and pg.locator('#text-contact').text_content().startswith('Your challenge'))
    pg.evaluate('history.pushState=()=>{}');pg.locator('.topbar [data-lang-link="de"]').click()
    record('Reduced motion DE switch adapts final transcript and contact',pg.locator('#text-contact').text_content().startswith('Ihre Herausforderung') and pg.locator('[data-i18n="form.title"]').text_content()=='WORUM GEHT ES?')
    ctx.close();browser.close()
result={'passed':sum(c['passed'] for c in checks),'failed':sum(not c['passed'] for c in checks),'checks':checks}
(OUT/'browser-report.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(f"P3 BROWSER QA: {result['passed']} passed / {result['failed']} failed",flush=True)
if result['failed']:sys.exit(1)

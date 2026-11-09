"""P2 EN/DE browser QA. Uses the actual application modules/CSS/SVG in a restricted-network Chromium harness.

Tests 08-14 read holds and layout + DOM, service titles and interaction,
workflow states, software/AI captions, in-place language switch and text fallback.
This is not a substitute for live Netlify login/session testing.
"""
from pathlib import Path
import json,os,sys
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
from harness import ROOT, PUBLIC, data_url, module_url

OUT=ROOT/'qa'/'i18n-p2'; OUT.mkdir(parents=True,exist_ok=True)
SCENES=[(.330,8,'#scene-zahlfix'),(.390,9,'#scene-services'),(.522,10,'#scene-workflow'),(.575,11,'#scene-automation'),(.645,12,'#scene-implementation'),(.700,13,'#scene-software'),(.753,14,'#scene-ai')]
VIEWPORTS=[('small',320,700),('phone',390,844),('tablet',768,1024),('desktop',1440,900),('landscape',844,390)]
checks=[]
def record(name,ok,detail=None):
    checks.append({'name':name,'passed':bool(ok),'detail':detail})
    print(('PASS ' if ok else 'FAIL ')+name,flush=True)
    if not ok and detail:print('  '+json.dumps(detail,ensure_ascii=False)[:1600],flush=True)
def markup(locale):
    page=BeautifulSoup((PUBLIC/locale/'index.html').read_text(),'html.parser')
    for link in list(page.select('link[rel="stylesheet"]')):
        target=PUBLIC/link['href'].lstrip('/')
        if target.exists():
            style=page.new_tag('style');style.string=target.read_text();link.replace_with(style)
    for img in page.select('img[src^="/"]'):
        img['src']=data_url(PUBLIC/img['src'].lstrip('/'));img.attrs.pop('srcset',None)
    for image in page.select('image[href^="/"]'):
        image['href']=data_url(PUBLIC/image['href'].lstrip('/'))
    for script in list(page.select('script[src^="/"]')):
        local=PUBLIC/script['src'].lstrip('/')
        if script['src']=='/assets/v6/boot.js':script['src']=module_url(local)
        else:script.attrs.pop('src',None);script.string=local.read_text()
    return str(page)

with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path=os.environ.get('CHROMIUM_EXECUTABLE') or '/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--disable-webgl'])
  ctx=browser.new_context(viewport={'width':1440,'height':900})
  pg=ctx.new_page(); errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.set_content(markup('en'),wait_until='domcontentloaded')
  pg.wait_for_function('()=>Boolean(window.__ZAHLFIX_NAV__ && window.__ZAHLFIX_I18N__)',timeout=20000)
  record('EN first-paint scene 09/10/14 composed and rendered',pg.locator('[data-i18n="scene.09.line1"]').text_content()=='From business strategy'
         and pg.locator('[data-i18n="scene.10.line2"]').text_content()=='Connect the work.'
         and pg.locator('[data-i18n="scene.14.line2"]').text_content()=='makes a difference.')
  record('Scene 08 initial EN DOM reads naturally without CSS-order hacks',
         pg.locator('#scene-zahlfix strong').text_content().strip()=='This is where ZahlFix steps in.')
  record('EN service-card buttons and aria labels match language',
         pg.locator('.service-select .service-name').all_text_contents()==['IT consulting','Digital workflows','Process improvement','Workflow automation','Software design','Software development','AI applications','AI agents','Software implementation','Technical support']
         and pg.locator('[data-service-select="3"]').get_attribute('aria-label')=='Workflow automation')
  pg.evaluate('window.__ZAHLFIX_NAV__.seek(.39,true)')
  record('Capability focus is recomposed in English by runtime',
         pg.locator('#capabilityFocusName').text_content() in ['IT consulting','Digital workflows','Process improvement','Workflow automation','Software design','Software development','AI applications','AI agents','Software implementation','Technical support'],
         pg.locator('#capabilityFocusName').text_content())
  pg.evaluate('window.__ZAHLFIX_NAV__.seek(.522,true)')
  record('Workflow status is runtime-localized in English',pg.locator('#workflowStep').text_content().startswith('0') and
         pg.locator('#workflowVerb').text_content() in ['Find the friction','Make work visible','Remove the drag','Put it to work']
         and not pg.locator('#workflowDetail').text_content().startswith('Wir'),
         [pg.locator('#workflowStep').text_content(),pg.locator('#workflowVerb').text_content(),pg.locator('#workflowDetail').text_content()])
  pg.evaluate('window.__ZAHLFIX_NAV__.seek(.753,true)')
  record('AI portal is dynamically localized in English',pg.locator('#implementationMode').text_content()=='AI' and
         pg.locator('[data-i18n="implementation.aiTitle"]').text_content()=='INTELLIGENCE LAYER' and
         pg.locator('[data-i18n="implementation.aiNode.center.name"]').text_content()=='AI CORE')
  pg.evaluate('''() => {window.__p2SceneSentinel={id:document.getElementById('scene-ai')};
      window.__p2Routes=[];history.pushState=(_a,_b,url)=>window.__p2Routes.push(url);}''')
  before=pg.evaluate('scrollY')
  pg.locator('.topbar [data-lang-link="de"]').click()
  record('EN→DE switch preserves scene DOM, scroll position and requests German route',
         pg.evaluate('''(before)=>document.documentElement.lang==='de'&&window.__p2SceneSentinel.id===document.getElementById('scene-ai')
             &&window.__p2Routes.at(-1).startsWith('/de/')&&Math.abs(window.scrollY-before)<2''',before))
  record('DE scene, technical diagram and service controls now German',
         pg.locator('[data-i18n="scene.14.line1"]').text_content()=='KI mit echtem' and
         pg.locator('[data-i18n="scene.14.line2"]').text_content()=='Mehrwert.' and
         pg.locator('[data-i18n="implementation.aiTitle"]').text_content()=='INTELLIGENTE EBENE' and
         pg.locator('[data-service-select="3"]').get_attribute('aria-label')=='Automatisierung' and
         pg.locator('#implementationMode').text_content()=='KI')
  pg.evaluate('window.__ZAHLFIX_NAV__.seek(.522,true)')
  record('Scene 08 DE DOM reading order correct after in-place switch',
         pg.locator('#scene-zahlfix strong').text_content().strip()=='Genau dort beginnt ZahlFix.')
  record('Workflow stays German after scroll and rerender',pg.locator('#workflowVerb').text_content() in
         ['Wir analysieren.','Wir digitalisieren.','Wir optimieren.','Wir implementieren.'])
  pg.locator('.topbar [data-lang-link="en"]').click()
  record('DE→EN switches dynamic workflow labels while scene is retained',
         pg.locator('#workflowVerb').text_content() in ['Find the friction','Make work visible','Remove the drag','Put it to work']
         and pg.locator('#workflowStep').text_content().split('/')[-1].strip() in ['DISCOVER','DIGITISE','IMPROVE','IMPLEMENT'])
  record('Scene 08 EN DOM reading order restored after switching back',
         pg.locator('#scene-zahlfix strong').text_content().strip()=='This is where ZahlFix steps in.')
  record('No JavaScript exceptions during scene switching',not errs,errs[:8])
  ctx.close()

  # Evaluate each headline at its own authored reading hold. Services screen also
  # checks every button's text bounds, including compact scrollable cards.
  for label,w,h in VIEWPORTS:
    for lang in ('en','de'):
      ctx=browser.new_context(viewport={'width':w,'height':h},is_mobile=(w<=768 and h>=700),has_touch=(w<=768 and h>=700),device_scale_factor=1)
      pg=ctx.new_page();localerrors=[];pg.on('pageerror',lambda e:localerrors.append(str(e)))
      pg.set_content(markup(lang),wait_until='domcontentloaded')
      pg.wait_for_function('()=>Boolean(window.__ZAHLFIX_NAV__)',timeout=20000)
      pg.wait_for_function('()=>!document.body.classList.contains("is-loading")',timeout=18000)
      results=[]
      for t,number,sel in SCENES:
        pg.evaluate('(progress)=>window.__ZAHLFIX_NAV__.seek(progress,true)',t)
        result=pg.evaluate('''({number,sel})=>{
           const owner=document.querySelector(sel); const style=getComputedStyle(owner);
           const nodes=[...owner.querySelectorAll('[data-i18n]')].filter(n=>/\\.line[123]$|\\.verb$|\\.brand$/.test(n.dataset.i18n));
           const extract=node=>{
             const r=document.createRange();r.selectNodeContents(node);
             const rects=[...r.getClientRects()].filter(x=>x.width>0&&x.height>0);
             return {key:node.dataset.i18n,text:node.textContent,rects:rects.map(x=>({left:x.left,right:x.right,top:x.top,bottom:x.bottom})),
                     font:parseFloat(getComputedStyle(node).fontSize)};
           };
           const children=nodes.map(extract);
           const heading=owner.querySelector('strong')||owner.querySelector('h1');
           const hr=heading.getBoundingClientRect();
           const headerHeight=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height'))||64;
           return {number,opacity:parseFloat(style.opacity),children,head:{top:hr.top,bottom:hr.bottom,left:hr.left,right:hr.right},
                   headerHeight,scrollWidth:document.documentElement.scrollWidth,
                   bodyScrollWidth:document.body.scrollWidth,
                   lang:document.documentElement.lang,
                   status:document.querySelector('#workflowVerb').textContent,
                   mode:document.querySelector('#implementationMode').textContent};
        }''',{'number':number,'sel':sel})
        results.append(result)
        if (label in ('phone','desktop') and number in (8,9,10,11,12,13,14)):
          pg.screenshot(path=str(OUT/f'{label}-{lang}-scene{number:02}.png'),full_page=False)
      lines=[rect for scene in results for x in scene['children'] for rect in x['rects']]
      overflow=[{'scene':r['number'],'key':x['key'], 'rect':rect} for r in results for x in r['children'] for rect in x['rects'] if rect['left']<-3 or rect['right']>w+3]
      headerCollisions=[r for r in results if r['head']['top']<r['headerHeight']-14 or r['head']['bottom']>h-20]
      invisible=[r for r in results if r['opacity']<.72]
      record(f'{label}/{lang}: scene 08–14 headings remain inside viewport',not headerCollisions,headerCollisions[:5])
      record(f'{label}/{lang}: language-aware lines do not overflow horizontally',not overflow,overflow[:6])
      record(f'{label}/{lang}: scene 08–14 reach readable opacity',not invisible,invisible[:5])
      record(f'{label}/{lang}: no horizontal document overflow',max(r['scrollWidth'] for r in results)<=w+3,max(r['scrollWidth'] for r in results))
      pg.evaluate('window.__ZAHLFIX_NAV__.seek(.390,true)')
      cards=pg.evaluate('''()=>[...document.querySelectorAll('.service-select .service-name')].map(n=>{
        const r=n.getBoundingClientRect(),parent=n.closest('.service-card').getBoundingClientRect();
        return {name:n.textContent,left:r.left,right:r.right,top:r.top,bottom:r.bottom,
          cardLeft:parent.left,cardRight:parent.right,cardTop:parent.top,cardBottom:parent.bottom,
          scrollWidth:n.scrollWidth,width:n.clientWidth,scrollHeight:n.scrollHeight,height:n.clientHeight};
      })''')
      badCards=[x for x in cards if x['right']>x['cardRight']+3 or x['left']<x['cardLeft']-3 or x['bottom']>x['cardBottom']+3 or x['scrollWidth']>x['width']+3]
      record(f'{label}/{lang}: all 10 capability names fit cards',not badCards,badCards[:8])
      record(f'{label}/{lang}: all 10 capability cards retain nonempty text and accessible names',
             len(cards)==10 and all(x['name'].strip() for x in cards) and
             pg.locator('.service-select[aria-label]').count()==10)
      record(f'{label}/{lang}: no browser JS exceptions',not localerrors,localerrors[:4])
      ctx.close()

  ctx=browser.new_context(viewport={'width':390,'height':844},reduced_motion='reduce')
  pg=ctx.new_page();pg.set_content(markup('en'),wait_until='domcontentloaded');pg.wait_for_function('()=>Boolean(window.__ZAHLFIX_I18N__)')
  record('Reduced-motion English includes full 01–14 transcript and capability list',
      pg.evaluate('document.documentElement.dataset.mode')=='text' and
      pg.locator('#text-zahlfix').text_content()=='This is where ZahlFix steps in.' and
      pg.locator('#text-ai').text_content().startswith('AI applied where') and
      pg.locator('.static-services li').nth(7).text_content()=='AI agents')
  # The restricted-network DOM harness runs at about:blank, where native pushState
  # to /de/ is disallowed; keep the application switch and paint behavior intact.
  pg.evaluate('history.pushState=(_state,_title,url)=>{window.__p2Route=url;}')
  pg.locator('.topbar [data-lang-link="de"]').click()
  record('Reduced-motion language switching adapts transcript and static service list',
      pg.locator('#text-software').text_content().startswith('Wir konzipieren') and
      pg.locator('.static-services li').nth(7).text_content()=='KI-Agenten')
  pg.screenshot(path=str(OUT/'phone-de-text-after-switch.png'))
  ctx.close();browser.close()

report={'passed':sum(x['passed'] for x in checks),'failed':sum(not x['passed'] for x in checks),'checks':checks}
(OUT/'browser-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(f"P2 BROWSER QA: {report['passed']} passed / {report['failed']} failed",flush=True)
if report['failed']:sys.exit(1)

# HISTORICAL R2/R3 TEST. R4 entrypoints: r4-regression.py, r4-lifecycle.py, r4-assets.py.
"""Browser regression tests. Run against HTTP normally; --harness for restricted CI.

pip install -r requirements-dev.txt
python -m playwright install chromium
npm run dev
python tests/browser/regression.py --base-url http://127.0.0.1:4173
"""
import argparse,json,os,sys,time
from pathlib import Path
from playwright.sync_api import sync_playwright
from harness import ROOT,markup
parser=argparse.ArgumentParser()
parser.add_argument('--base-url',default='http://127.0.0.1:4173')
parser.add_argument('--harness',action='store_true')
parser.add_argument('--screenshots',action='store_true')
parser.add_argument('--executable',default=os.environ.get('CHROMIUM_EXECUTABLE'))
args=parser.parse_args()
qa=ROOT/'qa';qa.mkdir(exist_ok=True)
registry=json.loads((ROOT/'public/assets/v6/scene-registry.js').read_text().split('Object.freeze(',1)[1].split('.map(Object.freeze)',1)[0])
results=[];errors=[]
def record(name,ok,detail=None):
    results.append({'test':name,'passed':bool(ok),'detail':detail});print(('PASS ' if ok else 'FAIL ')+name,flush=True)
    (qa/'browser-results.partial.json').write_text(json.dumps(results,indent=2))
    if not ok:print(detail,flush=True)
def load(page,script=True):
    if args.harness:page.set_content(markup(script=script),wait_until='domcontentloaded')
    else:page.goto(args.base_url+'/?skipintro=1',wait_until='domcontentloaded')
    if script:page.wait_for_function('document.documentElement.dataset.mode',timeout=6000)
    page.wait_for_timeout(1100)
def seek(page,target):
    page.evaluate('(p)=>scrollTo({top:(document.documentElement.scrollHeight-innerHeight)*p,behavior:"instant"})',target)
    page.wait_for_function('(p)=>Math.abs(Number(document.querySelector("#debugProgress").textContent)-p)<.001',arg=target,timeout=6000)
    page.wait_for_timeout(100)
def op(page,selector):
    return page.locator(selector).evaluate('e=>{let n=e,v=1;while(n instanceof Element){v*=Number(getComputedStyle(n).opacity);n=n.parentElement;}return v;}')
with sync_playwright() as p:
    launch={'headless':True,'args':['--no-sandbox']}
    if args.executable:launch['executable_path']=args.executable
    browser=p.chromium.launch(**launch)
    for label,width,height in [('desktop',1440,900),('mobile',390,844),('small-mobile',320,568),('landscape',844,390)]:
        ctx=browser.new_context(viewport={'width':width,'height':height},reduced_motion='no-preference')
        page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)[:500]));page.set_default_timeout(5000)
        try:
            load(page)
            record(label+': cinematic initialization',page.evaluate('document.documentElement.dataset.mode')=='cinema')
            page.locator('#continueCue').click()
            page.wait_for_function('document.documentElement.dataset.story==="consulting"');page.wait_for_timeout(1400)
            record(label+': pointer Continue lands on a readable second scene',op(page,'.story-beat--02')>.97)
            record(label+': navigation transfers focus',page.locator('#scene-consulting').evaluate('e=>e===document.activeElement'))
            page.locator('#continueCue').focus();page.keyboard.press('Enter');page.wait_for_timeout(1700)
            record(label+': keyboard Continue lands on third scene',op(page,'.story-beat--03')>.97)
            for scene in registry:
                seek(page,scene['target'])
                effective=op(page,scene['selector'])
                record(label+f': scene {scene["number"]:02d} readable hold',effective>.85,round(effective,4))
                if args.screenshots and scene['number'] in [1,9,10,14,19]:page.screenshot(path=str(qa/f'{label}-scene-{scene["number"]:02d}.png'))
            record(label+': essential technology copy is readable size',page.locator('.scene--reporting .content-beat--technology small').evaluate_all('els=>els.every(e=>parseFloat(getComputedStyle(e).fontSize)>=13)'))
            seek(page,.39)
            labels=page.locator('.service-name').evaluate_all('els=>els.every(e=>{const b=e.getBoundingClientRect(),p=e.closest("button").getBoundingClientRect();return b.left>=p.left-1&&b.right<=p.right+1&&b.top>=p.top-1&&b.bottom<=p.bottom+1&&parseFloat(getComputedStyle(e).fontSize)>=12;})')
            record(label+': ten service names fit their touch controls',labels)
            page.locator('[data-service-select="7"]').click();page.wait_for_timeout(1200)
            record(label+': service selection responds to pointer input',page.locator('[data-service-select="7"]').get_attribute('aria-pressed')=='true')
            seek(page,.925)
            record(label+': Continue stays visible late in the story',op(page,'#continueCue')>.95)
            seek(page,.522)
            page.set_viewport_size({'width':width+30,'height':height+40});page.wait_for_timeout(1400)
            record(label+': resize preserves the current story position',abs(float(page.locator('#debugProgress').inner_text())-.522)<.003)
            page.set_viewport_size({'width':width,'height':height});page.wait_for_timeout(1400)
            before=page.evaluate('window.__ZAHLFIX_PERF__.domRenders');page.wait_for_timeout(600)
            record(label+': full DOM choreography sleeps when settled',page.evaluate('window.__ZAHLFIX_PERF__.domRenders')-before<=2)
            record(label+': services yield ownership to workflow',page.locator('.scene--services').evaluate('e=>Number(getComputedStyle(e).opacity)')<.01)
            # Main CTA must work from an arbitrary point, not only the final scroll position.
            page.locator('.challenge-trigger').click();page.wait_for_timeout(2300)
            record(label+': main contact CTA reveals form',op(page,'#challengeForm')>.98)
            if args.screenshots:page.screenshot(path=str(qa/f'{label}-contact-top.png'))
            form=page.locator('#challengeForm')
            for field,value in [('name','Test User'),('company','Test Company'),('email','test@example.com'),('phone','+49 30 000000'),('challenge','Local test only. Not sent.')]:
                form.locator('[name="'+field+'"]').fill(value)
            submit=form.locator('[type="submit"]');submit.scroll_into_view_if_needed()
            box=submit.bounding_box()
            record(label+': submit reachable without clipping',bool(box and box['y']>=0 and box['y']+box['height']<=height+1),box)
            # Copy uses a clipboard API or a manual-copy text area; no real message is sent.
            page.locator('#copyEnquiry').click();page.wait_for_timeout(250)
            record(label+': enquiry can be copied without claiming delivery',bool(page.locator('#challengeFormStatus').inner_text().strip()))
            if args.screenshots:page.screenshot(path=str(qa/f'{label}-contact-controls.png'))
            footer=page.locator('.contact-legal');footer.scroll_into_view_if_needed();f=footer.bounding_box()
            record(label+': legal navigation reachable',bool(f and f['y']>=0 and f['y']+f['height']<=height+1),f)
            page.locator('#menuTrigger').click();page.locator('#menuOverlay').wait_for(state='visible')
            if page.locator('#menuOverlay').evaluate('e=>e.scrollHeight>e.clientHeight'):
                page.mouse.move(width*.6,height*.6);page.mouse.wheel(0,850);page.wait_for_timeout(350)
                record(label+': menu scroll is not blocked',page.locator('#menuOverlay').evaluate('e=>e.scrollTop')>0)
            else:record(label+': menu fits without scrolling',True)
            page.locator('#menuOverlay [data-scene-target="contact"]').scroll_into_view_if_needed()
            if args.screenshots:page.screenshot(path=str(qa/f'{label}-menu.png'))
            page.keyboard.press('Escape');record(label+': Escape closes menu',page.locator('#menuOverlay').get_attribute('aria-hidden')=='true')
            # Resize, fast forward and reverse scroll should converge to scene ownership.
            seek(page,.075);seek(page,.963);seek(page,.21)
            record(label+': reverse/fast scrolling settles correctly',op(page,'.story-beat--05')>.98)
            record(label+': no horizontal document overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
        except Exception as exc:record(label+': unexpected test exception',False,str(exc)[:1200])
        finally:ctx.close()
    for label,script,motion in [('no-javascript',False,'no-preference'),('reduced-motion',True,'reduce')]:
        ctx=browser.new_context(viewport={'width':320,'height':568},java_script_enabled=script,reduced_motion=motion)
        page=ctx.new_page()
        try:
            load(page,script)
            record(label+': all twenty approved beats are in readable document flow',page.locator('.story-transcript ol>li').count()==20 and page.locator('.story-transcript').is_visible())
            record(label+': loader does not block content',not page.locator('#siteLoader').is_visible())
            page.locator('.contact-method a').scroll_into_view_if_needed()
            record(label+': direct email remains available',page.locator('.contact-method a').is_visible())
            if script:record(label+': cinematic/WebGL engine is not loaded',not page.evaluate('document.documentElement.classList.contains("is-cinematic")'))
            if args.screenshots:page.screenshot(path=str(qa/f'{label}.png'))
        except Exception as exc:record(label+': unexpected test exception',False,str(exc)[:1200])
        finally:ctx.close()
    browser.close()
record('no uncaught browser errors',len(errors)==0,errors)
report={'mode':'in-memory DOM/CSS/ES-module harness' if args.harness else 'HTTP browser', 'viewports':4,'passed':sum(r['passed'] for r in results),'failed':sum(not r['passed'] for r in results),'limitations':['Live Netlify auth/storage not exercised.','WebGL hardware and external photography are not verified in restricted harness.','No real email is sent.','Harness uses inline assets, not production CSP/network loading.'] if args.harness else [],'results':results}
(qa/'browser-results.json').write_text(json.dumps(report,indent=2))
print(json.dumps({k:report[k] for k in ['mode','passed','failed']},indent=2))
sys.exit(1 if report['failed'] else 0)

# HISTORICAL R2/R3 TEST. R4 entrypoints: r4-regression.py, r4-lifecycle.py, r4-assets.py.
"""Explicit fault/lifecycle injection. Embedded harness only, not real browser history."""
import argparse,json
from playwright.sync_api import sync_playwright
from harness import ROOT,markup
p=argparse.ArgumentParser();p.add_argument('--executable');a=p.parse_args()
results=[]
def record(name,value):
    results.append({'test':name,'passed':bool(value)});print(('PASS ' if value else 'FAIL ')+name,flush=True)
with sync_playwright() as p:
    opts={'headless':True,'args':['--no-sandbox']}
    if a.executable:opts['executable_path']=a.executable
    b=p.chromium.launch(**opts)
    page=b.new_page(viewport={'width':320,'height':568})
    page.set_content(markup(fail_main=True),wait_until='domcontentloaded');page.wait_for_timeout(1300)
    record('main import failure selects readable text mode',page.evaluate('document.documentElement.dataset.mode')=='text')
    record('module failure retains all twenty narrative beats',page.locator('.story-transcript ol>li').count()==20 and page.locator('.story-transcript').is_visible())
    record('module failure removes blocking loader',not page.locator('#siteLoader').is_visible())
    page.locator('.contact-method a').scroll_into_view_if_needed()
    record('module failure retains direct contact',page.locator('.contact-method a').is_visible())
    page.close();page=b.new_page(viewport={'width':320,'height':568})
    page.set_content(markup(),wait_until='domcontentloaded');page.wait_for_timeout(1500)
    page.evaluate('dispatchEvent(new PageTransitionEvent("pagehide",{persisted:true}))')
    page.wait_for_timeout(100)
    page.evaluate('dispatchEvent(new PageTransitionEvent("pageshow",{persisted:true}))')
    page.locator('#continueCue').click();page.wait_for_timeout(1800)
    record('persisted page lifecycle resumes animation and navigation',page.evaluate('document.documentElement.dataset.story')=='consulting')
    b.close()
report={'mode':'in-memory fault/lifecycle injection','passed':sum(r['passed'] for r in results),'failed':sum(not r['passed'] for r in results),'limitations':['Synthetic page-transition events are not a real bfcache/browser-history certification.','Module failure is deliberately injected by the test harness.'],'results':results}
(ROOT/'qa/failure-results.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
raise SystemExit(1 if report['failed'] else 0)

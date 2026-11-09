# HISTORICAL R2/R3 TEST. R4 entrypoints: r4-regression.py, r4-lifecycle.py, r4-assets.py.
"""Continuous 60-second orbit observation plus forward/reverse scroll exercise.

Uses the explicit in-memory fixture by default in this restricted runner. Pass
--base-url to test the local HTTP build instead. Hardware/device certification is
separate from these headless measurements.
"""
from pathlib import Path
import argparse,json,os
from playwright.sync_api import sync_playwright
from harness import ROOT,markup
parser=argparse.ArgumentParser();parser.add_argument('--executable',default=os.environ.get('CHROMIUM_EXECUTABLE'));parser.add_argument('--base-url');parser.add_argument('--seconds',type=float,default=60);a=parser.parse_args()
with sync_playwright() as pw:
 opts={'headless':True,'args':['--no-sandbox']}
 if a.executable:opts['executable_path']=a.executable
 browser=pw.chromium.launch(**opts);page=browser.new_page(viewport={'width':1440,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 if a.base_url:page.goto(a.base_url+'/?skipintro=1',wait_until='domcontentloaded')
 else:page.set_content(markup(),wait_until='domcontentloaded')
 page.wait_for_function('window.__ZAHLFIX_PHASE1__');page.wait_for_timeout(1000)
 observation=page.evaluate('''seconds=>new Promise(resolve=>{
  let start=0,last=0,frames=0,maxError=0,collisions=0,clipping=0,intervals=[],domSamples=0;
  const docs=[...document.querySelectorAll('[data-p1-doc]')].sort((a,b)=>+a.dataset.p1Doc-+b.dataset.p1Doc);
  function tick(t){if(!start)start=t;if(last)intervals.push(t-last);last=t;frames++;
   if(frames%8===0){domSamples++;const s=window.__ZAHLFIX_PHASE1__.snapshot();
    const boxes=docs.map((e,i)=>{const b=e.getBoundingClientRect(),p=new DOMPoint(0,0).matrixTransform(e.getScreenCTM());maxError=Math.max(maxError,Math.hypot(p.x-s.poses[i].x,p.y-s.poses[i].y));if(b.left<0||b.right>innerWidth||b.top<75||b.bottom>innerHeight-54)clipping++;return b;});
    for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const x=Math.min(boxes[i].right,boxes[j].right)-Math.max(boxes[i].left,boxes[j].left),y=Math.min(boxes[i].bottom,boxes[j].bottom)-Math.max(boxes[i].top,boxes[j].top);if(x>.5&&y>.5)collisions++;}
   }
   if(t-start<seconds*1000)requestAnimationFrame(tick);else resolve({elapsedMs:t-start,frames,domSamples,maxAnchorErrorPx:maxError,collisions,clipping,frameIntervals:intervals});
  }requestAnimationFrame(tick);
 })''',a.seconds)
 # Real scroll inputs; no internal render/seek override.
 for start,end in [(0,.233),(.233,0)]:
  page.evaluate('''([start,end])=>new Promise(resolve=>{let origin;function step(t){origin??=t;let u=Math.min(1,(t-origin)/7500);scrollTo({top:(start+(end-start)*u)*(document.documentElement.scrollHeight-innerHeight),behavior:'instant'});if(u<1)requestAnimationFrame(step);else resolve();}requestAnimationFrame(step);})''',[start,end]);page.wait_for_timeout(600)
 page.wait_for_function('window.__ZAHLFIX_PHASE1__.snapshot().p===0',timeout=5000)
 returned=page.evaluate('window.__ZAHLFIX_PHASE1__.snapshot().p===0 && [...document.querySelectorAll("[data-p1-doc]")].every(e=>Number(e.getAttribute("opacity"))===1)')
 vals=sorted(observation['frameIntervals']);observation['frameIntervalP95Ms']=vals[int(.95*(len(vals)-1))];observation['frameIntervalMaxMs']=max(vals)
 browser.close()
report={'mode':'HTTP headless Chromium' if a.base_url else 'in-memory headless Chromium','observation':observation,'forwardAndReverseScrollSeconds':15,'returnedToCompleteOpening':returned,'uncaughtErrors':errors,'passed':observation['collisions']==0 and observation['clipping']==0 and observation['maxAnchorErrorPx']<.5 and returned and not errors,'limitations':['Headless timing is not real mobile/GPU frame-pacing certification.','The sustained ambient observation and the numerical ten-minute simulation are separate checks.']}
(ROOT/'qa/r3/continuous-motion.json').write_text(json.dumps(report,indent=2));print(json.dumps({**report,'observation':{k:v for k,v in observation.items() if k!='frameIntervals'}},indent=2));raise SystemExit(not report['passed'])

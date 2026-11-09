import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PHASE1,Phase1Clock,phase1State,CAPTURE_ORDER} from '../../public/assets/v6/phase1-timeline.js';
import {Z_PATH,Z_SAFE_RADIUS} from '../../public/assets/v6/phase1-brand.js';
import {orbitPoint,ellipseCurve,curvePoint,systemCurve,curvePath,arcTable,pointAtFraction,documentPose,wipeScale,PERIODS} from '../../public/assets/v6/phase1-geometry.js';
const example={w:1440,h:900,cx:1080,cy:475,radii:[95,171,248],projection:.72,rotation:-Math.PI/30,docWidth:30,docHeight:41.25,zSize:79,
  sink:{x:650,y:375},grid:{x:900,y:475,gapX:44,gapY:51,scale:1}};
const near=(a,b,tol=1e-5)=>assert.ok(Math.abs(a-b)<=tol,`${a} != ${b}, tolerance ${tol}`);
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
test('R2 boundary and readable holds do not move scene 06',()=>{assert.equal(PHASE1.end,.233);assert.equal(phase1State(0).hero,1);assert.equal(phase1State(.225).system,1);assert.equal(phase1State(.225).atom,1);assert.equal(phase1State(.21).atom,0);});
test('nine stable identities, three identical speeds per orbit, slower outer periods',()=>{
 assert.equal(new Set(CAPTURE_ORDER).size,9);assert.ok(PERIODS[0]<PERIODS[1]&&PERIODS[1]<PERIODS[2]);
 for(let t=0;t<600;t+=.5)for(let k=0;k<3;k++){
  const a=orbitPoint(3*k,t,example),b=orbitPoint(3*k+1,t,example),c=orbitPoint(3*k+2,t,example);
  near(b.angle-a.angle,Math.PI*2/3);near(c.angle-b.angle,Math.PI*2/3);
 }
});
test('orbit derivatives match finite differences',()=>{
 for(let i=0;i<9;i++)for(let time of [0,13,120]){
  const dt=1e-4,a=orbitPoint(i,time-dt,example),b=orbitPoint(i,time+dt,example),p=orbitPoint(i,time,example);
  near((b.x-a.x)/(2*dt),p.vx,1e-6);near((b.y-a.y)/(2*dt),p.vy,1e-6);
 }
});
test('drawn cubic orbital paths and record anchors agree to subpixel precision',()=>{
 for(let i=0;i<9;i++)for(let time=0;time<180;time+=.25){
  const p=orbitPoint(i,time,example),r=example.radii[p.track],c=ellipseCurve(r,r*example.projection,example.rotation,example.cx,example.cy);
  const u=((p.angle/(2*Math.PI))%1+1)%1;assert.ok(distance(p,curvePoint(c,u))<.002);
 }
});
test('one aperture crossing at a time and at most two travellers',()=>{
 for(let p=.05;p<.1001;p+=.00002){
  const poses=Array.from({length:9},(_,i)=>documentPose(i,p,0,0,example));
  assert.ok(poses.filter(x=>x.state==='capture').length<=2);
 }
 const crossings=CAPTURE_ORDER.map((_,i)=>PHASE1.captureStart+i*PHASE1.captureSlot+PHASE1.captureDuration);
 assert.equal(new Set(crossings).size,9);
});
test('capture preserves incoming position, velocity and acceleration',()=>{
 const eps=1e-7;
 for(const i of CAPTURE_ORDER){
  const launch=PHASE1.captureStart+CAPTURE_ORDER.indexOf(i)*PHASE1.captureSlot;
  const at=p=>documentPose(i,p,(p-PHASE1.ambientEnd)*PHASE1.narrativeSeconds,0,example);
  const a=at(launch-eps),c=at(launch),b=at(launch+eps);
  assert.ok(distance(a,c)<.01);assert.ok(distance(c,b)<.01);
  near((c.x-a.x)/eps,(b.x-c.x)/eps,1);near((c.y-a.y)/eps,(b.y-c.y)/eps,1);
 }
});
test('capture path start does not chase wall clock while paused',()=>{
 for(let i=0;i<9;i++){
  const p=PHASE1.captureStart+CAPTURE_ORDER.indexOf(i)*PHASE1.captureSlot+.002;
  const a=documentPose(i,p,10,3,example),b=documentPose(i,p,500,3,example);
  assert.equal(a.x,b.x);assert.equal(a.y,b.y);
 }
});
test('all nine original documents dock into a unique 3x3 matrix by scene 03 target',()=>{
 const pts=Array.from({length:9},(_,i)=>documentPose(i,.122,0,0,example));
 assert.ok(pts.every(p=>p.state==='matrix'&&p.opacity===1));assert.equal(new Set(pts.map(p=>`${p.x},${p.y}`)).size,9);
 assert.equal(new Set(pts.map(p=>p.x)).size,3);assert.equal(new Set(pts.map(p=>p.y)).size,3);
});
test('60Hz and 120Hz clocks produce equivalent elapsed motion',()=>{
 const a=new Phase1Clock(),b=new Phase1Clock();
 for(let i=0;i<60*60;i++)a.tick(1/60,0);for(let i=0;i<120*60;i++)b.tick(1/120,0);
 near(a.time,b.time,1e-9);
});
test('scroll locks time, reverse scrubbing reproduces positions, resume is continuous',()=>{
 const c=new Phase1Clock();for(let i=0;i<600;i++)c.tick(1/60,0);
 const start=c.time;c.tick(1/60,.075);const p=c.time;
 for(let i=0;i<1200;i++)c.tick(1/60,.075);near(p,c.time);
 c.tick(1/60,.13);c.tick(1/60,.075);near(p,c.time);
 c.tick(1/60,PHASE1.ambientEnd);near(c.time,start);c.tick(1/60,0);near(c.time,start+1/60);
});
test('pure state reconstructs forward and reverse poses without accumulated error',()=>{
 const forward=[];for(let j=0;j<=250;j++){const p=j/1000;forward.push(Array.from({length:9},(_,i)=>documentPose(i,p,Math.max(0,p-.042)*260,0,example)));}
 for(let j=250;j>=0;j--)assert.deepEqual(forward[j],Array.from({length:9},(_,i)=>documentPose(i,j/1000,Math.max(0,j/1000-.042)*260,0,example)));
});
test('ring/line/atom use consistent open cubic topology and finite points',()=>{
 for(let i=0;i<3;i++)for(let k=0;k<=200;k++){
  const c=systemCurve(i,k<100?k/100:1,k>100?(k-100)/100:0);
  assert.equal(c.length,32);assert.equal((curvePath(c).match(/C/g)||[]).length,32);
  for(const s of c)for(const p of s){assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));assert.ok(Math.abs(p.x)<370&&Math.abs(p.y)<270);}
 }
});
test('rings are closed-looking open paths; lanes have separated endpoints',()=>{
 for(let i=0;i<3;i++){
  const r=systemCurve(i,0,0),l=systemCurve(i,1,0),a=systemCurve(i,1,1);
  assert.ok(distance(r[0][0],r.at(-1)[3])<1e-8);assert.ok(distance(l[0][0],l.at(-1)[3])>400);
  assert.ok(distance(a[0][0],a.at(-1)[3])<1e-8);
  for(const s of l)for(const p of s)near(p.y,[-66,0,66][i]);
 }
});
test('curvature closure has no zero derivative or pinched path',()=>{
 for(let i=0;i<3;i++)for(let k=0;k<=100;k++){
  const c=systemCurve(i,1,k/100);
  for(const s of c)assert.ok(distance(s[0],s[1])>1);
 }
});
test('arc-length nodes lie on their exact master cubics through both transitions',()=>{
 for(let i=0;i<3;i++)for(let k=0;k<=100;k++){
  const u=k/100,c=systemCurve(i,k<50?u*2:1,k>50?(u-.5)*2:0),tab=arcTable(c);
  for(const f of [.16,.48,.79]){const p=pointAtFraction(c,f,tab);near(distance(p,curvePoint(c,p.u)),0);}
 }
});
test('Z grows from the same solid anchor and conservatively covers all viewport corners',()=>{
 assert.ok(Z_PATH.length>100);assert.ok(Z_SAFE_RADIUS>8);
 for(const [w,h,cx,cy,zSize] of [[1440,900,1080,475,79],[390,844,185,540,57],[320,568,150,386,32],[844,390,634,216,36]]){
  const L={...example,w,h,cx,cy,zSize};near(wipeScale(PHASE1.wipeStart,L,Z_SAFE_RADIUS),1);
  const s=wipeScale(PHASE1.wipeEnd,L,Z_SAFE_RADIUS),radius=s*zSize/120*Z_SAFE_RADIUS;
  for(const [x,y] of [[0,0],[w,0],[0,h],[w,h]])assert.ok(radius>Math.hypot(x-cx,y-cy));
 }
});
test('initial markup contains a complete inline scene with unique IDs and local symbols',()=>{
 const html=fs.readFileSync('public/index.html','utf8'),ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(new Set(ids).size,ids.length);
 assert.equal((html.match(/data-p1-doc="/g)||[]).length,9);assert.equal((html.match(/data-p1-orbit="/g)||[]).length,3);
 for(const m of html.matchAll(/<use[^>]*href="#([^"]+)"/g))assert.ok(ids.includes(m[1]));
 assert.ok(fs.existsSync('licenses/TABLER-MIT.txt'));
});

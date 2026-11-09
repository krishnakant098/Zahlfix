import test from 'node:test';
import assert from 'node:assert/strict';
import {systemCurve,arcTable,pointAtFraction,curvePoint} from '../../public/assets/v6/phase1-geometry.js';
import {stringCurve,hybridCurve,serviceGuideCurve,morphCurves,pluckValue,SCENE0609} from '../../public/assets/v6/scene0609-geometry.js';

const finiteCurve=c=>c.length===32&&c.every(seg=>seg.length===4&&seg.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));

test('Scenes 05-09 keep one 32-cubic topology on all three tracked paths',()=>{
 for(let i=0;i<3;i++){
  const shapes=[systemCurve(i,1,1),stringCurve(i,0),hybridCurve(i),serviceGuideCurve(i)];
  for(const c of shapes)assert.ok(finiteCurve(c));
  for(const t of [0,.25,.5,.75,1])assert.ok(finiteCurve(morphCurves(shapes[0],shapes[1],t)));
 }
});

test('Scene 06 strings keep fixed endpoints while local recoil deforms the path',()=>{
 for(let i=0;i<3;i++){
  const zero=stringCurve(i,0),plucked=stringCurve(i,36);
  assert.ok(Math.hypot(zero[0][0].x-plucked[0][0].x,zero[0][0].y-plucked[0][0].y)<1e-8);
  assert.ok(Math.hypot(zero.at(-1)[3].x-plucked.at(-1)[3].x,zero.at(-1)[3].y-plucked.at(-1)[3].y)<1e-8);
  const a=pointAtFraction(zero,[.28,.5,.72][i],arcTable(zero));
  const b=pointAtFraction(plucked,[.28,.5,.72][i],arcTable(plucked));
  assert.ok(Math.abs(b.y-a.y)>3);
 }
});

test('damped note recoil is bounded, deterministic and returns to rest',()=>{
 for(let i=0;i<3;i++){
  const start=SCENE0609.pluckStarts[i],amp=44;
  assert.equal(pluckValue(start,start,.014,amp),0);
  assert.equal(pluckValue(start+.014,start,.014,amp),0);
  for(let k=0;k<=100;k++)assert.ok(Math.abs(pluckValue(start+.014*k/100,start,.014,amp))<=amp+1e-9);
 }
});

test('Scene 07 starts from the exact approved Scene 05 three-plane atom geometry',()=>{
 for(let i=0;i<3;i++){
  const source=systemCurve(i,1,1),hybrid=hybridCurve(i,{expand:0});
  for(const u of [0,.125,.25,.5,.75,.875,1]){
   const a=curvePoint(source,u),b=curvePoint(hybrid,u);
   assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<1e-8);
  }
  const expanded=hybridCurve(i,{expand:1}),a=curvePoint(source,.25),b=curvePoint(expanded,.25);
  assert.ok(Math.hypot(b.x,b.y)>Math.hypot(a.x,a.y));
 }
});

test('service entrance uses three organisers without pretending to be ten services',()=>{
 assert.equal([0,1,2].map(i=>serviceGuideCurve(i)).length,3);
 for(let i=0;i<3;i++)assert.ok(finiteCurve(serviceGuideCurve(i)));
});

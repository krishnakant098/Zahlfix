import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {layoutProfile,makeScrollMap,mapValue} from '../../public/assets/v6/mobile-layout.js';
import {STORY_SCENES} from '../../public/assets/v6/scene-registry.js';
import {Z_PATH,Z_SAFE_RADIUS} from '../../public/assets/v6/phase1-brand.js';
test('one profile authority handles phones, portrait tablets and short landscape',()=>{
 for(const [w,h,name,stacked] of [[320,568,'small',true],[390,844,'phone',true],[768,1024,'tablet',true],[1024,1366,'tablet',true],[844,390,'landscape',false],[1440,900,'desktop',false]]) {
  const p=layoutProfile(w,h);assert.equal(p.name,name);assert.equal(p.stacked,stacked);
 }
});
test('mobile scene scroll map is strictly monotonic with all twenty entrances',()=>{
 for(const h of [360,568,844,1024,1366]){
  const points=makeScrollMap(h,true);assert.equal(points.length,21);assert.equal(points[0].p,0);assert.equal(points.at(-1).p,1);
  for(let i=1;i<points.length;i++){assert.ok(points[i].p>points[i-1].p);assert.ok(points[i].y>points[i-1].y);}
  assert.ok(points.at(-1).y-points.at(-2).y>=h);
 }
});
test('scene/local progress survives scroll-map remapping and orientation',()=>{
 const portrait=makeScrollMap(844,true),landscape=makeScrollMap(390,true);
 for(let i=0;i<=10000;i++){
  const p=i/10000,y=mapValue(p,portrait,'p','y'),q=mapValue(y,portrait,'y','p');
  const z=mapValue(q,landscape,'p','y');assert.ok(Math.abs(mapValue(z,landscape,'y','p')-p)<1e-12);
 }
});
test('all scene navigation targets land in their intended authored progress',()=>{
 const map=makeScrollMap(568,true);
 for(const scene of STORY_SCENES)assert.ok(Math.abs(mapValue(mapValue(scene.target,map,'p','y'),map,'y','p')-scene.target)<1e-12);
});
test('desktop retains a linear native-scroll map',()=>{
 const map=makeScrollMap(900,false,9600);assert.equal(mapValue(.5,map,'p','y'),4800);
});
test('ribbon has four bounded local exports and a registered silhouette inradius',()=>{
 const manifest=JSON.parse(fs.readFileSync('public/assets/brand/ribbon-manifest.json'));
 assert.deepEqual(manifest.pivot,[60,60]);assert.equal(manifest.exports.length,4);
 for(const e of manifest.exports){assert.ok(fs.existsSync('public/assets/brand/'+e.file));assert.ok(e.bytes<100000);}
 assert.ok(Math.abs(manifest.safeRadius-Z_SAFE_RADIUS)<.00001);assert.ok(Z_PATH.length>500);
});
test('contact reuses original form identity; no clones or duplicated field IDs',()=>{
 const html=fs.readFileSync('public/index.html','utf8');assert.equal((html.match(/id="challengeForm"/g)||[]).length,1);
 for(const key of ['name','company','email','phone','challenge'])assert.equal((html.match(new RegExp(`id="contact-${key}"`,'g'))||[]).length,1);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {materialDefinitions,coreArtwork,documentArtwork} from '../../public/assets/v6/phase1-materials.js';
import {observatoryDecoration,systemArtwork} from '../../public/assets/v6/phase1-artwork.js';
const motifs=JSON.parse(fs.readFileSync('tools/lib/document-motifs.json','utf8'));
test('material definitions are namespaced and do not install scripts or filters',()=>{
 const a=materialDefinitions('a','master'),b=materialDefinitions('b','master');
 const ids=s=>[...s.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(new Set(ids(a)).size,ids(a).length);
 assert.ok(!ids(a).some(id=>ids(b).includes(id)));assert.ok(!/<filter|<script|<foreignObject/.test(a));
 assert.ok(a.includes('a-gold-face')&&a.includes('a-ink-face')&&a.includes('a-bead-ink'));
});
test('ribbon surface and monochrome mask share one canonical viewbox',()=>{
 for(const ink of [false,true])for(const compact of [false,true]){
  const art=coreArtwork({ink,compact});
  assert.ok(art.includes('href="#p1-z-master"'));
  assert.ok(art.includes('data-ribbon-image')&&art.includes('width="120" height="120"'));
  assert.ok(!/<text|filter=/.test(art));assert.ok(art.includes('/assets/brand/zahlfix-ribbon-'));
 }
});
test('compact ribbon uses the smaller optical export without changing its registered bounds',()=>{
 assert.ok(coreArtwork().includes('384.webp'));
 assert.ok(coreArtwork({compact:true}).includes('192.webp'));
 assert.ok(coreArtwork({compact:true}).includes('preserveAspectRatio="xMidYMid meet"'));
});
test('six document motifs retain their original interior paths inside a material plate',()=>{
 assert.equal(Object.keys(motifs).length,6);
 for(const motif of Object.values(motifs))for(const compact of [true,false]){
  const s=documentArtwork(motif,{compact});assert.ok(s.includes(motif));assert.ok(s.includes('ivory-plate'));assert.ok(s.includes('p1m-paper-edge'));
 }
});
test('functional track cardinality remains three; material subdivision is not extra geometry',()=>{
 for(const atom of [0,.5,1]){
  const s=systemArtwork({unroll:1,atom});assert.equal((s.match(/data-p1-track="/g)||[]).length,3);
  assert.equal((s.match(/data-p1-material-segment="/g)||[]).length,24);
  assert.equal((s.match(/data-p1-node="/g)||[]).length,3);
 }
});
test('atmospheric detail is deterministic and has no runtime motion dependencies',()=>{
 assert.equal(observatoryDecoration(),observatoryDecoration());
 assert.ok(!/Math.random|animateTransform|<animate|<script/.test(observatoryDecoration()));
});
test('generated stage embeds original resource identity without runtime remote assets',()=>{
 const s=fs.readFileSync('public/index.html','utf8').split('<!-- PHASE1_STAGE_START -->')[1].split('<!-- PHASE1_STAGE_END -->')[0];
 assert.equal((s.match(/data-p1-doc="/g)||[]).length,9);assert.equal((s.match(/data-p1-orbit="/g)||[]).length,3);
 assert.ok(s.includes('data-phase1="r4"'));assert.ok(! /https?:|<script|<filter|style="/.test(s));
});

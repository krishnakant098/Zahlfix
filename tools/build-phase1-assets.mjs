/** R4 generator: shared master paths/materials produce both standalone assets and inline stage.
 * No duplicated hand-edited HTML. Run npm run assets:phase1 after artwork changes.
 */
import fs from 'node:fs';
import path from 'node:path';
import {Z_PATH} from '../public/assets/v6/phase1-brand.js';
import {orbitPoint,ellipseCurve,curvePath,systemCurve} from '../public/assets/v6/phase1-geometry.js';
import {materialDefinitions,coreArtwork,documentArtwork,apertureArtwork} from '../public/assets/v6/phase1-materials.js';
import {observatoryDecoration,systemArtwork} from '../public/assets/v6/phase1-artwork.js';
const root=path.resolve(import.meta.dirname,'..');
const assets=path.join(root,'public/assets/scene-01-05');
const motifs=JSON.parse(fs.readFileSync(path.join(root,'tools/lib/document-motifs.json'),'utf8'));
const types=Object.keys(motifs);
const master=`<path id="p1-z-master" d="${Z_PATH}"/>`;
const mat=materialDefinitions();
const xml=(name,viewBox,art,extra='')=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-label="${name}"><title>${name}</title><desc>ZahlFix R3 Gold Observatory. Authored material layers. Document motifs adapted from Tabler, MIT; retain licenses/TABLER-MIT.txt.</desc><defs>${master}${mat}${extra}</defs>${art}</svg>`;
const embedImages = art => art.replace(/href="(\/assets\/brand\/[^"]+)"/g,(_m,url)=>`href="data:image/webp;base64,${fs.readFileSync(path.join(root,'public',url)).toString('base64')}"`);
const save=(name,viewBox,art,extra='')=>fs.writeFileSync(path.join(assets,name+'.svg'),xml(name,viewBox,embedImages(art),extra).replace(/(\sdata-[\w-]+)(?=[\s>])/g,'$1=""'));
let defs=master+mat;
for(const type of types)for(const compact of [false,true]){
  const suffix=compact?'-compact':'',art=documentArtwork(motifs[type],{compact});
  save('document-'+type+suffix,'0 0 64 88',art);
  defs+=`<symbol id="p1-doc-${type}${suffix}" viewBox="0 0 64 88">${art}</symbol>`;
}
save('z-observatory-gold','-48 -45 216 216',coreArtwork());
save('z-observatory-ink','-48 -45 216 216',coreArtwork({ink:true}));
save('z-observatory-compact','0 0 124 125',coreArtwork({compact:true,halo:false}));
save('z-transition-mask','0 0 120 120','<use href="#p1-z-master" fill="white"/>');
save('capture-aperture','0 0 120 120',apertureArtwork());
const layout={cx:360,cy:260,radii:[115,207,300],projection:.72,rotation:-Math.PI/30};
let tracks='';
layout.radii.forEach((r,i)=>{
 const c=ellipseCurve(r,r*layout.projection,layout.rotation);
 tracks+=`<g data-p1-orbit="${i}" transform="translate(360 260)" fill="none"><path class="p1-orbit-bed" d="${curvePath(c)}" stroke="#070C10" stroke-width="3"/>
 <path class="p1-orbit-far" d="${curvePath(c.slice(16))}" stroke="#786340" stroke-width=".85"/>
 <path class="p1-orbit-near" d="${curvePath(c.slice(0,16))}" stroke="url(#p1m-orbit-metal)" stroke-width="1.25"/>
 <path class="p1-orbit-glint" d="${curvePath(c.slice(2,6))}" stroke="url(#p1m-orbit-glint)" stroke-width=".65" transform="translate(-.35 -.5)"/></g>`;
});
const objects=[];
for(let i=0;i<9;i++){
 const p=orbitPoint(i,0,layout),s=.94+.06*(p.depth+1)/2,type=types[i%types.length];
 objects.push({depth:p.depth,markup:`<g data-p1-doc="${i}" class="p1-doc" data-kind="${type}" transform="translate(${p.x} ${p.y}) scale(${36*s/64} ${49.5*s/88})"><g transform="translate(-32 -44)"><use class="p1-doc-full" href="#p1-doc-${type}" width="64" height="88"/><use class="p1-doc-compact" href="#p1-doc-${type}-compact" width="64" height="88"/><rect class="p1-doc-docking-edge" x="2.4" y="1.7" width="57.6" height="82.4" rx="2.1" fill="none" stroke="#F2D288" stroke-width="1.5" opacity="0"/></g></g>`});
}
objects.push({depth:0,markup:`<g data-p1-z-core class="p1-z-core" transform="translate(360 260) scale(.8) translate(-60 -60)">${coreArtwork()}</g>`});
objects.sort((a,b)=>a.depth-b.depth);
const aperture=`<g class="p1-aperture" opacity="0"><g class="p1-aperture-art">${apertureArtwork()}</g><g class="p1-capture-marks">${Array.from({length:9},(_,i)=>`<path data-p1-capture-mark="${i}" d="M${-5+(i%3)*4.5} ${-4+Math.floor(i/3)*5}h2.5"/>`).join('')}</g></g>`;
const ambient=`<g data-p1-observatory transform="translate(360 260)">${observatoryDecoration({projection:layout.projection,rotation:layout.rotation})}</g>`;
const module=`<g data-p1-module opacity="0"><path data-p1-module-case fill="url(#p1m-module-face)" stroke="#9B7B3C" stroke-opacity=".55" stroke-width=".7"/><path data-p1-module-brackets fill="none" stroke="#D8B562" stroke-width="1"/><path data-p1-module-circuit fill="none" stroke="#A88948" stroke-opacity=".34" stroke-width=".65"/><path data-p1-module-link fill="none" stroke="#6D5B34" stroke-width="1"/><path data-p1-module-link-glint fill="none" stroke="#E3C57E" stroke-width="1.2"/><circle data-p1-module-signal r="2.4" fill="url(#p1m-bead)" opacity="0"/></g>`;
const space=`${ambient}${tracks}${module}<g data-p1-depth>${objects.map(o=>o.markup).join('')}</g>${aperture}`;
save('orbital-observatory','0 0 720 520',space.replace(/class="p1-doc-compact"/g,'class="p1-doc-compact" display="none"'),defs.replace(master+mat,''));
for(const [name,unroll,atom] of [['engraved-system',0,0],['process-instrument',1,0],['atom-observatory',1,1]]){
 let art=systemArtwork({unroll,atom});
 if(unroll===1&&!atom){art=art.replace('data-p1-system-calibration>','data-p1-system-calibration opacity="0">');}
 if(atom){art=art.replace('data-p1-atom-framework opacity="0"','data-p1-atom-framework opacity=".2"');art=art.replace('data-p1-registration opacity=".6"','data-p1-registration opacity="0"');}
 save(name,'-355 -265 710 530',`<rect x="-355" y="-265" width="710" height="530" fill="#C39438"/>${art}`);
}
defs+='<mask id="p1-aperture-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="3000" height="2000"><rect data-p1-mask-bg width="3000" height="2000" fill="white"/><ellipse data-p1-mask-hole cx="50" cy="260" rx="15" ry="28" fill="black"/></mask>';
const markup=`<!-- PHASE1_STAGE_START -->
<div aria-hidden="true" class="phase1-world" data-phase1="r4" data-art-direction="gold-observatory">
<svg class="p1-svg" viewBox="0 0 720 520" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
<defs>${defs}</defs><g data-p1-space>${space}</g>
<g data-p1-z-takeover class="p1-z-takeover" opacity="0"><use href="#p1-z-master" fill="#C39438"/><g data-p1-wipe-material>${coreArtwork({halo:false})}</g></g>
<g data-p1-principle opacity="0">${systemArtwork()}</g>
</svg></div>
<!-- PHASE1_STAGE_END -->`;
const file=path.join(root,'public/index.html');let html=fs.readFileSync(file,'utf8');
if(!html.includes('<!-- PHASE1_STAGE_START -->'))throw new Error('Expected baseline stage missing; refusing to overwrite unrelated HTML');
html=html.replace(/<!-- PHASE1_STAGE_START -->[\s\S]*?<!-- PHASE1_STAGE_END -->/,markup);
fs.writeFileSync(file,html);
console.log('Generated R4 ribbon stage and 21 editable local artwork assets from shared masters.');

/** Numerical sweep of measured browser layouts; not a substitute for motion review. */
import fs from 'node:fs';
import {orbitPoint,documentPose,systemCurve,curvePoint} from '../public/assets/v6/phase1-geometry.js';
import {PHASE1} from '../public/assets/v6/phase1-timeline.js';
const rows=JSON.parse(fs.readFileSync('qa/r4/layouts.json','utf8'));
const collisions=[],clips=[],textHits=[],systemClips=[];
let frames=0,posesChecked=0;
function bounds(p,L){const s=p.scale??(.94+.06*(p.depth+1)/2),w=L.docWidth*s,h=L.docHeight*s;return {left:p.x-w/2,right:p.x+w/2,top:p.y-h/2,bottom:p.y+h/2};}
function intersects(a,b,pad=0){return Math.min(a.right,b.right)-Math.max(a.left,b.left)>pad&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>pad;}
for(const {label,layout:L} of rows){
 for(let step=0;step<=24000;step++){
  const time=step/40,poses=Array.from({length:9},(_,i)=>orbitPoint(i,time,L)),bb=poses.map(p=>bounds(p,L));frames++;posesChecked+=9;
  for(let i=0;i<9;i++){
   const a=bb[i];
   if((a.left<0||a.right>L.w||a.top<0||a.bottom>L.h-55)&&clips.length<50)clips.push({label,time,i,a});
   if(intersects(a,L.textBounds[0],.25)&&textHits.length<50)textHits.push({label,time,i,a});
   for(let j=i+1;j<9;j++)if(intersects(a,bb[j],.25)&&collisions.length<50)collisions.push({label,time,i,j,a,b:bb[j]});
  }
 }
 for(let k=0;k<=300;k++){
  const unroll=k<=150?k/150:1,atom=k>150?(k-150)/150:0;
  for(let i=0;i<3;i++){
   const c=systemCurve(i,unroll,atom);
   for(let j=0;j<=128;j++){
    const p=curvePoint(c,j/128),x=L.systemX+p.x*L.systemScale,y=L.systemY+p.y*L.systemScale;
    if((x<5||x>L.w-28||y<85||y>L.h-55)&&systemClips.length<50)systemClips.push({label,k,i,x,y});
   }
  }
 }
}
const report={mode:'10-minute numerical orbit sweep, 40Hz, actual measured browser layouts',layouts:rows.length,frames,posesChecked,
 collisions,clips,textHits,systemClips,passed:!collisions.length&&!clips.length&&!textHits.length&&!systemClips.length};
fs.writeFileSync('qa/r4/geometry-sweep.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({...report,collisions:collisions.length,clips:clips.length,textHits:textHits.length,systemClips:systemClips.length},null,2));
process.exit(report.passed?0:1);

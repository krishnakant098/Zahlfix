/** Sample fixed capture trajectories against actual measured screen/text bounds.
 * This is a numerical safety check, not a dynamic rigid-body physics simulation.
 */
import fs from 'node:fs';
import {documentPose} from '../public/assets/v6/phase1-geometry.js';
import {PHASE1} from '../public/assets/v6/phase1-timeline.js';
const rows=JSON.parse(fs.readFileSync('qa/r4/layouts.json','utf8'));
const errors=[];let checked=0,maxTravellers=0;
for(const {label,layout:L} of rows){
 for(let seed=0;seed<=600;seed+=20){
  for(let step=0;step<=660;step++){
   const p=.057+step*.0001,time=seed+(p-PHASE1.ambientEnd)*PHASE1.narrativeSeconds;
   const poses=Array.from({length:9},(_,i)=>documentPose(i,p,time,seed,L));
   maxTravellers=Math.max(maxTravellers,poses.filter(p=>p.state==='capture').length);
   for(let i=0;i<9;i++){
    const a=poses[i];if(!a.opacity)continue;checked++;
    const w=L.docWidth*a.scale,h=L.docHeight*a.scale;
    const box={l:a.x-w/2,r:a.x+w/2,t:a.y-h/2,b:a.y+h/2};
    const text=L.textBounds[p<.103?1:2];
    const hit=Math.min(box.r,text.right)-Math.max(box.l,text.left)>.5 && Math.min(box.b,text.bottom)-Math.max(box.t,text.top)>.5;
    if((box.l<0||box.r>L.w||box.t<70||box.b>L.h-54||hit)&&errors.length<60)errors.push({label,seed,p,i,state:a.state,box,hit});
   }
  }
 }
}
const report={mode:'Numerical capture/reassembly sweep over 31 different orbital departure times per layout',layouts:rows.length,checked,maxTravellers,errors,passed:errors.length===0&&maxTravellers<=2};
fs.writeFileSync('qa/r4/capture-sweep.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({...report,errors:errors.length},null,2));process.exit(report.passed?0:1);

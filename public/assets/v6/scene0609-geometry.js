import {parametricCurve, ellipseCurve, systemCurve} from './phase1-geometry.js';
import {clamp,mix} from './phase1-timeline.js';

const lerpPoint=(a,b,t)=>({x:mix(a.x,b.x,t),y:mix(a.y,b.y,t)});

/** Morph two equal-topology cubic paths without changing point correspondence. */
export function morphCurves(a,b,t){
  const k=clamp(t),n=Math.min(a.length,b.length),out=[];
  for(let i=0;i<n;i++)out.push(a[i].map((p,j)=>lerpPoint(p,b[i][j],k)));
  return out;
}

function numericalCurve(fn,n=32){
  const eps=1e-4;
  return parametricCurve(fn,u=>{
    const a=fn(Math.max(0,u-eps)),b=fn(Math.min(1,u+eps)),d=Math.max(1e-6,Math.min(1,u+eps)-Math.max(0,u-eps));
    return {x:(b.x-a.x)/d,y:(b.y-a.y)/d};
  },n);
}

/** Scene 06: three tensioned strings. pluck is in local SVG units. */
export function stringCurve(track,pluck=0,{compact=false}={}){
  const lanes=compact?[-52,0,52]:[-68,0,68];
  const L=compact?410:510;
  const note=[.28,.5,.72][track];
  return numericalCurve(u=>{
    // Fixed ends, concentrated displacement around each document-note.
    const local=(u-note)/(compact?.115:.105);
    const envelope=Math.exp(-local*local*1.55)*Math.sin(Math.PI*u);
    return {x:(u-.5)*L,y:lanes[track]+pluck*envelope};
  });
}

/** Scene 07/08: retain the approved Scene-05 atom geometry, then enlarge it as one system.
 * Track identities and plane angles stay unchanged, so the atom does not visually reset. */
export function hybridCurve(track,{compact=false,expand=0}={}){
  const base=systemCurve(track,1,1);
  const k=1+expand*(compact?.11:.18);
  // Scene 07 is the same atom language as Scene 05; Scene 08 enlarges the whole system.
  return base.map(seg=>seg.map(pt=>({x:pt.x*k,y:pt.y*k})));
}

/** Scene 09 entrance: three organising guides, not ten fake service paths. */
export function serviceGuideCurve(track,{compact=false}={}){
  const L=compact?390:520, lanes=compact?[-50,0,50]:[-66,0,66];
  if(track<2){
    const y=lanes[track];
    return numericalCurve(u=>({x:(u-.5)*L,y}));
  }
  const H=compact?250:320;
  return numericalCurve(u=>({x:0,y:(u-.5)*H}));
}

/** Scroll-reversible damped recoil. */
export function pluckValue(p,start,duration,amplitude){
  const t=clamp((p-start)/duration);
  if(t<=0||t>=1)return 0;
  // three increasingly small oscillations, zero at both ends.
  return amplitude*Math.sin(t*Math.PI*6)*Math.exp(-4.7*t)*Math.sin(Math.PI*t);
}

export const SCENE0609 = Object.freeze({
  handoffStart:.226,
  stringsStart:.231,
  stringsLive:.240,
  pluckStarts:[.241,.249,.257],
  pluckDuration:.014,
  hybridStart:.266,
  hybridLive:.281,
  brandStart:.308,
  brandLive:.322,
  brandHold:.339,
  gridStart:.343,
  gridLive:.368,
  end:.378,
});

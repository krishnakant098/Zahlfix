/** Pure SVG geometry, shared by renderer and numerical tests. CSS-pixel output. */
import {PHASE1,CAPTURE_ORDER,clamp,mix,smooth,ramp} from './phase1-timeline.js';
export const TAU=2*Math.PI;
export const PERIODS=Object.freeze([42,101.428,176.9638]);
export const OFFSETS=Object.freeze([.18,.76,1.29]);
export const SEGMENTS=32;
export const rotate=(x,y,a)=>({x:x*Math.cos(a)-y*Math.sin(a),y:x*Math.sin(a)+y*Math.cos(a)});
export function orbitPoint(i,time,layout) {
  const track=Math.floor(i/3),omega=TAU/PERIODS[track];
  const angle=OFFSETS[track]+(i%3)*TAU/3+time*omega;
  const radius=layout.radii[track],q=layout.projection,rot=layout.rotation;
  const xy=rotate(radius*Math.cos(angle),radius*q*Math.sin(angle),rot);
  const v=rotate(-radius*Math.sin(angle)*omega,radius*q*Math.cos(angle)*omega,rot);
  const a=rotate(-radius*Math.cos(angle)*omega*omega,-radius*q*Math.sin(angle)*omega*omega,rot);
  return {x:layout.cx+xy.x,y:layout.cy+xy.y,vx:v.x,vy:v.y,ax:a.x,ay:a.y,angle,depth:Math.sin(angle),track};
}
export function ellipsePoint(rx,ry,rot,cx,cy,u) {
  const a=TAU*u,xy=rotate(rx*Math.cos(a),ry*Math.sin(a),rot);
  return {x:cx+xy.x,y:cy+xy.y};
}
export function parametricCurve(fn,der,n=SEGMENTS) {
  const segments=[];
  for(let i=0;i<n;i++){
    const a=i/n,b=(i+1)/n,h=(b-a)/3,p0=fn(a),p3=fn(b),d0=der(a),d1=der(b);
    segments.push([p0,{x:p0.x+h*d0.x,y:p0.y+h*d0.y},{x:p3.x-h*d1.x,y:p3.y-h*d1.y},p3]);
  }
  return segments;
}
export function ellipseCurve(rx,ry,rot=0,cx=0,cy=0) {
  return parametricCurve(u=>ellipsePoint(rx,ry,rot,cx,cy,u),u=>rotate(-TAU*rx*Math.sin(TAU*u),TAU*ry*Math.cos(TAU*u),rot));
}
const fmt=p=>`${p.x.toFixed(3)} ${p.y.toFixed(3)}`;
export function curvePath(segments) {
  if(!segments.length)return '';
  return 'M'+fmt(segments[0][0])+segments.map(s=>'C'+fmt(s[1])+' '+fmt(s[2])+' '+fmt(s[3])).join('');
}
export function cubicPoint(s,t) {
  const a=1-t,b=a*a,c=t*t;
  return {x:a*b*s[0].x+3*b*t*s[1].x+3*a*c*s[2].x+c*t*s[3].x,
          y:a*b*s[0].y+3*b*t*s[1].y+3*a*c*s[2].y+c*t*s[3].y};
}
export function curvePoint(segments,u) {
  const v=clamp(u)*segments.length,i=Math.min(segments.length-1,Math.floor(v));
  return cubicPoint(segments[i],v-i);
}
/** Arc-length lookup evaluates the exact same cubics that SVG draws. */
export function arcTable(curve,samples=8) {
  const table=[{length:0,u:0}],totalSamples=curve.length*samples;
  let prev=curve[0][0],length=0;
  for(let k=1;k<=totalSamples;k++){
    const u=k/totalSamples,p=curvePoint(curve,u);
    length+=Math.hypot(p.x-prev.x,p.y-prev.y);table.push({length,u});prev=p;
  }
  return {entries:table,length};
}
export function pointAtFraction(curve,fraction,table=arcTable(curve)) {
  const target=clamp(fraction)*table.length,entries=table.entries;
  let lo=0,hi=entries.length-1;
  while(hi-lo>1){const m=(lo+hi)>>1;if(entries[m].length<target)lo=m;else hi=m;}
  const a=entries[lo],b=entries[hi];
  const u=mix(a.u,b.u,(target-a.length)/Math.max(1e-9,b.length-a.length));
  return {...curvePoint(curve,u),u};
}
/** Coincident open endpoints separate as curvature decreases. Never a crushed closed border. */
export function systemCurve(track,unroll,atom) {
  const radii=[78,141,204],lengths=[424,472,520],lanes=[-66,0,66];
  const r=radii[track],L=lengths[track],lane=lanes[track];
  let sweep,length,squash=1,y=lane*unroll,rotation=0;
  if(atom>0){
    const close=ramp(atom,0,.82);
    sweep=TAU*close;
    length=mix(L,TAU*220,close);
    squash=mix(1,83/220,close);
    y=lane*(1-close);
    rotation=[-Math.PI/3,0,Math.PI/3][track]*ramp(atom,.24,1);
  } else {sweep=TAU*(1-unroll);length=mix(TAU*r,L,unroll);}
  // Stable limit as sweep approaches zero, including derivatives.
  const sinc=x=>Math.abs(x)<1e-5?1-x*x/6:Math.sin(x)/x;
  const radius=sweep>1e-8?length/sweep:0;
  const shift=sweep>1e-8?radius*Math.sin(sweep/4)**2:0;
  const fn=u=>{
    const a=(u-.5)*sweep;
    const px=length*(u-.5)*sinc(a);
    const py=(sweep>1e-8?radius*2*Math.sin(a/2)**2-shift:0)*squash+y;
    return rotate(px,py,rotation);
  };
  const der=u=>rotate(length*Math.cos((u-.5)*sweep),length*Math.sin((u-.5)*sweep)*squash,rotation);
  return parametricCurve(fn,der);
}
/** Quintic Hermite segment: both position, velocity and acceleration match at entry. */
export function quintic(p0,v0,a0,p1,v1,a1,t) {
  const h0=1-10*t**3+15*t**4-6*t**5;
  const h1=t-6*t**3+8*t**4-3*t**5;
  const h2=(t*t-3*t**3+3*t**4-t**5)/2;
  const h3=10*t**3-15*t**4+6*t**5;
  const h4=-4*t**3+7*t**4-3*t**5;
  const h5=(t**3-2*t**4+t**5)/2;
  return h0*p0+h1*v0+h2*a0+h3*p1+h4*v1+h5*a1;
}
export function documentPose(i,p,time,departure,layout) {
  const order=CAPTURE_ORDER.indexOf(i),launch=PHASE1.captureStart+order*PHASE1.captureSlot;
  const orbit=orbitPoint(i,time,layout);
  const baseScale=.94+.06*(orbit.depth+1)/2;
  if(p<launch)return {...orbit,scale:baseScale,opacity:1,state:'orbit',order};
  const startTime=departure+(launch-PHASE1.ambientEnd)*PHASE1.narrativeSeconds;
  const start=orbitPoint(i,startTime,layout);
  const u=clamp((p-launch)/PHASE1.captureDuration),duration=PHASE1.captureDuration*PHASE1.narrativeSeconds;
  const dx=layout.sink.x-start.x,dy=layout.sink.y-start.y;
  let x=quintic(start.x,start.vx*duration,start.ax*duration*duration,layout.sink.x,dx*1.35,0,u);
  let y=quintic(start.y,start.vy*duration,start.ay*duration*duration,layout.sink.y,dy*1.35,0,u);
  let scale=mix(.94+.06*(start.depth+1)/2,.18,ramp(u,.44,1)),opacity=u<1?1:0,state=u<1?'capture':'captured';
  const build=PHASE1.assemblyStart+i*PHASE1.assemblySlot;
  if(p>=build){
    const a=clamp((p-build)/PHASE1.assemblyDuration),col=i%3,row=Math.floor(i/3);
    const gx=layout.grid.x+(col-1)*layout.grid.gapX,gy=layout.grid.y+(row-1)*layout.grid.gapY;
    x=quintic(layout.sink.x,0,0,gx,0,0,a);
    y=quintic(layout.sink.y,(gy-layout.sink.y)*.4,0,gy,0,0,a);
    scale=mix(.18,layout.grid.scale,smooth(a));opacity=1;state=a<1?'assemble':'matrix';
  }
  return {x,y,scale,opacity,depth:2,track:Math.floor(i/3),state,order};
}
export function wipeScale(p,layout,safeRadius) {
  if(p<PHASE1.wipeStart)return 1;
  const far=Math.max(...[[0,0],[layout.w,0],[0,layout.h],[layout.w,layout.h]].map(([x,y])=>Math.hypot(x-layout.cx,y-layout.cy)));
  const finalScale=far/(layout.zSize/120*safeRadius)*1.03;
  if(p<PHASE1.wipeReadable)return mix(1,3,ramp(p,PHASE1.wipeStart,PHASE1.wipeReadable));
  return Math.exp(mix(Math.log(3),Math.log(finalScale),ramp(p,PHASE1.wipeReadable,PHASE1.wipeEnd)));
}

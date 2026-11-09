/** R3 static instrument detail. Decorative paths never own functional geometry or clocks. */
import {ellipseCurve,ellipsePoint,curvePath,systemCurve,arcTable,pointAtFraction} from './phase1-geometry.js';
import {coreArtwork} from './phase1-materials.js';
const f=v=>v.toFixed(3);
export function calibration({radius=326,projection=1,rotation=0,count=96,dark=true,prefix='p1m'}={}) {
  let minor='',major='';
  for(let i=0;i<count;i++){
    // Two precise breaks keep this an incomplete calibration border, not a fourth orbit.
    if((i>17&&i<22)||(i>59&&i<65))continue;
    const u=i/count,len=i%8===0?8:i%4===0?4.6:2.3;
    const a=ellipsePoint(radius, radius*projection, rotation,0,0,u),b=ellipsePoint(radius-len,(radius-len)*projection,rotation,0,0,u);
    const line=`M${f(a.x)} ${f(a.y)}L${f(b.x)} ${f(b.y)}`;
    if(i%4===0)major+=line;else minor+=line;
  }
  const curve=ellipseCurve(radius,radius*projection,rotation);
  const d=curvePath(curve.slice(0,6))+' '+curvePath(curve.slice(8,20))+' '+curvePath(curve.slice(23));
  return `<g class="p1-calibration" data-decoration="calibration" fill="none">
  <path d="${d}" stroke="${dark?'#987B3F':'#4B421E'}" stroke-width=".65" opacity="${dark?'.47':'.38'}"/>
  <path d="${major}" stroke="${dark?'#DCC17A':'#3E3C23'}" stroke-width=".85" opacity="${dark?'.58':'.53'}"/>
  <path class="p1-fine-detail" d="${minor}" stroke="${dark?'#C4A65F':'#413923'}" stroke-width=".55" opacity="${dark?'.40':'.30'}"/>
  </g>`;
}
export function observatoryDecoration({projection=.72,rotation=-Math.PI/30,prefix='p1m'}={}) {
  let stars='';
  for(let i=0;i<32;i++){
    const u=((i*.61803399)+.13)%1,r=165+(i*47%166),p=ellipsePoint(r,r*.86,0,0,0,u);
    stars+=`<circle cx="${f(p.x)}" cy="${f(p.y)}" r="${i%7===0?'.95':'.5'}" fill="${i%4===0?'#E9D4A1':'#B89B54'}" opacity="${i%3===0?'.55':'.26'}"/>`;
  }
  const diamond=(x,y,s)=>`<path d="M${x} ${y-s}Q${x+s*.2} ${y-s*.2} ${x+s} ${y}Q${x+s*.2} ${y+s*.2} ${x} ${y+s}Q${x-s*.2} ${y+s*.2} ${x-s} ${y}Q${x-s*.2} ${y-s*.2} ${x} ${y-s}Z" fill="#EAD9AB" opacity=".72"/>`;
  return `<g class="p1-observatory-setting" data-material="local-atmosphere">
  <ellipse rx="355" ry="${Math.min(258,350*projection)}" fill="url(#${prefix}-space-atmosphere)"/>
  <ellipse cx="-14" cy="4" rx="192" ry="160" fill="url(#${prefix}-gold-bloom)" opacity=".45"/>
  <g class="p1-fine-detail" data-decoration="stars">${stars}${diamond(74,-221,3.5)}${diamond(-258,106,2.4)}</g>
  ${calibration({radius:322,projection,rotation,prefix})}
  </g>`;
}
export function systemDecoration(prefix='p1m') {
  const poly=Array.from({length:7},(_,i)=>{const a=i*Math.PI/3-Math.PI/6;return `${i?'L':'M'}${f(Math.cos(a)*205)} ${f(Math.sin(a)*205)}`;}).join('');
  return `<g data-p1-system-atmosphere>
  <ellipse cy="8" rx="254" ry="234" fill="url(#${prefix}-gold-light)"/>
  </g><g data-p1-system-calibration>${calibration({radius:231,count:84,dark:false,prefix})}
  <path class="p1-fine-detail" d="M-233 0h8M225 0h8M0 -233v8M0 225v8" stroke="#4B4126" stroke-width=".8" opacity=".48"/>
  </g><g data-p1-atom-framework opacity="0" class="p1-fine-detail" fill="none" stroke="#6A562D" stroke-width=".6"><path d="${poly}Z"/><path d="M0 -205L177.535 102.5H-177.535Z"/></g>
  <g data-p1-registration opacity=".6"><path d="M-8 -2v-6h6M2 -8h6v6M8 2v6H2M-2 8h-6V2" fill="none" stroke="#6E582D" stroke-width=".8"/><circle r="1.2" fill="#5D4B29"/></g>`;
}
export function railSegment(i,j,d,{depth=0,atom=0,prefix='p1m'}={}) {
  return `<g data-p1-material-segment="${i}-${j}" data-depth="${depth.toFixed(3)}" class="p1-material-segment">
  <path class="p1-rail-occlusion" d="${d}" fill="none" stroke="#C39438" stroke-width="5.2" opacity="${atom}"/>
  <path class="p1-rail-light" d="${d}" fill="none" stroke="url(#${prefix}-engraving-light)" stroke-width="2.4" transform="translate(.6 .7)"/>
  <path class="p1-rail-body" d="${d}" fill="none" stroke="url(#${prefix}-engraving)" stroke-width="1.35" stroke-opacity="${atom?(.52+.48*(depth+1)/2):1}"/>
  <path class="p1-rail-edge" d="${d}" fill="none" stroke="#E9CC82" stroke-opacity=".36" stroke-width=".38" transform="translate(-.55 -.55)"/>
  </g>`;
}
export function beadArtwork(i,{x=0,y=0,r=7.7,prefix='p1m'}={}) {
 return `<g data-p1-bead="${i}" data-material="brass-bead"><circle data-p1-bead-halo="${i}" cx="${x}" cy="${y}" r="${r*2.3}" fill="url(#${prefix}-bead-halo)" opacity=".36"/><ellipse data-p1-bead-shadow="${i}" cx="${x+r*.3}" cy="${y+r*.6}" rx="${r*1.1}" ry="${r*.85}" fill="url(#${prefix}-shadow)" opacity=".48"/><circle class="p1-track-dot" data-p1-node="${i}" cx="${x}" cy="${y}" r="${r}" fill="url(#${prefix}-bead-ink)" stroke="#9E8546" stroke-width=".45"/><circle data-p1-bead-highlight="${i}" cx="${x-r*.29}" cy="${y-r*.31}" r="${r*.23}" fill="#FFF0B9" opacity=".69"/></g>`;
}
export function systemArtwork({unroll=0,atom=0,prefix='p1m'}={}) {
  const masters=[],layers=[],terminalPaths=[];
  for(let i=0;i<3;i++){
    const curve=systemCurve(i,unroll,atom);
    for(let end=0;end<2;end++){
      const pt=end?curve.at(-1)[3]:curve[0][0];
      terminalPaths.push(`<path data-p1-terminal="${i*2+end}" d="M${f(pt.x-2)} ${f(pt.y-3.4)}h4v6.8h-4Z"/>`);
    }
    masters.push(`<g class="p1-system-track" data-p1-system-track="${i}"><path data-p1-track="${i}" class="p1-track-master" fill="none" stroke="none" d="${curvePath(curve)}"/></g>`);
    for(let j=0;j<8;j++){
      const depth=atom*(-Math.cos((j+.5)/8*Math.PI*2));
      layers.push({depth,id:`${i}-${j}`,markup:railSegment(i,j,curvePath(curve.slice(j*4,j*4+4)),{depth,atom,prefix})});
    }
    const fraction=[.16,.48,.79][i]+.075*atom,point=pointAtFraction(curve,fraction,arcTable(curve));
    layers.push({depth:atom*(-Math.cos(point.u*Math.PI*2)),id:`node${i}`,markup:beadArtwork(i,{x:point.x,y:point.y,prefix})});
  }
  layers.push({depth:0,id:'nucleus',markup:`<g class="p1-atom-core" opacity="${atom}"><g transform="translate(-37 -37) scale(.616666667)">${coreArtwork({prefix,ink:true,compact:true})}</g></g>`});
  layers.sort((a,b)=>a.depth-b.depth);
  return `${systemDecoration(prefix)}${masters.join('')}<g data-p1-system-depth>${layers.map(l=>l.markup).join('')}</g><g data-p1-rail-terminals fill="none" stroke="#343825" stroke-width=".8" opacity="${unroll===1&&!atom?1:0}">${terminalPaths.join('')}</g>`;
}

import {systemCurve,curvePath,arcTable,pointAtFraction,curvePoint} from './phase1-geometry.js';
import {getMessage} from './i18n-content.js';
import {clamp,mix,ramp} from './phase1-timeline.js';
import {morphCurves,stringCurve,hybridCurve,serviceGuideCurve,pluckValue,SCENE0609} from './scene0609-geometry.js';

const NS='http://www.w3.org/2000/svg';
const attr=(el,name,value)=>{if(!el)return;const s=String(value);if(el.getAttribute(name)!==s)el.setAttribute(name,s);};
const opacity=(el,value)=>{if(!el)return;const v=clamp(value);attr(el,'opacity',v.toFixed(4));attr(el,'visibility',v>.0001?'visible':'hidden');};
const svgEl=(name,attrs={})=>{const el=document.createElementNS(NS,name);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,String(v));return el;};

function tangentAngle(curve,u){
  const e=.002,a=curvePoint(curve,Math.max(0,u-e)),b=curvePoint(curve,Math.min(1,u+e));
  return Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI;
}

/** Scenes 06-09 continue the exact Scene-05 SVG geometry instead of swapping illustrations. */
export class Scenes0609Visuals{
  constructor(stage,phase1,{reduced=false}={}){
    if(!phase1?.principle||!phase1?.svg)throw new Error('Scenes 06-09 require the Scene 05 system');
    this.stage=stage;this.phase1=phase1;this.reduced=reduced;this.svg=phase1.svg;this.lastP=-1;this.failed=false;this.time=0;
    this.group=phase1.principle.cloneNode(true);this.group.removeAttribute('data-p1-principle');this.group.setAttribute('data-p2','');this.group.setAttribute('opacity','0');
    phase1.principle.after(this.group);
    const q=s=>this.group.querySelector(s),qa=s=>[...this.group.querySelectorAll(s)];
    this.tracks=qa('[data-p1-system-track]').map(el=>({el,master:el.querySelector('.p1-track-master')}));
    this.materialSegments=qa('[data-p1-material-segment]').map(el=>{const [track,index]=el.dataset.p1MaterialSegment.split('-').map(Number);return {el,track,index,paths:[...el.querySelectorAll('path')],body:el.querySelector('.p1-rail-body'),occlusion:el.querySelector('.p1-rail-occlusion')};});
    this.systemDepth=q('[data-p1-system-depth]');this.systemAtmosphere=q('[data-p1-system-atmosphere]');this.calibration=q('[data-p1-system-calibration]');this.framework=q('[data-p1-atom-framework]');
    this.registration=q('[data-p1-registration]');this.terminals=q('[data-p1-rail-terminals]');this.atomCore=q('.p1-atom-core');
    this.beads=qa('[data-p1-bead]').sort((a,b)=>+a.dataset.p1Bead-+b.dataset.p1Bead).map(el=>({el,node:el.querySelector('[data-p1-node]'),halo:el.querySelector('[data-p1-bead-halo]'),shadow:el.querySelector('[data-p1-bead-shadow]'),highlight:el.querySelector('[data-p1-bead-highlight]')}));
    // Scene 05 looked richer because its three tracked beads were seen together with the handoff layer.
    // Recreate that richness intentionally with three smaller companion planets instead of double-rendering scenes.
    this.companions=this.beads.map((source,i)=>{
      const el=source.el.cloneNode(true);el.removeAttribute('data-p1-bead');el.setAttribute('data-p2-companion',String(i));
      const node=el.querySelector('[data-p1-node]'),halo=el.querySelector('[data-p1-bead-halo]'),shadow=el.querySelector('[data-p1-bead-shadow]'),highlight=el.querySelector('[data-p1-bead-highlight]');
      node?.removeAttribute('data-p1-node');halo?.removeAttribute('data-p1-bead-halo');shadow?.removeAttribute('data-p1-bead-shadow');highlight?.removeAttribute('data-p1-bead-highlight');
      this.systemDepth.append(el);return {el,node,halo,shadow,highlight};
    });
    // Remove cloned rail terminals: strings and guides are continuous, not capped UI lines.
    opacity(this.terminals,0);
    this.noteLayer=svgEl('g',{'data-p2-note-layer':''});this.group.append(this.noteLayer);
    this.notes=['workflow','data','report'].map((name,i)=>this.makeNote(name,i));
    this.brandLabel=this.makeBrandLabel();this.group.append(this.brandLabel);
    this.guideLabel=svgEl('text',{class:'p2-guide-label','text-anchor':'middle',x:0,y:188});this.group.append(this.guideLabel);
    // This handoff text is generated as SVG, not an HTML node. Localize it as
    // part of the same uninterrupted scroll system and keep it live on switch.
    const updateCaptions=()=>{
      const locale=document.documentElement.lang;
      this.guideLabel.textContent=getMessage(locale,'scene.bridgeGuide');
      this.brandLabel.querySelector('.p2-brand-sub').textContent=getMessage(locale,'site.signature');
    };
    updateCaptions();
    document.addEventListener('zahlfix:locale-change',updateCaptions);
    this.stats={updates:0,maxMs:0,mode:'scene06-09-continuous-svg'};
    this.render(0,0);document.documentElement.classList.add('p2-ready');
    window.__ZAHLFIX_SCENES0609__={snapshot:()=>this.snapshot()};
  }

  makeNote(name,i){
    const g=svgEl('g',{class:'p2-note','data-p2-note':i});
    const stem=svgEl('line',{class:'p2-note-stem',x1:0,y1:0,x2:0,y2:-20});
    const body=svgEl('g',{'data-p2-note-body':''});
    const use=svgEl('use',{href:`#p1-doc-${name}`,'data-p2-note-use':'',width:64,height:88});use.setAttribute('x','-32');use.setAttribute('y','-44');
    body.append(use);g.append(stem,body,svgEl('circle',{class:'p2-note-pin',cx:0,cy:0,r:2.5}));this.noteLayer.append(g);
    return {g,stem,body,use};
  }

  makeBrandLabel(){
    const g=svgEl('g',{class:'p2-brand-label','data-p2-brand-label':''});
    const main=svgEl('text',{class:'p2-brand-main',x:0,y:88});main.textContent='ZAHLFIX';
    const sub=svgEl('text',{class:'p2-brand-sub',x:0,y:106});sub.textContent='BERATUNG × TECHNOLOGIE × UMSETZUNG';
    g.append(main,sub);return g;
  }

  currentLayout(){return this.phase1.snapshot().layout;}

  render(dt,p){
    if(this.failed)return;
    const active=p>=SCENE0609.handoffStart-.01&&p<=SCENE0609.end+.015;
    if(!active&&this.lastP===p)return;
    const t0=performance.now(),L=this.currentLayout();if(!L)return;
    if(active&&!this.reduced&&Number.isFinite(dt))this.time+=Math.max(0,Math.min(.064,dt));
    const compact=!!L.mobile;
    // Exact ownership at the Scene 05 -> 06 boundary. Crossfade once, then retire the source SVG.
    // This prevents the previous scene from remaining underneath the new mobile composition.
    const handoffIn=ramp(p,.228,.233),sourceOut=1-handoffIn;
    if(p>=SCENE0609.handoffStart)opacity(this.phase1.principle,sourceOut);
    const alpha=handoffIn*(1-ramp(p,SCENE0609.gridLive,SCENE0609.end));
    opacity(this.group,alpha);
    const shortLandscape=L.h<550&&L.w/L.h>1.4;
    const layoutEase=ramp(p,.233,.242);
    const sceneX=L.systemX+(shortLandscape?30*layoutEase:0);
    const sceneScale=L.systemScale*(shortLandscape?mix(1,.92,layoutEase):1);
    attr(this.group,'transform',`translate(${sceneX} ${L.systemY}) scale(${sceneScale})`);
    if(alpha<.0001){this.lastP=p;return;}

    const toStrings=ramp(p,SCENE0609.stringsStart,SCENE0609.stringsLive);
    const toHybrid=ramp(p,SCENE0609.hybridStart,SCENE0609.hybridLive);
    const brand=ramp(p,SCENE0609.brandStart,SCENE0609.brandLive);
    const toGrid=ramp(p,SCENE0609.gridStart,SCENE0609.gridLive);
    const expand=brand*(1-toGrid);
    const amp=compact?30:44;
    const plucks=this.reduced?[0,0,0]:SCENE0609.pluckStarts.map(s=>pluckValue(p,s,SCENE0609.pluckDuration,amp));
    const curves=[];
    for(let i=0;i<3;i++){
      const atom=systemCurve(i,1,1),string=stringCurve(i,plucks[i],{compact}),hybrid=hybridCurve(i,{compact,expand}),guide=serviceGuideCurve(i,{compact});
      let curve;
      if(p<SCENE0609.hybridStart)curve=morphCurves(atom,string,toStrings);
      else if(p<SCENE0609.hybridLive)curve=morphCurves(stringCurve(i,0,{compact}),hybridCurve(i,{compact,expand:0}),toHybrid);
      else if(p<SCENE0609.gridStart)curve=hybrid;
      else curve=morphCurves(hybridCurve(i,{compact,expand:1}),guide,toGrid);
      curves.push(curve);attr(this.tracks[i].master,'d',curvePath(curve));
    }

    // Rich material segments continue to trace the exact master curves.
    for(const part of this.materialSegments){
      const d=curvePath(curves[part.track].slice(part.index*4,part.index*4+4));part.paths.forEach(el=>attr(el,'d',d));
      const scene7Depth=(toHybrid>0? -Math.cos((part.index+.5)/8*Math.PI*2):0)*toHybrid*(1-toGrid);
      attr(part.el,'data-depth',scene7Depth.toFixed(4));
      attr(part.occlusion,'opacity',(toHybrid*.82*(1-toGrid)).toFixed(4));
      attr(part.body,'stroke-opacity',mix(1,.68,Math.max(0,-scene7Depth)).toFixed(4));
    }

    // Notes are pinned to the deformed strings; they do not bounce independently of the path.
    const noteAlpha=toStrings*(1-ramp(p,SCENE0609.hybridStart,SCENE0609.hybridLive));
    opacity(this.noteLayer,noteAlpha);
    this.notes.forEach((note,i)=>{
      const curve=curves[i],fraction=[.28,.5,.72][i],point=pointAtFraction(curve,fraction,arcTable(curve)),angle=tangentAngle(curve,point.u);
      const desired=compact?26:34,noteScale=desired/(64*sceneScale),lift=(compact?18:25)/sceneScale;
      attr(note.g,'transform',`translate(${point.x.toFixed(3)} ${point.y.toFixed(3)}) rotate(${(angle*.16).toFixed(3)})`);
      attr(note.body,'transform',`translate(0 ${(-lift).toFixed(3)}) scale(${noteScale.toFixed(5)})`);
      attr(note.stem,'y2',(-Math.max(2,lift-44*noteScale)).toFixed(3));
      opacity(note.g,1);
    });

    // Orbital beads exist only in atom/hybrid/brand states. Scene 06 uses document pins instead,
    // so no planet from the previous scene bleeds underneath the string composition.
    const atomHandoff=1-ramp(p,SCENE0609.stringsStart,SCENE0609.stringsLive);
    const orbitalAlpha=Math.max(atomHandoff,toHybrid)*(1-ramp(p,SCENE0609.gridStart+.006,SCENE0609.gridLive));
    const time=this.time,primaryFractions=[.235,.555,.865],companionFractions=[.62,.085,.39];
    const placeBead=(bead,track,fraction,r,alphaValue)=>{
      const point=pointAtFraction(curves[track],fraction,arcTable(curves[track]));
      [bead.node,bead.halo].forEach(el=>{attr(el,'cx',point.x.toFixed(3));attr(el,'cy',point.y.toFixed(3));});
      attr(bead.node,'r',r.toFixed(3));attr(bead.halo,'r',(r*2.25).toFixed(3));
      attr(bead.shadow,'cx',(point.x+r*.25).toFixed(3));attr(bead.shadow,'cy',(point.y+r*.5).toFixed(3));attr(bead.shadow,'rx',(r*1.05).toFixed(3));attr(bead.shadow,'ry',(r*.86).toFixed(3));
      attr(bead.highlight,'cx',(point.x-r*.29).toFixed(3));attr(bead.highlight,'cy',(point.y-r*.31).toFixed(3));attr(bead.highlight,'r',(r*.22).toFixed(3));
      opacity(bead.el,alphaValue);return point;
    };
    this.beads.forEach((bead,i)=>{
      let fraction=primaryFractions[i];
      if(p>=SCENE0609.hybridLive&&p<SCENE0609.gridStart&&!this.reduced)fraction=(fraction+time*[.009,.0065,.0045][i])%1;
      const r=Math.max(compact?6.3:7.1,3.5/sceneScale);placeBead(bead,i,fraction,r,orbitalAlpha);
    });
    const companionAlpha=orbitalAlpha*mix(.72,.86,Math.max(toHybrid,brand));
    this.companions.forEach((bead,i)=>{
      let fraction=companionFractions[i];
      if(p>=SCENE0609.hybridLive&&p<SCENE0609.gridStart&&!this.reduced)fraction=(fraction+time*[.006,.004,.007][i])%1;
      const r=Math.max(compact?4.2:4.8,2.8/sceneScale);placeBead(bead,i,fraction,r,companionAlpha);
    });

    // The nucleus deliberately matches the approved Scene-05 atom, remains present in Scene 07,
    // and then scales into the clear ZahlFix centre in Scene 08.
    const atomCore=atomHandoff;
    const questionCore=.80*ramp(p,SCENE0609.hybridStart,SCENE0609.hybridLive)*(1-ramp(p,.304,.311));
    const coreAlpha=Math.max(atomCore,questionCore,brand)*(1-ramp(p,SCENE0609.gridStart+.006,SCENE0609.gridLive));
    opacity(this.atomCore,coreAlpha);
    attr(this.atomCore,'transform',`scale(${mix(1,compact?1.30:1.56,brand).toFixed(4)})`);
    opacity(this.brandLabel,brand*(1-ramp(p,SCENE0609.brandHold,SCENE0609.gridLive)));
    opacity(this.guideLabel,toGrid*(1-ramp(p,SCENE0609.gridLive,SCENE0609.end)));
    // Atmosphere and technical framework are owned only by the atom/hybrid states, never Scene 06 strings.
    const instrumentAlpha=Math.max(atomHandoff,toHybrid)*(1-toGrid);
    opacity(this.systemAtmosphere,instrumentAlpha);
    opacity(this.calibration,instrumentAlpha*.62);opacity(this.framework,instrumentAlpha*.20);opacity(this.registration,instrumentAlpha*.28);

    // Depth order for the hybrid: segment layers, six intentional planets, then the nucleus plane.
    if(this.systemDepth){
      const layers=[...this.materialSegments.map(part=>({el:part.el,depth:+(part.el.dataset.depth||0)})),...this.beads.map((b,i)=>({el:b.el,depth:Math.sin(i*2.1+time*.05)*Math.max(atomHandoff,toHybrid)*(1-toGrid)})),...this.companions.map((b,i)=>({el:b.el,depth:Math.sin(i*1.7+1.2+time*.04)*Math.max(atomHandoff,toHybrid)*(1-toGrid)})),{el:this.atomCore,depth:0}];
      layers.sort((a,b)=>a.depth-b.depth);for(const layer of layers)this.systemDepth.append(layer.el);
    }
    attr(this.group,'data-p2-form',toGrid>.35?'guides':brand>.75?'zahlfix-system':toHybrid>.75?'hybrid':toStrings>.75?'strings':'atom-handoff');
    attr(this.group,'data-p2-owner',p<.233?'scene05-handoff':p<SCENE0609.hybridStart?'scene06':p<SCENE0609.brandStart?'scene07':p<SCENE0609.gridStart?'scene08':'scene09-transition');
    this.lastP=p;this.stats.updates++;this.stats.maxMs=Math.max(this.stats.maxMs,performance.now()-t0);
  }

  measure(){this.lastP=-1;}
  snapshot(){return {p:this.lastP,form:this.group.getAttribute('data-p2-form'),layout:this.currentLayout(),failed:this.failed,stats:{...this.stats},notes:this.notes.map(n=>({opacity:n.g.getAttribute('opacity'),transform:n.g.getAttribute('transform')}))};}
  fallback(error){if(this.failed)return;this.failed=true;this.group.remove();document.documentElement.classList.remove('p2-ready');console.warn('[ZahlFix] Scenes 06-09 cinematic bridge disabled; legacy readable composition retained.',error);}
}

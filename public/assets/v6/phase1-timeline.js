/** Named opening choreography. No later scene boundary is moved. */
export const PHASE1 = Object.freeze({
  ambientEnd: .042,
  captureStart: .058, captureSlot: .0043, captureDuration: .0055,
  assemblyStart: .101, assemblySlot: .00125, assemblyDuration: .009,
  wipeStart: .136, wipeReadable: .144, wipeEnd: .149,
  ringsIn: .149, ringsLive: .156, unrollStart: .182, unrollEnd: .204,
  atomStart: .212, atomEnd: .222, atomHold: .228, end: .233,
  narrativeSeconds: 260,
});
export const CAPTURE_ORDER = Object.freeze([6,3,0,7,4,1,8,5,2]);
export const clamp = (v,a=0,b=1) => Math.max(a,Math.min(b,v));
export const mix = (a,b,t) => a+(b-a)*t;
// Quintic ease has zero first AND second derivatives at both endpoints.
export const smooth = t => {t=clamp(t); return t*t*t*(t*(t*6-15)+10);};
export const ramp = (p,a,b) => smooth((p-a)/(b-a));
export function phase1State(p) {
  return {
    hero: 1-ramp(p,PHASE1.wipeStart,PHASE1.wipeReadable),
    capture: ramp(p,.054,.058)*(1-ramp(p,.099,.105)),
    wipe: p>=PHASE1.wipeStart && p<PHASE1.wipeEnd,
    gold: p>=PHASE1.wipeEnd,
    system: ramp(p,PHASE1.ringsIn,PHASE1.ringsLive)*(1-ramp(p,PHASE1.atomHold,PHASE1.end)),
    unroll: ramp(p,PHASE1.unrollStart,PHASE1.unrollEnd),
    atom: ramp(p,PHASE1.atomStart,PHASE1.atomEnd),
  };
}
/** Pausable ambient clock with a stable, reversible handoff to scroll time. */
export class Phase1Clock {
  constructor({seed=0}={}) {this.time=seed;this.departure=seed;this.locked=false;this.lastP=0;}
  tick(dt,p) {
    if (!Number.isFinite(dt)||!Number.isFinite(p)) return this.time;
    if(p>PHASE1.ambientEnd) {
      if(!this.locked){this.departure=this.time;this.locked=true;}
      this.time=this.departure+(p-PHASE1.ambientEnd)*PHASE1.narrativeSeconds;
    } else {
      if(this.locked){this.time=this.departure;this.locked=false;}
      else this.time+=Math.max(0,Math.min(.064,dt));
      this.departure=this.time;
    }
    this.lastP=p;
    return this.time;
  }
  at(p) {return this.departure+Math.max(0,p-PHASE1.ambientEnd)*PHASE1.narrativeSeconds;}
}

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const mix = (a, b, t) => a + (b - a) * t;
const smooth = t => { t = clamp(t); return t * t * (3 - 2 * t); };
const ramp = (p, a, b) => smooth((p - a) / (b - a));
const win = (p, a, b, c, d) => p < a || p > d ? 0 : p < b ? smooth((p - a) / (b - a)) : p <= c ? 1 : 1 - smooth((p - c) / (d - c));
const seed = n => { const x = Math.sin(n * 999.91) * 43758.5453; return x - Math.floor(x); };
function shader(gl, type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
    throw new Error(gl.getShaderInfoLog(s)); return s; }
function program(gl, vs, fs) { const p = gl.createProgram(); gl.attachShader(p, shader(gl, gl.VERTEX_SHADER, vs)); gl.attachShader(p, shader(gl, gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS))
    throw new Error(gl.getProgramInfoLog(p)); return p; }
const DOC_VS = `#version 300 es
precision highp float;
layout(location=0) in vec2 aCorner;layout(location=1) in vec3 aPos;layout(location=2) in vec2 aScale;layout(location=3) in float aRot;layout(location=4) in float aYellow;layout(location=5) in float aAlpha;
uniform float uAspect;uniform vec2 uPointer;out vec2 vUv;out float vYellow;out float vAlpha;
void main(){float c=cos(aRot),s=sin(aRot);mat2 R=mat2(c,-s,s,c);float persp=1.0/(1.0+max(-.65,aPos.z)*.34);vec2 local=R*(aCorner*aScale*persp);local.x/=uAspect;vec2 pos=aPos.xy;pos.x+=uPointer.x*(.012+.018*aPos.z);pos.y+=uPointer.y*(.009+.012*aPos.z);gl_Position=vec4(pos+local,0.,1.);vUv=aCorner*.5+.5;vYellow=aYellow;vAlpha=aAlpha;}`;
const DOC_FS = `#version 300 es
precision highp float;in vec2 vUv;in float vYellow;in float vAlpha;out vec4 outColor;
float roundedBox(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return min(max(q.x,q.y),0.0)+length(max(q,0.0))-r;}
void main(){vec2 p=vUv-.5;float d=roundedBox(p,vec2(.47,.48),.045);float aa=fwidth(d)*1.5;float body=1.-smoothstep(0.,aa,d);if(body<.001)discard;vec3 paper=mix(vec3(.91,.90,.85),vec3(.80,.62,.24),vYellow);paper*=.96+.08*(1.-vUv.y)+.035*sin(vUv.x*5.);float border=(1.-smoothstep(-.012,-.002,d))*(1.-smoothstep(-.03,-.018,d));vec3 col=mix(paper,mix(vec3(.25),vec3(.10),vYellow),border*.5);float h1=smoothstep(.008,.003,abs(vUv.y-.43))*smoothstep(.18,.22,vUv.x)*(1.-smoothstep(.78,.82,vUv.x));float h2=smoothstep(.008,.003,abs(vUv.y-.62))*smoothstep(.18,.22,vUv.x)*(1.-smoothstep(.78,.82,vUv.x));float v1=smoothstep(.008,.003,abs(vUv.x-.39))*smoothstep(.28,.32,vUv.y)*(1.-smoothstep(.72,.76,vUv.y));float v2=smoothstep(.008,.003,abs(vUv.x-.64))*smoothstep(.28,.32,vUv.y)*(1.-smoothstep(.72,.76,vUv.y));float node1=1.-smoothstep(.035,.055,length(vUv-vec2(.28,.32)));float node2=1.-smoothstep(.035,.055,length(vUv-vec2(.72,.72)));col=mix(col,vec3(.22),max(max(h1,h2),max(v1,v2))*.48);col=mix(col,mix(vec3(.18),vec3(.1),vYellow),max(node1,node2)*.85);outColor=vec4(col,body*vAlpha);}`;
const POINT_VS = `#version 300 es
precision highp float;layout(location=0) in vec3 aPos;layout(location=1) in float aSize;layout(location=2) in float aAlpha;uniform vec2 uPointer;uniform float uDpr;out float vAlpha;
void main(){vec3 p=aPos;p.xy+=vec2(uPointer.x*.01*(1.+p.z),uPointer.y*.007*(1.+p.z));gl_Position=vec4(p.xy,0.,1.);gl_PointSize=aSize*uDpr/(1.+max(-.7,p.z)*.25);vAlpha=aAlpha;}`;
const POINT_FS = `#version 300 es
precision highp float;in float vAlpha;out vec4 outColor;void main(){vec2 p=gl_PointCoord-.5;float r=length(p);float core=1.-smoothstep(.05,.16,r);float glow=1.-smoothstep(.02,.5,r);float a=(core*.8+glow*.28)*vAlpha;outColor=vec4(vec3(.80,.62,.24),a);}`;
const RING_VS = `#version 300 es
precision highp float;layout(location=0) in vec2 aP;uniform vec2 uCenter;uniform vec2 uScale;uniform float uRot;uniform vec2 uPointer;void main(){float c=cos(uRot),s=sin(uRot);vec2 p=mat2(c,-s,s,c)*(aP*uScale);p+=uCenter+uPointer*.008;gl_Position=vec4(p,0.,1.);}`;
const RING_FS = `#version 300 es
precision highp float;uniform float uAlpha;out vec4 outColor;void main(){outColor=vec4(.80,.62,.24,uAlpha);}`;
export class WebGLWorld {
    constructor(canvas, { reduced = false } = {}) { this.canvas = canvas; this.reduced = reduced; this.uniforms = new Map(); this.contextLost = false; this.mobile = window.__ZAHLFIX_LAYOUT__?.isCompact ?? (innerWidth < 800); this.lowPower = (navigator.deviceMemory && navigator.deviceMemory <= 4) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4); this.gl = canvas.getContext('webgl2', { alpha: true, antialias: !(this.mobile || this.lowPower), premultipliedAlpha: true, powerPreference: 'high-performance' }); if (!this.gl) {
        document.documentElement.classList.add('no-webgl');
        return;
    } document.documentElement.classList.add('webgl-active'); document.documentElement.dataset.visualQuality = this.lowPower ? 'balanced' : 'high'; const gl = this.gl; gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.disable(gl.DEPTH_TEST); this.docP = program(gl, DOC_VS, DOC_FS); this.pointP = program(gl, POINT_VS, POINT_FS); this.ringP = program(gl, RING_VS, RING_FS); this.pointer = { x: 0, y: 0, tx: 0, ty: 0 }; this.frameEma = 16.7; this.lastFrame = 0; this.dynamicScale = 1; this.perfSamples = 0; this.onPointer = e => { if (this.reduced)
        return; this.pointer.tx = (e.clientX / innerWidth - .5) * 2; this.pointer.ty = -(e.clientY / innerHeight - .5) * 2; }; addEventListener('pointermove', this.onPointer, { passive: true }); this.docs = Array.from({ length: 9 }, (_, i) => ({ ax: (seed(i + 1) - .5) * .7, ay: (seed(i + 22) - .5) * .62, z: -.45 + seed(i + 41) * 1.35, rot: (seed(i + 63) - .5) * 1.2, speed: .18 + seed(i + 82) * .25, phase: seed(i + 91) * 6.283, yellow: i === 3 })); this.particles = Array.from({ length: this.mobile ? 42 : (this.lowPower ? 78 : 120) }, (_, i) => ({ x: seed(i + 200) * 2 - 1, y: seed(i + 450) * 2 - 1, z: -.35 + seed(i + 650) * 1.2, s: 1 + seed(i + 700) * 2.2, a: .16 + seed(i + 900) * .38, phase: seed(i + 1200) * 6.28 })); this.docData = new Float32Array((this.docs.length + 1) * 8); this.pointData = new Float32Array((this.particles.length + 2) * 5); this.initDoc(); this.initPoints(); this.initRing(); this.resize(); this.onResize = () => this.resize(); addEventListener('zahlfix:layout', this.onResize); this.onLost = e => { e.preventDefault(); this.contextLost = true; document.documentElement.classList.add('no-webgl'); document.documentElement.classList.remove('webgl-active'); }; this.onRestored = () => this.restore(); canvas.addEventListener('webglcontextlost', this.onLost); canvas.addEventListener('webglcontextrestored', this.onRestored); }
    initDoc() { const gl = this.gl; this.docVao = gl.createVertexArray(); gl.bindVertexArray(this.docVao); const corners = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]); let b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, corners, gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); this.docInst = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.docInst); gl.bufferData(gl.ARRAY_BUFFER, this.docData.byteLength, gl.DYNAMIC_DRAW); const stride = 8 * 4; [[1, 3, 0], [2, 2, 3], [3, 1, 5], [4, 1, 6], [5, 1, 7]].forEach(([loc, size, off]) => { gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride, off * 4); gl.vertexAttribDivisor(loc, 1); }); gl.bindVertexArray(null); }
    initPoints() { const gl = this.gl; this.pointVao = gl.createVertexArray(); gl.bindVertexArray(this.pointVao); this.pointBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.pointBuf); gl.bufferData(gl.ARRAY_BUFFER, this.pointData.byteLength, gl.DYNAMIC_DRAW); const stride = 5 * 4; [[0, 3, 0], [1, 1, 3], [2, 1, 4]].forEach(([loc, size, off]) => { gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride, off * 4); }); gl.bindVertexArray(null); }
    initRing() { const gl = this.gl; this.ringVao = gl.createVertexArray(); gl.bindVertexArray(this.ringVao); const n = 96, a = new Float32Array(n * 2); for (let i = 0; i < n; i++) {
        const t = i / (n - 1) * 6.283;
        a[i * 2] = Math.cos(t);
        a[i * 2 + 1] = Math.sin(t);
    } this.ringCount = n; const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, a, gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); gl.bindVertexArray(null); }
    resize() { if (!this.gl)
        return; this.mobile = window.__ZAHLFIX_LAYOUT__?.isCompact ?? (innerWidth < 800); this.dpr = Math.min(devicePixelRatio || 1, this.mobile ? 1.1 : (this.lowPower ? 1.25 : 1.55)); this.w = this.canvas.parentElement.clientWidth || innerWidth; this.h = this.canvas.parentElement.clientHeight || innerHeight; this.canvas.width = Math.round(this.w * this.dpr); this.canvas.height = Math.round(this.h * this.dpr); this.gl.viewport(0, 0, this.canvas.width, this.canvas.height); }
    clip(x, y) { return { x: x / this.w * 2 - 1, y: 1 - y / this.h * 2 }; }
    writeDoc(i, x, y, z, sx, sy, rot, yellow, alpha) { const o = i * 8; this.docData[o] = x; this.docData[o + 1] = y; this.docData[o + 2] = z; this.docData[o + 3] = sx; this.docData[o + 4] = sy; this.docData[o + 5] = rot; this.docData[o + 6] = yellow ? 1 : 0; this.docData[o + 7] = alpha; }
    render(time, p, anchors, velocity = 0) { if (!this.gl || this.contextLost || document.hidden)
        return; const gl = this.gl, t = this.reduced ? 0 : time * .001; const delta = Math.min(64, Math.max(1, time - (this.lastFrame || time - 16.7))); const pointerEase = this.reduced ? 1 : 1 - Math.exp(-3.4 * delta / 1000); if (this.lastFrame) {
        const dt = Math.min(120, time - this.lastFrame);
        this.frameEma = this.frameEma * .95 + dt * .05;
        this.perfSamples++;
        if (this.perfSamples % 90 === 0) {
            this.dynamicScale = this.frameEma > 27 ? .52 : this.frameEma > 22 ? .68 : this.frameEma > 18.5 ? .84 : 1;
            document.documentElement.dataset.webglQuality = this.dynamicScale < .6 ? 'low' : this.dynamicScale < .9 ? 'balanced' : 'full';
        }
    } this.lastFrame = time; this.pointer.x += (this.pointer.tx - this.pointer.x) * pointerEase; this.pointer.y += (this.pointer.ty - this.pointer.y) * pointerEase; gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); const hero = 0, order = 0, collapse = 0, orbFade = 0; /* Scenes 01-05 are rendered by the crisp SVG/DOM phase-one system. */ const featureVisible = p > .425 && p < .575; const signalVisible = p > .595 && p < .985; if (hero < .002 && !featureVisible && !signalVisible)
        return; const cx = mix(.52, .48, ramp(p, .06, .13)), cy = mix(.025, -.015, ramp(p, .06, .13)); let count = 0; if (hero > .002)
        for (let i = 0; i < this.docs.length; i++) {
            const d = this.docs[i], ang = t * d.speed + d.phase;
            const chaosX = cx + Math.cos(ang) * (.23 + d.z * .025) + d.ax * .18, chaosY = cy + Math.sin(ang) * (.20 + d.z * .018) + d.ay * .16;
            const gx = (i % 3 - 1) * .115, gy = -(Math.floor(i / 3) - 1) * .18 - .04;
            let x = mix(chaosX, gx, order), y = mix(chaosY, gy, order);
            x = mix(x, 0, collapse);
            y = mix(y, -.05, collapse);
            const persp = 1 / (1 + Math.max(-.4, d.z) * .2), sc = (.045 + d.z * .006) * mix(1, .55, collapse) * persp;
            this.writeDoc(count++, x, y, d.z, sc, sc * 1.38, mix(d.rot + Math.sin(ang) * .18, 0, order), d.yellow, hero * (1 - collapse * .94));
        } let featureAlpha = 0, fx = 0, fy = 0, fs = .05, frot = 0; const source = anchors?.source, rail1 = anchors?.railStart, rail4 = anchors?.railEnd; if (source && rail1 && rail4) {
        if (p > .425 && p < .575) {
            featureAlpha = win(p, .425, .438, .552, .575);
            let sp = this.clip(source.x, source.y), ep = this.clip(rail1.x, rail1.y), hand = ramp(p, .438, .487);
            fx = mix(sp.x, ep.x, hand);
            fy = mix(sp.y, ep.y, hand) + Math.sin(hand * 3.14159) * .075;
            fs = mix(.037, .047, hand);
            frot = mix(.12, 0, hand);
            if (p >= .49) {
                const flow = ramp(p, .49, .55), a = this.clip(rail1.x, rail1.y), b = this.clip(rail4.x, rail4.y);
                fx = mix(a.x, b.x, flow);
                fy = mix(a.y, b.y, flow);
                fs = .046;
                frot = Math.sin(flow * 3.14) * .04;
            }
            this.writeDoc(count++, fx, fy, -.15, fs, fs * 1.38, frot, true, featureAlpha);
        }
        else
            this.writeDoc(count++, 0, 0, 0, 0, 0, 0, true, 0);
    } gl.useProgram(this.docP); gl.uniform1f(this.uniform(this.docP, 'uAspect'), this.w / this.h); gl.uniform2f(this.uniform(this.docP, 'uPointer'), this.pointer.x, this.pointer.y); gl.bindVertexArray(this.docVao); gl.bindBuffer(gl.ARRAY_BUFFER, this.docInst); gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.docData); gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, count); gl.bindVertexArray(null); let pc = 0; const particleLimit = hero > .002 ? Math.max(12, Math.floor(this.particles.length * this.dynamicScale)) : 0; for (let i = 0; i < particleLimit; i++) {
        const a = this.particles[i], x = ((a.x + t * .012 * (.5 + a.s)) + 1) % 2 - 1, y = a.y + Math.sin(t * .18 + a.phase) * .01, o = pc * 5;
        this.pointData[o] = x;
        this.pointData[o + 1] = y;
        this.pointData[o + 2] = a.z;
        this.pointData[o + 3] = a.s;
        this.pointData[o + 4] = a.a * hero;
        pc++;
    } let o = pc * 5; if (orbFade > .002) {
        this.pointData[o] = cx;
        this.pointData[o + 1] = cy;
        this.pointData[o + 2] = -.2;
        this.pointData[o + 3] = 74 * (1 + Math.sin(t * 2.2) * .06);
        this.pointData[o + 4] = orbFade;
        pc++;
    } let sa = 0, sx = 0, sy = 0; if (anchors?.railEnd && anchors?.chart && anchors?.network) {
        sa = win(p, .595, .62, .965, .988);
        let A = anchors.railEnd, B = anchors.chart;
        if (p >= .942) {
            A = anchors.network;
            B = { x: this.w * .72, y: this.h * .52 };
            const k = ramp(p, .942, .978);
            sx = mix(A.x, B.x, k);
            sy = mix(A.y, B.y, k);
        }
        else if (p >= .805) {
            A = anchors.chart;
            B = anchors.network;
            const k = ramp(p, .805, .855);
            sx = mix(A.x, B.x, k);
            sy = mix(A.y, B.y, k);
        }
        else {
            const k = ramp(p, .625, .705);
            sx = mix(A.x, B.x, k);
            sy = mix(A.y, B.y, k);
        }
        const c = this.clip(sx, sy);
        o = pc * 5;
        this.pointData[o] = c.x;
        this.pointData[o + 1] = c.y;
        this.pointData[o + 2] = -.25;
        this.pointData[o + 3] = 42 + Math.min(24, Math.abs(velocity) * 2);
        this.pointData[o + 4] = sa;
        pc++;
    } gl.useProgram(this.pointP); gl.uniform2f(this.uniform(this.pointP, 'uPointer'), this.pointer.x, this.pointer.y); gl.uniform1f(this.uniform(this.pointP, 'uDpr'), this.dpr); gl.bindVertexArray(this.pointVao); gl.bindBuffer(gl.ARRAY_BUFFER, this.pointBuf); gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.pointData); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.drawArrays(gl.POINTS, 0, pc); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.bindVertexArray(null); if (orbFade > .01) {
        gl.useProgram(this.ringP);
        gl.uniform2f(this.uniform(this.ringP, 'uCenter'), cx, cy);
        gl.uniform2f(this.uniform(this.ringP, 'uPointer'), this.pointer.x, this.pointer.y);
        gl.bindVertexArray(this.ringVao);
        for (let i = 0; i < (this.mobile || this.lowPower ? 2 : 3); i++) {
            gl.uniform2f(this.uniform(this.ringP, 'uScale'), .11 + i * .07, .085 + i * .048);
            gl.uniform1f(this.uniform(this.ringP, 'uRot'), t * .035 * (i % 2 ? 1 : -1) + i * .55);
            gl.uniform1f(this.uniform(this.ringP, 'uAlpha'), (.18 - i * .025) * orbFade);
            gl.drawArrays(gl.LINE_STRIP, 0, this.ringCount);
        }
        gl.bindVertexArray(null);
    } }
    // Uniform lookup belongs to initialization/cache, not the steady-state draw path.
    uniform(program, name) { let map = this.uniforms.get(program); if (!map) {
        map = new Map();
        this.uniforms.set(program, map);
    } if (!map.has(name))
        map.set(name, this.gl.getUniformLocation(program, name)); return map.get(name); }
    restore() {
        try {
            const gl = this.gl;
            this.uniforms.clear();
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.disable(gl.DEPTH_TEST);
            this.docP = program(gl, DOC_VS, DOC_FS);
            this.pointP = program(gl, POINT_VS, POINT_FS);
            this.ringP = program(gl, RING_VS, RING_FS);
            this.initDoc();
            this.initPoints();
            this.initRing();
            this.resize();
            this.contextLost = false;
            this.lastFrame = 0;
            document.documentElement.classList.remove('no-webgl');
            document.documentElement.classList.add('webgl-active');
        }
        catch (error) {
            this.contextLost = true;
            document.documentElement.classList.add('no-webgl');
            console.warn('[ZahlFix] GPU recovery failed; semantic interface retained.', error);
        }
    }
    dispose() {
        removeEventListener('pointermove', this.onPointer);
        removeEventListener('zahlfix:layout', this.onResize);
        this.canvas.removeEventListener('webglcontextlost', this.onLost);
        this.canvas.removeEventListener('webglcontextrestored', this.onRestored);
        if (!this.gl || this.contextLost)
            return;
        const gl = this.gl;
        for (const key of ['docP', 'pointP', 'ringP'])
            if (this[key])
                gl.deleteProgram(this[key]);
        for (const key of ['docVao', 'pointVao', 'ringVao'])
            if (this[key])
                gl.deleteVertexArray(this[key]);
        for (const key of ['docInst', 'pointBuf'])
            if (this[key])
                gl.deleteBuffer(this[key]);
    }
}

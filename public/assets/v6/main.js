import { MobileLayout } from './mobile-layout.js';
import { STORY_SCENES, SCENES_BY_ID, PLATES, sceneAt, nextScene, serviceTarget, beatOpacity } from './scene-registry.js';
import { WebGLWorld } from './webgl-world.js';
import { Phase1Visuals } from './phase1-visuals.js';
import { Scenes0609Visuals } from './scene0609-visuals.js';
import { PHASE1 } from './phase1-timeline.js';
import { getMessage } from './i18n-content.js';
(() => {
    'use strict';
    // DOM topology is fixed after boot. Cache selectors rather than query every frame.
    const singles = new Map(), groups = new Map();
    const q = s => { if (!singles.has(s))
        singles.set(s, document.querySelector(s)); return singles.get(s); };
    const qa = s => { if (!groups.has(s))
        groups.set(s, Array.from(document.querySelectorAll(s))); return groups.get(s); };
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.documentElement.classList.toggle('reduced-motion', reduced);
    const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
    const mix = (a, b, t) => a + (b - a) * t;
    const smooth = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
    const ramp = (p, a, b) => smooth((p - a) / (b - a));
    const win = (p, a, b, c, d) => { if (p < a || p > d)
        return 0; if (p < b)
        return smooth((p - a) / (b - a)); if (p <= c)
        return 1; return 1 - smooth((p - c) / (d - c)); };
    const map = (p, a, b, x, y) => mix(x, y, ramp(p, a, b));
    const setOpacity = (el, v) => { if (!el)
        return; v = clamp(v); css(el, { opacity: String(v), visibility: v > .002 ? 'visible' : 'hidden' }); };
    const css = (el, obj) => { if (!el)
        return; for (const [k, v] of Object.entries(obj))
        if (el.style[k] !== v)
            el.style[k] = v; };
    // VISUAL RECOMPOSITION R1 / PHASES 1 + 2 + 3
    // Scenes 01–11 are re-authored as enter → hold → transform → handoff.
    // Later scene timings remain compatible with the existing content migration.
    const TIMELINES = { desktop: PLATES, mobile: PLATES };
    const CHAPTERS = { desktop: { pts: STORY_SCENES.map(s => s.enter), names: STORY_SCENES.map(s => s.title) } };
    CHAPTERS.mobile = CHAPTERS.desktop;
    const responsive = new MobileLayout();
    window.__ZAHLFIX_LAYOUT__ = responsive;
    const isMobileViewport = () => responsive.isCompact;
    let needsRender = true;
    let target = 0, progress = 0, velocity = 0, velocityTarget = 0, lastY = scrollY, lastNow = performance.now();
    const perfStats = { frameEmaMs: 16.7, frames: 0, longTasks: 0, chapters: {} };
    let perfLast = 0;
    if ('PerformanceObserver' in window) {
        try {
            const po = new PerformanceObserver(list => { perfStats.longTasks += list.getEntries().length; });
            po.observe({ type: 'longtask', buffered: true });
        }
        catch { }
    }
    window.__ZAHLFIX_PERF__ = perfStats;
    function profileFrame(now, p) { if (perfLast) {
        const dt = Math.min(120, now - perfLast);
        perfStats.frameEmaMs = perfStats.frameEmaMs * .94 + dt * .06;
        perfStats.frames++;
        const chapterSet = isMobileViewport() ? CHAPTERS.mobile : CHAPTERS.desktop;
        let idx = 0;
        for (let i = 0; i < chapterSet.pts.length; i++)
            if (p >= chapterSet.pts[i])
                idx = i;
        const name = chapterSet.names[idx];
        const s = perfStats.chapters[name] || (perfStats.chapters[name] = { frames: 0, totalMs: 0, maxMs: 0 });
        s.frames++;
        s.totalMs += dt;
        s.maxMs = Math.max(s.maxMs, dt);
        document.documentElement.dataset.frameBudget = perfStats.frameEmaMs > 24 ? 'reduced' : perfStats.frameEmaMs > 19 ? 'balanced' : 'full';
    } perfLast = now; }
    const maxScroll = () => responsive.contactStart;
    function updateTarget() { target = responsive.progressAt(); const now = performance.now(); velocityTarget = (scrollY - lastY) / Math.max(16, now - lastNow); lastY = scrollY; lastNow = now; }
    addEventListener('scroll', updateTarget, { passive: true });
    addEventListener('zahlfix:layout', () => { resizeCanvas(); phase1?.measure?.(); scenes0609?.measure?.(); measureAnchors(); updateTarget(); needsRender = true; });
    updateTarget();
    // Phase 4/5 use the persistent WebGL2 visual system; Phase 5 adds a masked photography layer beneath it.
    // DOM remains the semantic/readable layer and also provides the no-WebGL fallback.
    let world;
    try {
        world = new WebGLWorld(q('#world'), { reduced });
    }
    catch (error) {
        console.error('[ZahlFix Phase 4] WebGL initialization failed', error);
        document.documentElement.classList.add('no-webgl');
        world = { resize() { }, render() { } };
    }
    function resizeCanvas() { world?.resize?.(); }
    resizeCanvas();
    const fields = { yellow: q('.field--yellow'), paper: q('.field--paper'), dark: q('.field--dark'), paper2: q('.field--paper2'), dark2: q('.field--dark2'), contact: q('.field--contact') };
    let phase1, scenes0609;
    try { phase1 = new Phase1Visuals(q('#main-stage'), { reduced }); }
    catch (error) {
        q('[data-phase1]')?.classList.add('is-fallback');
        console.warn('[ZahlFix] Static R2 opening retained after initialization failure.', error);
    }
    if (phase1) {
        try { scenes0609 = new Scenes0609Visuals(q('#main-stage'), phase1, { reduced }); }
        catch (error) { console.warn('[ZahlFix] Scenes 06-09 bridge unavailable; legacy composition retained.', error); }
    }
    const scenes = { hero: q('.scene--hero'), principle: q('.scene--principle'), services: q('.scene--services'), workflow: q('.scene--workflow'), reporting: q('.scene--reporting'), collaboration: q('.scene--collaboration'), contact: q('.scene--contact') };
    const chapterNo = q('#chapterNo'), progressFill = q('#progressFill'), debugProgress = q('#debugProgress'), debugScene = q('#debugScene');
    const extract = q('.extract-doc'), handoff = q('.handoff-doc'), traveler = q('.traveler'), railLive = q('.rail-live'), chartNode = q('.chart-node'), signal = q('.signal-dot');
    const implementationWorld = q('.implementation-world'), implementationPortal = q('.implementation-portal'), implementationMedia = q('.implementation-media'), softwareArchitecture = q('.software-architecture'), aiSystem = q('.ai-system'), supportSystem = q('.support-system'), implementationCore = q('.implementation-core'), implementationMode = q('#implementationMode');
    const architecturePath = q('.architecture-links path'), aiPath = q('.ai-links path'), supportPulseLine = q('.support-pulse__line'), supportPulseArea = q('.support-pulse__area');
    const principlesWorld = q('.principles-world'), principlesCore = q('.principles-core'), principlesCoreMode = q('#principlesCoreMode'), adaptiveSystem = q('.adaptive-system'), directSystem = q('.direct-system'), manifestoSystem = q('.manifesto-system'), aboutSystem = q('.about-system');
    const adaptiveOutline = q('.adaptive-outline'), adaptiveLinks = qa('.adaptive-link'), altRoutes = qa('.alt-route'), directRoute = q('.direct-route'), manifestoSpokes = qa('.manifesto-spoke'), aboutLinks = qa('.about-link'), founderLinks = qa('.founder-link'), berlinGrid = q('.berlin-grid-line'), berlinAxis = q('.berlin-axis');
    const aiOrbit = q('.ai-orbit'), supportBackbone = q('.support-backbone'), adaptiveFit = q('.adaptive-fit');
    const workflowStep = q('#workflowStep'), workflowVerb = q('#workflowVerb'), workflowDetail = q('#workflowDetail');
    const photoPortals = { accountant: q('[data-photo="accountant"]'), collaboration: q('[data-photo="collaboration"]') };
    const sourceMedia = q('.source-card-media'), sourceMediaImg = q('.source-card-media img');
    const serviceCards = qa('.service-card');
    const capabilityFocusIndex = q('#capabilityFocusIndex'), capabilityFocusName = q('#capabilityFocusName');
    const localeText = key => getMessage(document.documentElement.lang, key);
    const serviceKey = idx => `service.${String(idx + 1).padStart(2, '0')}.name`;
    qa('.photo-portal img,.service-card-media img,.implementation-media img').forEach(img => { let triedRemote = false; img.addEventListener('error', () => { if (!triedRemote && img.dataset.remote) {
        triedRemote = true;
        img.src = img.dataset.remote;
        return;
    } const portal = img.closest('.photo-portal,.service-card-media'); portal?.classList.add('is-missing'); }, { once: false }); });
    let anchors = { source: { x: 0, y: 0 }, railStart: { x: 0, y: 0 }, railEnd: { x: 0, y: 0 }, chart: { x: 0, y: 0 }, network: { x: 0, y: 0 } };
    function centerOf(el) { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
    function measureAnchors() { anchors.source = centerOf(extract); anchors.railStart = centerOf(q('.station.s1')); anchors.railEnd = centerOf(q('.station.s4')); anchors.chart = centerOf(chartNode); anchors.network = centerOf(q('.node--center')); }
    setTimeout(measureAnchors, 100);
    const STORY_POINTS = STORY_SCENES.map(s => s.target);
    function updateChapter(p) {
        const scene = sceneAt(p);
        chapterNo.textContent = String(scene.number).padStart(2, '0');
        debugScene.textContent = scene.title;
        document.documentElement.dataset.story = scene.id;
        document.documentElement.dataset.theme = (p < PHASE1.wipeEnd || (p >= .466 && p < .64) || (p >= .82 && p < .984)) ? 'dark' : 'light';
        const cue = q('#continueCue');
        cue.hidden = scene.number === 20;
        cue.setAttribute('aria-label', `${window.__ZAHLFIX_I18N__?.t('site.continueAria') || 'Weiter zur nächsten Szene'} (${Math.min(20, scene.number + 1)} / 20)`);
    }
    // Locale changes must also update dynamic labels while the menu pauses the scene clock.
    document.addEventListener('zahlfix:locale-change', () => updateChapter(progress));
    function positionDot(el, x, y, scale = 1, opacity = 1) { css(el, { left: x + 'px', top: y + 'px', transform: `translate(-50%,-50%) scale(${scale})` }); setOpacity(el, opacity); }
    function photoBox(el, { cx, cy, w, h, opacity = 1, scale = 1, rotate = 0, radius = 0, clipRight = 0, clipLeft = 0 }) {
        if (!el)
            return;
        css(el, { left: (cx - w / 2) + 'px', top: (cy - h / 2) + 'px', width: w + 'px', height: h + 'px', transform: `scale(${scale}) rotate(${rotate}deg)`, borderRadius: radius + 'px', clipPath: `inset(0 ${clipRight}% 0 ${clipLeft}% round ${radius}px)` });
        setOpacity(el, opacity);
        const img = el.querySelector('img');
        if (img)
            css(img, { transform: `translate3d(${clamp(velocity, -8, 8) * 1.6}px,${clamp(velocity, -8, 8) * -.55}px,0) scale(${1.055 + Math.min(10, Math.abs(velocity)) * .0025})` });
    }
    function updateWorkflow(flowT) {
        const idx = Math.min(3, Math.floor(clamp(flowT) * 3.999));
        for (const [node, suffix] of [[workflowStep, 'label'], [workflowVerb, 'title'], [workflowDetail, 'detail']]) {
            const key = `workflow.state${idx + 1}.${suffix}`;
            node.dataset.i18n = key;
            node.textContent = localeText(key);
        }
        qa('.station').forEach((e, i) => e.classList.toggle('is-active', i === idx));
    }
    function updateServiceCards(p, sv, T) {
        const mobile = isMobileViewport();
        const revealAll = ramp(p, T.services.enter, T.services.live);
        const sweep = clamp((p - T.services.live) / Math.max(.0001, T.services.hold - T.services.live));
        const activePos = sweep * 9;
        const activeIndex = Math.min(9, Math.max(0, Math.round(activePos)));
        if (capabilityFocusIndex)
            capabilityFocusIndex.textContent = String(activeIndex + 1).padStart(2, '0') + ' / 10';
        if (capabilityFocusName)
            { capabilityFocusName.dataset.i18n = serviceKey(activeIndex); capabilityFocusName.textContent = localeText(serviceKey(activeIndex)); }
        serviceCards.forEach((card, i) => {
            const media = card.querySelector('.service-card-media');
            const isSource = card.classList.contains('source-card');
            const reveal = ramp(p, T.services.enter + i * .0018, T.services.live + .018 + i * .0018);
            const focus = clamp(1 - Math.abs(activePos - i));
            const near = clamp(1 - Math.abs(activePos - i) / 2.2);
            const col = mobile ? (i % 2) : (i % 5);
            const row = mobile ? Math.floor(i / 2) : Math.floor(i / 5);
            const offsetX = mobile ? 0 : mix((col - 2) * 8, 0, reveal);
            const offsetY = mix(18 + row * 5, 0, reveal) + (mobile ? mix(0, -3, focus) : 0);
            const scale = mix(.982, 1.026, focus);
            const baseOpacity = .88;
            const alpha = sv * revealAll * mix(baseOpacity, 1, Math.max(focus, near * .35));
            css(card, { opacity: String(clamp(alpha)), transform: `translate3d(${offsetX}px,${offsetY}px,0) scale(${scale})` });
            card.classList.toggle('is-spotlit', i === activeIndex);
            card.querySelector('button')?.setAttribute('aria-pressed', String(i === activeIndex));
            if (media) {
                const strength = mix(mobile ? .25 : .22, mobile ? .88 : .84, focus);
                css(media, { opacity: String(sv * reveal * strength), clipPath: `inset(0 ${mix(36, 0, Math.max(reveal, focus))}% 0 0)`, transform: `translate3d(${mix(12, 0, reveal)}px,0,0) scale(${mix(1.055, 1, focus)})` });
                const img = media.querySelector('img');
                if (img)
                    css(img, { transform: `translate3d(${clamp(velocity, -7, 7) * .65}px,${clamp(velocity, -7, 7) * -.22}px,0) scale(${1.06 + Math.min(7, Math.abs(velocity)) * .0015})` });
            }
        });
    }
    function lineMotion(selector, t, { x = 0, y = 38, scale = .985 } = {}) { const el = q(selector); if (!el)
        return; const k = clamp(t); css(el, { opacity: String(k), clipPath: `inset(${(100 * (1 - k)).toFixed(2)}% 0 0 0)`, transform: `translate3d(${mix(x, 0, k)}px,${mix(y, 0, k)}px,0) scale(${mix(scale, 1, k)})` }); }
    function lineExit(selector, t, x = 0, y = -30) { const el = q(selector); if (!el)
        return; const k = clamp(t); css(el, { opacity: String(1 - k), transform: `translate3d(${mix(0, x, k)}px,${mix(0, y, k)}px,0) scale(${mix(1, .98, k)})` }); }
    const lastOwners = new Map();
    const ownerRuns = (key, active) => { const previous = lastOwners.get(key) || false; lastOwners.set(key, active); return active || previous; };
    function renderDOM(p) {
        perfStats.domRenders = (perfStats.domRenders || 0) + 1;
        const T = isMobileViewport() ? TIMELINES.mobile : TIMELINES.desktop;
        progressFill.style.height = (p * 100).toFixed(2) + '%';
        document.documentElement.style.setProperty('--story-progress',(p * 100).toFixed(2)+'%');
        debugProgress.textContent = p.toFixed(3);
        updateChapter(p);
        document.documentElement.style.setProperty('--velocity', String(Math.min(12, Math.abs(velocity))));
        // Authored colour transitions: each next world grows out of the previous visual object.
        fields.yellow.style.clipPath = 'none';
        fields.yellow.style.opacity = p >= PHASE1.wipeEnd ? '1' : '0';
        fields.paper.style.clipPath = `inset(${map(p, .342, .37, 100, 0)}% 0 0 0)`;
        fields.dark.style.clipPath = `circle(${map(p, .455, .493, 0, 170)}% at 50% 58%)`;
        fields.paper2.style.clipPath = `circle(${map(p, .61, .631, 0, 165)}% at 78% 58%)`;
        fields.dark2.style.clipPath = `circle(${map(p, .79, .855, 0, 165)}% at 72% 53%)`;
        fields.contact.style.clipPath = `circle(${map(p, .972, .997, 0, 175)}% at 72% 52%)`;
        // Scene plateaus give each composition a readable hold before it transforms onward.
        const h = 1 - ramp(p, T.hero.hold, T.hero.out);
        const pr = win(p, T.structure.enter, T.structure.live, T.structure.hold, T.structure.out);
        const sv = win(p, T.services.enter, T.services.live, T.services.hold, T.services.out);
        const wf = win(p, T.workflow.enter, T.workflow.live, T.workflow.hold, T.workflow.out);
        const rp = win(p, T.reporting.enter, T.reporting.statement, T.reporting.hold, T.reporting.out);
        const co = win(p, T.collaboration.enter, T.collaboration.live, T.collaboration.hold, T.collaboration.out);
        const ct = responsive.isCompact ? (p >= .972 ? 1 : 0) : ramp(p, T.contact.enter, T.contact.live);
        setOpacity(scenes.hero, h);
        setOpacity(scenes.principle, pr);
        setOpacity(scenes.services, sv);
        setOpacity(scenes.workflow, wf);
        setOpacity(scenes.reporting, rp);
        setOpacity(scenes.collaboration, co);
        setOpacity(scenes.contact, ct);
        Object.entries({ hero: h, principle: pr, services: sv, workflow: wf, reporting: rp, collaboration: co, contact: ct }).forEach(([id, alpha]) => {
            const active = alpha > .72;
            scenes[id].classList.toggle('is-interactive', active);
            scenes[id].inert = !active;
            scenes[id].setAttribute('aria-hidden', String(!active));
        });
        document.documentElement.classList.toggle('is-contact', ct > .98);
        // Every capability owns its own clipped media panel; Automation (04) additionally becomes the flow object.
        if (sv > .002 || lastOwners.get('services'))
            updateServiceCards(p, sv, T);
        // Scene 12 photography is no longer a free-floating viewport layer.
        // It is owned by the software portal and therefore cannot collide with copy or the workflow rail.
        if (photoPortals.accountant)
            setOpacity(photoPortals.accountant, 0);
        if (photoPortals.collaboration)
            setOpacity(photoPortals.collaboration, 0);
        // VISUAL RECOMPOSITION PHASE 1 — one readable headline owns each beat.
        const [beat01, beat02, beat03, beat04, beat05, beat06, beat07, beat08] = Array.from({ length: 8 }, (_, i) => beatOpacity(i + 1, p));
        const storyBeat = (selector, v, { x = 0, y = 30, scale = .99 } = {}) => { const el = q(selector); if (!el)
            return; const k = clamp(v); css(el, { opacity: String(k), visibility: k > .002 ? 'visible' : 'hidden', transform: `translate3d(${mix(x, 0, k)}px,${mix(y, 0, k)}px,0) scale(${mix(scale, 1, k)})`, clipPath: `inset(${mix(7, 0, k)}% 0 ${mix(7, 0, k)}% 0)` }); };
        storyBeat('.story-beat--01', beat01, { y: 18, scale: .995 });
        storyBeat('.story-beat--02', beat02, { x: -24, y: 16 });
        storyBeat('.story-beat--03', beat03, { x: 22, y: 16 });
        storyBeat('.story-beat--04', beat04, { y: 18 });
        storyBeat('.story-beat--05', beat05, { x: -20, y: 14 });
        storyBeat('.story-beat--06', beat06, { x: 18, y: 14 });
        storyBeat('.story-beat--07', beat07, { y: 16, scale: .992 });
        storyBeat('.story-beat--08', beat08, { x: 20, y: 14, scale: .992 });
        // Content Migration Phase 2 — source-authored scenes 09–18.
        const [beat11, beat12, beat13, beat14, beat15, beat16, beat17, beat18, beat19] = Array.from({ length: 9 }, (_, i) => beatOpacity(i + 11, p));
        storyBeat('.content-beat--11', beat11, { x: 34, y: 26, scale: .985 });
        storyBeat('.content-beat--12', beat12, { x: -28, y: 22, scale: .988 });
        storyBeat('.content-beat--13', beat13, { x: -30, y: 22, scale: .988 });
        storyBeat('.content-beat--14', beat14, { x: 36, y: 24, scale: .985 });
        storyBeat('.content-beat--15', beat15, { x: -30, y: 24, scale: .985 });
        storyBeat('.content-beat--16', beat16, { x: -28, y: 20, scale: .988 });
        storyBeat('.content-beat--17', beat17, { x: 30, y: 20, scale: .988 });
        storyBeat('.content-beat--18', beat18, { x: -28, y: 18, scale: .985 });
        storyBeat('.content-beat--19', beat19, { x: 28, y: 18, scale: .988 });
        const heroOut = ramp(p, .044, .056);
        css(q('.hero-line--1'), { transform: `translateX(${mix(0, -18, heroOut)}px)` });
        css(q('.hero-line--2'), { transform: `translateX(${mix(0, 12, heroOut)}px)` });
        css(q('.hero-line--3'), { transform: `translateX(${mix(0, -8, heroOut)}px)` });
        // Continue is global; it does not fade with the opening scene.
        if (ownerRuns('challenge', p >= .14 && p <= .355)) {
            // One persistent challenge system replaces the paper swarm after Scene 03.
            const challenge = q('.challenge-visual');
            const challengeAlpha = win(p, PHASE1.end, .240, .339, .351);
            if (challenge) {
                css(challenge, { opacity: String(challengeAlpha), visibility: challengeAlpha > .002 ? 'visible' : 'hidden', transform: `scale(${mix(.94, 1, challengeAlpha)})` });
            }
            const ringA = clamp(beat04 + beat05 * .35), barsA = clamp(beat05 + beat06 * .7), fragA = clamp(beat06), coreA = clamp(beat07 + beat08);
            qa('.challenge-ring i').forEach((e, i) => css(e, { opacity: String(ringA * (.36 - i * .07)), transform: `translate(-50%,-50%) scale(${mix(.72, 1 + i * .04, ringA)})` }));
            css(q('.challenge-bars'), { opacity: String(barsA * (1 - ramp(p, .245, .268))), transform: `translateX(${mix(24, 0, barsA)}px)` });
            qa('.challenge-bars span').forEach((e, i) => css(e, { transform: `translateX(${mix(0, (i % 2 ? 1 : -1) * (10 + i * 5), beat05)}px) scaleX(${mix(.68, 1, barsA)})` }));
            css(q('.challenge-fragments'), { opacity: String(fragA * (1 - ramp(p, .273, .302))), transform: `scale(${mix(.88, 1, fragA)}) rotate(${mix(-3, 2, fragA)}deg)` });
            const core = q('.challenge-core');
            if (core)
                css(core, { opacity: String(coreA), transform: `translate(-50%,-50%) scale(${mix(.38, beat08 > .05 ? 1.05 : .72, coreA)})` });
            const coreLabel = q('.challenge-core b'), coreSub = q('.challenge-core span');
            if (coreLabel)
                coreLabel.style.opacity = String(ramp(p, .312, .324));
            if (coreSub)
                coreSub.style.opacity = String(ramp(p, .32, .334));
            const s61 = ramp(p, .233, .24), s62 = ramp(p, .243, .25), s63 = ramp(p, .253, .26);
            const lines06 = qa('.story-beat--06 strong span');
            if (lines06[0])
                css(lines06[0], { opacity: String(s61), transform: `translateY(${mix(18, 0, s61)}px)` });
            if (lines06[1])
                css(lines06[1], { opacity: String(s62), transform: `translateY(${mix(18, 0, s62)}px)` });
            if (lines06[2])
                css(lines06[2], { opacity: String(s63), transform: `translateY(${mix(18, 0, s63)}px)` });
            qa('.compression-grid span').forEach((e, i) => css(e, { transform: `scaleY(${ramp(p, .19 + i * .006, .255 + i * .006)})`, transformOrigin: 'bottom', opacity: String((beat05 + beat06) * .55) }));
        }
        if (ownerRuns('services', sv > .002)) {
            const servicesOut = ramp(p, .462, .493);
            css(q('.service-matrix'), { transform: `translate3d(0,${map(p, .325, .35, 34, 0)}px,0) scale(${map(p, .325, .35, .94, 1) * mix(1, .965, servicesOut)})`, opacity: String(sv * mix(1, .08, servicesOut)) });
            css(q('.services-title'), { transform: `translateY(${map(p, .325, .35, 18, 0)}px)`, opacity: String(sv) });
            css(q('.capability-readout'), { opacity: String(sv * mix(.35, 1, ramp(p, .35, .375)) * mix(1, .12, servicesOut)), transform: `translateY(${map(p, .325, .35, 10, 0)}px)` });
            const serviceSweep = clamp((p - T.services.live) / Math.max(.0001, T.services.hold - T.services.live));
            serviceCards.forEach((e, i) => { const focus = clamp(1 - Math.abs(serviceSweep * 9 - i)); const glyph = e.querySelector('.service-glyph'); if (glyph)
                css(glyph, { opacity: String(.12 + .5 * focus), transform: `scale(${.9 + .13 * focus}) rotate(${mix(-3, 0, focus)}deg)` }); });
            qa('.service-card .service-name').forEach((e, i) => css(e, { transform: `translateY(${map(p, .334 + i * .002, .354 + i * .002, 12, 0)}px)`, opacity: String(ramp(p, .334 + i * .002, .354 + i * .002)) }));
        }
        // The Automation capability exits the grid and becomes the implementation flow object.
        const handT = ramp(p, .438, .487), handAlpha = win(p, .43, .44, .486, .505);
        const sx = anchors.source.x, sy = anchors.source.y, ex = innerWidth * .5, ey = innerHeight * .62;
        positionDot(handoff, mix(sx, ex, handT), mix(sy, ey, handT) - Math.sin(handT * Math.PI) * innerHeight * .055, mix(.92, 1.05, handT), handAlpha);
        handoff.style.rotate = mix(5, 0, handT) + 'deg';
        extract.style.opacity = String(1 - ramp(p, .432, .458));
        if (ownerRuns('workflow', wf > .002)) {
            const workflowExit = ramp(p, .535, .553);
            css(q('.workflow-copy'), { transform: `translateX(${map(p, .455, .478, -30, 0)}px)`, opacity: String(wf * map(p, .455, .477, .08, 1) * (1 - workflowExit)) });
            lineMotion('.workflow-line--1', ramp(p, .466, .486), { x: -24, y: 12 });
            lineMotion('.workflow-line--2', ramp(p, .478, .498), { x: 24, y: 12 });
            lineMotion('.workflow-line--3', ramp(p, .49, .51), { x: -14, y: 12 });
            css(q('.workflow-status'), { opacity: String(wf * map(p, .472, .495, .08, 1) * (1 - workflowExit)), transform: `translateY(${map(p, .455, .482, 16, 0)}px)` });
            css(q('#workflowDetail'), { opacity: String(ramp(p, .487, .505)) });
            const flowT = ramp(p, T.workflow.travelStart, T.workflow.travelEnd);
            railLive.style.transform = `scaleX(${flowT})`;
            traveler.style.left = (flowT * 100) + '%';
            traveler.style.opacity = String(wf * map(p, .478, .495, 0, 1) * (1 - ramp(p, .545, .56)));
            updateWorkflow(flowT);
            qa('.station i').forEach((e, i) => e.style.background = flowT >= i / 3 - .015 ? '#C39438' : '#fff');
            // Scene 11: completed rail compresses into a repeatable automation loop.
            const loopT = ramp(p, .538, .563), loopHold = 1 - ramp(p, .595, .62), loopAlpha = beat11 * loopHold;
            const loop = q('.automation-loop');
            if (loop) {
                css(loop, { opacity: String(loopAlpha), visibility: loopAlpha > .002 ? 'visible' : 'hidden', transform: `scale(${mix(.66, 1, loopT)}) translate3d(${mix(18, 0, loopT)}px,0,0)` });
            }
            const loopLive = q('.automation-loop__live');
            if (loopLive)
                loopLive.style.strokeDashoffset = String(955 * (1 - loopT));
            qa('.automation-loop__satellite').forEach((e, i) => e.style.rotate = (p * 520 * (i % 2 ? 1 : -1)) + 'deg');
            css(q('.workflow-rail'), { transform: `translate3d(${mix(0, innerWidth * .08, loopT)}px,${mix(0, -34, loopT)}px,0) scale(${mix(1, .54, loopT)})`, opacity: String(wf * (1 - loopT * .9)) });
        }
        // One signal travels from the automation endpoint into the implementation portal,
        // stays alive through Software / AI / Support, then hands off to the next chapter.
        const sigA = win(p, .592, .61, .824, .862);
        let sigX = anchors.railEnd.x, sigY = anchors.railEnd.y;
        if (p >= .608) {
            const tt = ramp(p, .608, .648);
            sigX = mix(anchors.railEnd.x, anchors.chart.x, tt);
            sigY = mix(anchors.railEnd.y, anchors.chart.y, tt);
        }
        if (p >= .812) {
            const tt = ramp(p, .812, .852);
            sigX = mix(anchors.chart.x, anchors.network.x, tt);
            sigY = mix(anchors.chart.y, anchors.network.y, tt);
        }
        positionDot(signal, sigX, sigY, map(p, .608, .648, .92, 1.08), sigA);
        if (ownerRuns('implementation', rp > .002)) {
            // VISUAL RECOMPOSITION PHASE 2 — Scenes 12–15 share one persistent implementation world.
            const portalIn = ramp(p, .602, .642), portalOut = ramp(p, .812, .842), portalAlpha = rp * (1 - portalOut);
            if (implementationWorld)
                css(implementationWorld, { opacity: String(portalAlpha), visibility: portalAlpha > .002 ? 'visible' : 'hidden', transform: `translate3d(${mix(44, 0, portalIn) + mix(0, -36, portalOut)}px,${mix(20, 0, portalIn)}px,0) scale(${mix(.82, 1, portalIn) * mix(1, .92, portalOut)})` });
            if (implementationPortal)
                css(implementationPortal, { clipPath: `circle(${mix(8, 86, portalIn)}% at 72% 52%)`, borderRadius: mix(42, 0, portalIn) + 'px' });
            const orbit = q('.implementation-orbit');
            if (orbit)
                css(orbit, { opacity: String(rp * (1 - portalIn) * .75), transform: `translate(-50%,-50%) scale(${mix(.62, 1.15, portalIn)})` });
            // Scene 12 — the automation loop becomes a software portal. The photo exists only inside this portal.
            const mediaIn = ramp(p, .612, .635), mediaOut = ramp(p, .658, .676), mediaAlpha = beat12 * (1 - mediaOut);
            if (implementationMedia)
                css(implementationMedia, { opacity: String(mediaAlpha), visibility: mediaAlpha > .002 ? 'visible' : 'hidden', clipPath: `inset(0 ${mix(100, 0, mediaIn)}% 0 0)`, transform: `scale(${mix(1.035, 1, mediaIn)})` });
            const portalImg = q('.implementation-media img');
            if (portalImg)
                css(portalImg, { transform: `translate3d(${clamp(velocity, -7, 7) * .8}px,${clamp(velocity, -7, 7) * -.22}px,0) scale(${1.055 + Math.min(6, Math.abs(velocity)) * .002})` });
            // Scene 13 — photography dissolves into a modular custom-software architecture.
            const archIn = ramp(p, .666, .688), archOut = ramp(p, .716, .731), archAlpha = beat13 * (1 - archOut * .82);
            if (softwareArchitecture)
                css(softwareArchitecture, { opacity: String(archAlpha), visibility: archAlpha > .002 ? 'visible' : 'hidden', transform: `translate3d(${mix(26, 0, archIn)}px,0,0) scale(${mix(.975, 1, archIn)})` });
            qa('.architecture-module').forEach((e, i) => { const t = ramp(p, .672 + i * .004, .692 + i * .004); css(e, { opacity: String(archAlpha * t), transform: `translate3d(0,${mix(16, 0, t)}px,0) scale(${mix(.96, 1, t)})` }); });
            if (architecturePath)
                architecturePath.style.strokeDashoffset = String(1500 * (1 - ramp(p, .686, .71)));
            // Scene 14 — the software modules reorganize into a connected AI layer.
            const aiIn = ramp(p, .718, .739), aiOut = ramp(p, .768, .782), aiAlpha = beat14 * (1 - aiOut * .78);
            if (aiSystem)
                css(aiSystem, { opacity: String(aiAlpha), visibility: aiAlpha > .002 ? 'visible' : 'hidden', transform: `scale(${mix(.975, 1, aiIn)})` });
            if (aiPath)
                aiPath.style.strokeDashoffset = String(1800 * (1 - ramp(p, .728, .753)));
            qa('.ai-node').forEach((e, i) => { const t = ramp(p, .731 + i * .003, .749 + i * .003); const settle = ramp(p, .742, .755); const drift = reduced ? 0 : Math.sin((p * 170) + (i * 1.7)) * mix(2.4, .7, settle); css(e, { opacity: String(aiAlpha * t), transform: `translate(calc(-50% + ${drift.toFixed(2)}px),calc(-50% + ${(drift * .35).toFixed(2)}px)) scale(${mix(.72, 1, t)})` }); });
            if (aiOrbit)
                css(aiOrbit, { opacity: String(aiAlpha * ramp(p, .727, .744)), transform: `translate(-50%,-50%) scale(${mix(.9, 1, ramp(p, .727, .748))}) rotate(${reduced ? 0 : mix(-4, 2, ramp(p, .727, .768))}deg)` });
            if (implementationCore)
                css(implementationCore, { opacity: String(clamp(beat12 * .18 + beat13 * .30 + beat14 * .88 + beat15 * .10)), transform: `translate(-50%,-50%) scale(${mix(.72, 1.08, aiIn)})` });
            // Scene 15 — the same system settles into a calm post-launch support state.
            const supportIn = ramp(p, .770, .791), supportOut = ramp(p, .815, .837), supportAlpha = beat15 * (1 - supportOut * .72);
            if (supportSystem)
                css(supportSystem, { opacity: String(supportAlpha), visibility: supportAlpha > .002 ? 'visible' : 'hidden', transform: `translate3d(0,${mix(15, 0, supportIn)}px,0) scale(${mix(.985, 1, supportIn)})` });
            if (supportPulseLine)
                supportPulseLine.style.strokeDashoffset = String(1300 * (1 - ramp(p, .785, .81)));
            if (supportPulseArea)
                supportPulseArea.style.opacity = String(.72 * ramp(p, .792, .812));
            if (supportBackbone) {
                const sb = ramp(p, .778, .797);
                css(supportBackbone, { opacity: String(supportAlpha * sb), transform: `translateY(${mix(10, 0, sb)}px)` });
                qa('.support-backbone__node,.support-backbone__core').forEach((e, i) => { const t = ramp(p, .781 + i * .004, .800 + i * .004); css(e, { opacity: String(supportAlpha * t), transform: `translate(-50%,-50%) scale(${mix(.82, 1, t)})` }); });
            }
            const liveDot = q('.support-live-dot i');
            if (liveDot)
                liveDot.style.transform = `scale(${reduced ? 1 : .92 + Math.sin(p * 150) * .07})`;
            if (implementationMode)
                { const mode = beat15 > .2 ? 'support' : beat14 > .2 ? 'ai' : beat13 > .2 ? 'build' : 'delivery';
                  implementationMode.dataset.i18n = `implementation.mode.${mode}`;
                  implementationMode.textContent = localeText(implementationMode.dataset.i18n); }
        }
        if (ownerRuns('principles', co > .002)) {
            // VISUAL RECOMPOSITION PHASE 3 — Scenes 16–19 share one abstract principles world.
            const principlesAlpha = win(p, .812, .822, .975, .988);
            if (principlesWorld)
                css(principlesWorld, { opacity: String(principlesAlpha), visibility: principlesAlpha > .002 ? 'visible' : 'hidden', transform: `translate3d(${mix(28, 0, ramp(p, .812, .835))}px,0,0) scale(${mix(.97, 1, ramp(p, .812, .835))})` });
            // Scene 16 — adaptive system geometry: no off-the-shelf solution.
            const adaptiveAlpha = beat16;
            if (adaptiveSystem)
                css(adaptiveSystem, { opacity: String(adaptiveAlpha), visibility: adaptiveAlpha > .002 ? 'visible' : 'hidden' });
            if (adaptiveOutline) {
                adaptiveOutline.style.strokeDashoffset = String(2200 * (1 - ramp(p, .824, .846)));
                adaptiveOutline.style.opacity = String(adaptiveAlpha * .62);
            }
            adaptiveLinks.forEach((path, i) => { path.style.strokeDashoffset = String(800 * (1 - ramp(p, .828 + i * .003, .848 + i * .003))); path.style.opacity = String(adaptiveAlpha * .52); });
            if (adaptiveFit) {
                const ft = ramp(p, .824, .846);
                css(adaptiveFit, { opacity: String(adaptiveAlpha * ft), transform: `translate(-50%,-50%) scale(${mix(.84, 1, ft)}) rotate(${mix(-5, 1.5, ft)}deg)` });
            }
            qa('.adaptive-module').forEach((e, i) => { const t = ramp(p, .826 + i * .004, .846 + i * .004); const fitShift = (i < 2 ? -1 : 1) * mix(16, 0, t); css(e, { opacity: String(adaptiveAlpha * t), transform: `scale(${mix(.78, 1, t)}) translate3d(${mix((i % 2 ? 1 : -1) * 19, 0, t)}px,${fitShift}px,0)` }); });
            // Scene 17 — alternatives disappear and the direct route becomes the visual owner.
            const directAlpha = beat17;
            if (directSystem)
                css(directSystem, { opacity: String(directAlpha), visibility: directAlpha > .002 ? 'visible' : 'hidden' });
            altRoutes.forEach((path, i) => { path.style.opacity = String(directAlpha * (1 - ramp(p, .872 + i * .003, .889 + i * .003)) * .8); path.style.strokeDashoffset = String(900 * (1 - ramp(p, .862 + i * .002, .878 + i * .002))); });
            if (directRoute) {
                directRoute.style.strokeDashoffset = String(1800 * (1 - ramp(p, .869, .891)));
                directRoute.style.opacity = String(directAlpha);
            }
            qa('.route-node').forEach((e, i) => { const t = ramp(p, .866 + i * .01, .883 + i * .01); css(e, { opacity: String(directAlpha * t), transform: `translate(-50%,-50%) scale(${mix(.72, 1, t)})` }); });
            const routeCaption = q('.route-caption');
            if (routeCaption)
                routeCaption.style.opacity = String(directAlpha * ramp(p, .88, .892));
            // Scene 18 — manifesto: the geometry simplifies and only three implementation axes remain.
            const manifestoAlpha = beat18;
            if (manifestoSystem)
                css(manifestoSystem, { opacity: String(manifestoAlpha), visibility: manifestoAlpha > .002 ? 'visible' : 'hidden' });
            manifestoSpokes.forEach((path, i) => { path.style.strokeDashoffset = String(900 * (1 - ramp(p, .904 + i * .004, .925 + i * .004))); path.style.opacity = String(manifestoAlpha * .72); });
            qa('.manifesto-marker').forEach((e, i) => { const t = ramp(p, .906 + i * .005, .923 + i * .005); css(e, { opacity: String(manifestoAlpha * t), transform: `translate(-50%,-50%) scale(${mix(.72, 1, t)})` }); });
            const manifestoWords = qa('.content-beat--18 strong span');
            if (manifestoWords[0]) {
                const t = ramp(p, .902, .910);
                const dim = ramp(p, .916, .929);
                css(manifestoWords[0], { opacity: String(manifestoAlpha * mix(1, .52, dim)), transform: `translateX(${mix(-18, 0, t)}px)` });
            }
            if (manifestoWords[1]) {
                const t = ramp(p, .910, .919);
                const dim = ramp(p, .925, .934);
                css(manifestoWords[1], { opacity: String(manifestoAlpha * t * mix(1, .62, dim)), transform: `translateX(${mix(18, 0, t)}px)` });
            }
            if (manifestoWords[2]) {
                const t = ramp(p, .920, .930);
                css(manifestoWords[2], { opacity: String(manifestoAlpha * t), transform: `translateX(${mix(-20, 0, t)}px)` });
            }
            // Scene 19 — About ZahlFix: abstract Berlin / strategy / technology / implementation system.
            const aboutAlpha = beat19;
            if (aboutSystem)
                css(aboutSystem, { opacity: String(aboutAlpha), visibility: aboutAlpha > .002 ? 'visible' : 'hidden' });
            founderLinks.forEach((path, i) => { path.style.strokeDashoffset = String(900 * (1 - ramp(p, .946 + i * .003, .960 + i * .003))); path.style.opacity = String(aboutAlpha * .72); });
            aboutLinks.forEach((path, i) => { path.style.strokeDashoffset = String(900 * (1 - ramp(p, .957 + i * .003, .971 + i * .003))); path.style.opacity = String(aboutAlpha * .55); });
            if (berlinGrid)
                berlinGrid.style.strokeDashoffset = String(1000 * (1 - ramp(p, .944, .963)));
            if (berlinAxis)
                berlinAxis.style.strokeDashoffset = String(1000 * (1 - ramp(p, .949, .966)));
            qa('.founder-origin').forEach((e, i) => { const t = ramp(p, .946 + i * .004, .960 + i * .004); css(e, { opacity: String(aboutAlpha * t), transform: `translate(-50%,-50%) scale(${mix(.75, 1, t)})` }); });
            qa('.about-node').forEach((e, i) => { const t = ramp(p, .958 + i * .004, .972 + i * .004); css(e, { opacity: String(aboutAlpha * t), transform: `translate(-50%,-50%) scale(${mix(.78, 1, t)})` }); });
            const berlinMark = q('.berlin-mark');
            if (berlinMark)
                css(berlinMark, { opacity: String(aboutAlpha * ramp(p, .943, .956)), transform: `translateY(${mix(9, 0, ramp(p, .943, .958))}px)` });
            // The same ZahlFix core persists across all four scenes and becomes the origin of Contact.
            const coreOwner = Math.max(adaptiveAlpha, directAlpha, manifestoAlpha, aboutAlpha);
            if (principlesWorld) {
                principlesWorld.classList.toggle('mode-adaptive', adaptiveAlpha > .18);
                principlesWorld.classList.toggle('mode-direct', directAlpha > .18);
                principlesWorld.classList.toggle('mode-manifesto', manifestoAlpha > .18);
                principlesWorld.classList.toggle('mode-about', aboutAlpha > .18);
            }
            if (principlesCore)
                css(principlesCore, { opacity: String(coreOwner), transform: `translate(-50%,-50%) scale(${mix(.82, 1, coreOwner)})` });
            if (principlesCoreMode)
                principlesCoreMode.textContent = getMessage(document.documentElement.lang, aboutAlpha > .2 ? 'principles.core.berlin' : manifestoAlpha > .2 ? 'principles.core.delivery' : directAlpha > .2 ? 'principles.core.direct' : 'principles.core.adaptive');
        }
        if (ownerRuns('contact', ct > .002)) {
            // Scene 20 — the yellow field expands from the final core into a balanced 43/57 conversion layout.
            const contactCopyIn = responsive.isCompact ? 1 : ramp(p, .978, .991), contactFormIn = responsive.isCompact ? 1 : ramp(p, .981, .994), contactFooterIn = responsive.isCompact ? 1 : ramp(p, .987, .997);
            css(q('.contact-copy'), { transform: `translate3d(0,${mix(26, 0, contactCopyIn)}px,0)`, opacity: String(ct * contactCopyIn) });
            lineMotion('.contact-line--1', ramp(p, .979, .99), { y: 24 });
            lineMotion('.contact-line--2', ramp(p, .984, .993), { x: 18, y: 20 });
            css(q('.challenge-form'), { transform: `translate3d(${mix(44, 0, contactFormIn)}px,0,0)`, opacity: String(ct * contactFormIn) });
            css(q('.contact-footer'), { transform: `translateY(${mix(16, 0, contactFooterIn)}px)`, opacity: String(ct * contactFooterIn) });
        }
    }
    // ------------------------------
    // PHASE 6 INTERACTION SYSTEM
    // ------------------------------
    const finePointer = matchMedia('(pointer:fine) and (hover:hover)').matches;
    const cursor = q('#cursor'), cursorLabel = q('#cursorLabel');
    const cursorState = { x: innerWidth * .5, y: innerHeight * .5, tx: innerWidth * .5, ty: innerHeight * .5, visible: false };
    if (finePointer && !reduced && cursor) {
        document.documentElement.classList.add('cursor-enabled');
        addEventListener('pointermove', e => { cursorState.tx = e.clientX; cursorState.ty = e.clientY; if (!cursorState.visible) {
            cursorState.x = e.clientX;
            cursorState.y = e.clientY;
            cursorState.visible = true;
            cursor.classList.add('is-visible');
        } }, { passive: true });
        addEventListener('pointerleave', () => {
            cursorState.visible = false;
            cursor.classList.remove('is-visible');
        });
        addEventListener('pointerdown', () => cursor.classList.add('is-down'));
        addEventListener('pointerup', () => cursor.classList.remove('is-down'));
        document.addEventListener('pointerover', e => { const hit = e.target.closest?.('[data-cursor],a,button'); if (!hit)
            return; const label = hit.dataset.cursor || ((hit.tagName === 'A' || hit.tagName === 'BUTTON') ? (window.__ZAHLFIX_I18N__?.t('cursor.open') || 'ÖFFNEN') : ''); cursorLabel.textContent = label; cursor.classList.toggle('is-context', Boolean(label)); });
        document.addEventListener('pointerout', e => { const from = e.target.closest?.('[data-cursor],a,button'); const to = e.relatedTarget?.closest?.('[data-cursor],a,button'); if (from && !to) {
            cursor.classList.remove('is-context');
            cursorLabel.textContent = '';
        } });
    }
    function renderCursor(dt) { if (!cursor || !finePointer || reduced)
        return; const ease = 1 - Math.exp(-15 * dt / 1000); cursorState.x += (cursorState.tx - cursorState.x) * ease; cursorState.y += (cursorState.ty - cursorState.y) * ease; css(cursor, { transform: `translate3d(${cursorState.x.toFixed(2)}px,${cursorState.y.toFixed(2)}px,0)` }); }
    // Magnetic controls are deliberately subtle: they never move more than 8px.
    if (finePointer && !reduced) {
        qa('.magnetic').forEach(el => {
            el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); const x = (e.clientX - r.left - r.width / 2) / Math.max(1, r.width / 2); const y = (e.clientY - r.top - r.height / 2) / Math.max(1, r.height / 2); el.style.setProperty('--mx', (x * 8).toFixed(2) + 'px'); el.style.setProperty('--my', (y * 6).toFixed(2) + 'px'); });
            el.addEventListener('pointerleave', () => { el.style.setProperty('--mx', '0px'); el.style.setProperty('--my', '0px'); });
        });
        qa('.service-card').forEach(card => {
            card.addEventListener('pointermove', e => { if (!scenes.services.classList.contains('is-interactive'))
                return; const r = card.getBoundingClientRect(), nx = clamp((e.clientX - r.left) / r.width), ny = clamp((e.clientY - r.top) / r.height); card.style.setProperty('--card-rx', ((.5 - ny) * 5.5).toFixed(2) + 'deg'); card.style.setProperty('--card-ry', ((nx - .5) * 6.5).toFixed(2) + 'deg'); card.style.setProperty('--card-x', ((nx - .5) * 4).toFixed(2) + 'px'); card.style.setProperty('--card-y', ((ny - .5) * 3).toFixed(2) + 'px'); card.style.setProperty('--card-z', '8px'); card.style.setProperty('--glow-x', (nx * 100).toFixed(1) + '%'); card.style.setProperty('--glow-y', (ny * 100).toFixed(1) + '%'); card.classList.add('is-hovered'); });
            card.addEventListener('pointerleave', () => { ['--card-rx', '--card-ry'].forEach(v => card.style.setProperty(v, '0deg')); ['--card-x', '--card-y', '--card-z'].forEach(v => card.style.setProperty(v, '0px')); card.classList.remove('is-hovered'); });
        });
    }
    // Modal navigation has its own native scroll surface; only the page beneath is locked.
    const menuTrigger = q('#menuTrigger'), menuClose = q('#menuClose'), menuOverlay = q('#menuOverlay');
    let menuReturnFocus = null, pendingDestination = null;
    const outsideMenu = [...Object.values(scenes), q('.topbar'), q('.progress'), q('#continueCue'), q('.view-switch'), q('.story-transcript')];
    let menuTimer = 0, menuEpoch = 0;
    function setMenu(open, restoreFocus = true) {
        const epoch = ++menuEpoch;
        clearTimeout(menuTimer);
        if (open) {
            menuReturnFocus = document.activeElement;
            menuOverlay.hidden = false;
            menuOverlay.inert = false;
            menuOverlay.setAttribute('aria-hidden', 'false');
            menuTrigger.setAttribute('aria-expanded', 'true');
            document.documentElement.classList.add('menu-open');
            cursor?.classList.add('is-menu');
            for (const el of outsideMenu)
                if (el)
                    el.inert = true;
            requestAnimationFrame(() => requestAnimationFrame(() => {
                if (epoch !== menuEpoch)
                    return;
                menuOverlay.classList.add('is-open');
                menuClose.focus({ preventScroll: true });
            }));
            return;
        }
        menuOverlay.classList.remove('is-open');
        menuOverlay.setAttribute('aria-hidden', 'true');
        menuTrigger.setAttribute('aria-expanded', 'false');
        document.documentElement.classList.remove('menu-open');
        cursor?.classList.remove('is-menu');
        for (const el of outsideMenu)
            if (el)
                el.inert = el.classList.contains('scene') && !el.classList.contains('is-interactive');
        const focusTarget = restoreFocus && menuReturnFocus instanceof HTMLElement ? menuReturnFocus : null;
        if (focusTarget) focusTarget.focus({ preventScroll: true });
        menuTimer = setTimeout(() => {
            if (epoch !== menuEpoch || menuOverlay.classList.contains('is-open'))
                return;
            menuOverlay.inert = true;
            menuOverlay.hidden = true;
        }, reduced ? 30 : 640);
    }
    menuOverlay.classList.remove('is-open');
    menuOverlay.hidden = true;
    menuOverlay.inert = true;
    menuOverlay.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('menu-open');
    menuTrigger.addEventListener('click', () => setMenu(true));
    menuClose.addEventListener('click', () => setMenu(false));
    function navigate(scene) {
        if (!scene)
            return;
        if (document.documentElement.dataset.mode !== 'cinema') {
            const destination = scene.id === 'contact' ? document.getElementById('contact-title') : document.getElementById('story-content');
            if (destination) { destination.scrollIntoView({behavior:'instant',block:'start'}); destination.tabIndex=-1; destination.focus({preventScroll:true}); }
            return;
        }
        setMenu(false, false);
        scenes.contact.scrollTop = 0;
        pendingDestination = scene;
        scrollTo({ top: responsive.destination(scene), behavior: reduced ? 'instant' : 'smooth' });
    }
    qa('[data-scene-target]').forEach(btn => btn.addEventListener('click', e => { e.preventDefault(); navigate(SCENES_BY_ID[btn.dataset.sceneTarget]); }));
    q('#continueCue').addEventListener('click', () => navigate(nextScene(progress)));
    qa('[data-service-select]').forEach(btn => btn.addEventListener('click', () => {
        scrollTo({ top: responsive.pixelsAt(serviceTarget(Number(btn.dataset.serviceSelect))), behavior: 'instant' });
    }));
    for (const name of ['wheel', 'touchstart', 'pointerdown'])
        addEventListener(name, () => { pendingDestination = null; }, { passive: true });
    addEventListener('keydown', e => {
        if (e.key === 'Escape')
            setMenu(false);
        if (!menuOverlay.classList.contains('is-open'))
            return;
        if (e.key === 'Tab') {
            const focusables = qa('#menuOverlay button,#menuOverlay a').filter(el => !el.disabled);
            const first = focusables[0], last = focusables.at(-1);
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            }
            else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    });
    function settleNavigation() {
        if (!pendingDestination || Math.abs(progress - (responsive.isCompact && pendingDestination.id==='contact' ? 1 : pendingDestination.target)) > .00015)
            return;
        const el = q(pendingDestination.selector);
        if (el) {
            el.tabIndex = -1;
            el.focus({ preventScroll: true });
        }
        pendingDestination = null;
    }
    // R6.1 entry ownership: authenticated entry is not a second loader. The shared
    // orbit frame is reconstructed at the exact screen-space bounds recorded by the
    // login document, then moves to the measured Phase 1 anchor before Scene 01 takes over.
    const loader = q('#siteLoader'), loaderFill = q('#loaderFill'), loaderValue = q('#loaderValue');
    if (loader) {
        document.body.classList.add('is-loading');
        const skip = new URLSearchParams(location.search).get('skipintro') === '1';
        const bootEntry = window.__ZAHLFIX_ENTRY_BOOT__;
        const authenticatedEntry = !!bootEntry?.authenticated && document.documentElement.classList.contains('entry-auth-pending');
        if (authenticatedEntry) {
            const bridge = q('#entryBridge');
            const snap = phase1?.snapshot?.();
            const L = snap?.layout;
            const stageRect = q('#main-stage').getBoundingClientRect();
            const fallbackX = innerWidth * .735, fallbackY = innerHeight * .53;
            const targetX = L ? stageRect.left + L.cx : fallbackX;
            const targetY = L ? stageRect.top + L.cy : fallbackY;
            const targetW = L ? Math.max(260, L.radii[2] * 2.4) : Math.min(650, innerWidth * .47);
            const targetCore = L ? Math.max(48, L.zSize) : 104;
            const targetPlaneY = L ? clamp(L.projection / .72, .88, 1.22) : 1;
            const rootStyle = document.documentElement.style;
            rootStyle.setProperty('--entry-target-x', `${targetX.toFixed(2)}px`);
            rootStyle.setProperty('--entry-target-y', `${targetY.toFixed(2)}px`);
            rootStyle.setProperty('--entry-target-w', `${targetW.toFixed(2)}px`);
            rootStyle.setProperty('--entry-target-core', `${targetCore.toFixed(2)}px`);
            rootStyle.setProperty('--entry-target-plane-y', targetPlaneY.toFixed(5));
            try { sessionStorage.removeItem('zahlfix-entry-mode'); sessionStorage.setItem('zahlfix-v6-seen', '1'); } catch { }
            // First painted frame is intentionally untouched: it must be pixel-identical
            // to the final login frame. Travel starts on the following animation frame.
            requestAnimationFrame(() => requestAnimationFrame(() => {
                document.documentElement.classList.add('entry-bridge-travel');
            }));
            const travelMs = reduced ? 180 : 820;
            window.setTimeout(() => {
                document.documentElement.classList.add('entry-phase1-reveal');
                loader.classList.add('is-revealing');
                window.setTimeout(() => document.documentElement.classList.add('entry-copy-reveal'), reduced ? 40 : 90);
                window.setTimeout(() => {
                    loader.classList.add('is-done');
                    document.body.classList.remove('is-loading');
                    document.documentElement.classList.remove('entry-auth-pending','entry-bridge-travel','entry-phase1-reveal','entry-copy-reveal');
                    for (const name of ['--entry-start-x','--entry-start-y','--entry-start-w','--entry-start-core','--entry-target-x','--entry-target-y','--entry-target-w','--entry-target-core','--entry-target-plane-y']) rootStyle.removeProperty(name);
                }, reduced ? 180 : 400);
            }, travelMs);
        } else {
            let seen = false;
            try { seen = sessionStorage.getItem('zahlfix-v6-seen') === '1'; } catch { }
            const startProgress = 0;
            const duration = skip ? 80 : (seen ? 420 : 880), start = performance.now();
            loader.style.setProperty('--loader-progress', String(startProgress));
            if (loaderFill) loaderFill.style.transform = `scaleX(${startProgress})`;
            if (loaderValue) loaderValue.textContent = '00';
            const tick = (now) => {
                const t = clamp((now - start) / duration), eased = 1 - Math.pow(1 - t, 3);
                const value = mix(startProgress, 1, eased);
                loader.style.setProperty('--loader-progress', String(value));
                if (loaderFill) loaderFill.style.transform = `scaleX(${value})`;
                if (loaderValue) loaderValue.textContent = String(Math.round(value * 100)).padStart(2, '0');
                if (t < 1) requestAnimationFrame(tick);
                else {
                    try { sessionStorage.setItem('zahlfix-v6-seen', '1'); } catch { }
                    setTimeout(() => { loader.classList.add('is-done'); document.body.classList.remove('is-loading'); }, 90);
                }
            };
            requestAnimationFrame(tick);
        }
    }
    const profiling = new URLSearchParams(location.search).has('debug');
    let frameTime = performance.now(), lastRendered = -1, lastVelocity = -1, raf, suspended = false;
    function loop(now) {
        if (suspended || document.documentElement.dataset.mode !== 'cinema') return;
        const dt = Math.min(64, Math.max(1, now - frameTime));
        frameTime = now;
        // Cursor rendering is intentionally independent from the cinematic scene clock.
        // Opening the menu pauses story/world motion, but the viewport-level cursor must
        // continue following pointer input instead of freezing over the menu trigger.
        if (!document.hidden)
            renderCursor(dt);
        if (!document.hidden && !document.documentElement.classList.contains('menu-open')) {
            const ease = rate => 1 - Math.exp(-rate * dt / 1000);
            velocity += (velocityTarget - velocity) * ease(12);
            velocityTarget *= Math.exp(-10 * dt / 1000);
            if (Math.abs(velocity) < .002)
                velocity = 0;
            const speed = Math.abs(velocity);
            progress += (target - progress) * (reduced ? 1 : ease(Math.min(24, 7 + speed * 2)));
            if (Math.abs(target - progress) < .00002)
                progress = target;
            if (needsRender || Math.abs(progress - lastRendered) > .000005 || Math.abs(velocity - lastVelocity) > .002) {
                document.documentElement.style.setProperty('--scroll-dir', String(Math.sign(velocity)));
                q('.topbar').classList.toggle('is-scrolling', speed > .18);
                renderDOM(progress);
                lastRendered = progress;
                lastVelocity = velocity;
                needsRender = false;
            }
            if (profiling)
                profileFrame(now, progress);
            // SVG failure and WebGL failure are independent. The first five scenes do not
            // pay the GPU cost of the later visual worlds.
            try { phase1?.render(dt / 1000, progress); }
            catch (error) { phase1?.fallback(error); }
            try { scenes0609?.render(dt / 1000, progress); }
            catch (error) { scenes0609?.fallback(error); }
            q('#world').style.visibility = progress < PHASE1.end ? 'hidden' : 'visible';
            try { if (progress >= PHASE1.end) world.render(now, progress, anchors, velocity); }
            catch (error) {
                world.dispose?.();
                world = { resize() { }, render() { } };
                document.documentElement.classList.add('no-webgl');
                console.warn('[ZahlFix] WebGL disabled; SVG and readable content retained.', error);
            }
            settleNavigation();
        }
        raf = requestAnimationFrame(loop);
    }
    renderDOM(progress);
    window.__ZAHLFIX_NAV__ = { seek(p, immediate=false) { scrollTo({top:responsive.pixelsAt(p),behavior:'instant'}); updateTarget(); if(immediate){progress=target;renderDOM(progress);phase1?.render(0,progress);scenes0609?.render(0,progress);lastRendered=progress;needsRender=false;} }, scene(id) { navigate(SCENES_BY_ID[id]); }, snapshot:()=>({...responsive.snapshot(),scrollProgress:responsive.progressAt(),progress,target}) };
    // Both lifecycle suspension and visibility pause the active clock. Resume owns
    // exactly one RAF chain; repeated pageshow/resume events cannot duplicate it.
    const pauseRendering = () => { suspended = true; cancelAnimationFrame(raf); };
    addEventListener('zahlfix:stop-motion',pauseRendering);
    const resumeRendering = () => {
        frameTime = performance.now(); needsRender = true;
        if (document.hidden || document.documentElement.dataset.mode !== 'cinema') return;
        if (suspended) { suspended = false; raf = requestAnimationFrame(loop); }
    };
    document.addEventListener('visibilitychange', () => document.hidden ? pauseRendering() : resumeRendering());
    document.addEventListener('freeze', pauseRendering);
    document.addEventListener('resume', resumeRendering);
    raf = requestAnimationFrame(loop);
    addEventListener('pagehide', event => { pauseRendering(); if (!event.persisted) world.dispose?.(); });
    addEventListener('pageshow', event => { if (event.persisted) { updateTarget(); resizeCanvas(); phase1?.measure?.(); scenes0609?.measure?.(); resumeRendering(); } });
    q('#restart').addEventListener('click', () => navigate(STORY_SCENES[0]));
    q('.brand').addEventListener('click', e => { e.preventDefault(); navigate(STORY_SCENES[0]); });
    const params = new URLSearchParams(location.search);
    if (params.get('debug') === '1')
        q('#debug').classList.add('is-on');
    const fp = Number(params.get('p'));
    if (params.has('p') && Number.isFinite(fp) && fp >= 0) {
        setTimeout(() => scrollTo(0, responsive.pixelsAt(clamp(fp))), 120);
    }
})();

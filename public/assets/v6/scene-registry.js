/**
 * The single navigation/reading-state authority. Progress is normalised to [0, 1].
 * All targets sit inside fully readable holds, never at entrance boundaries.
 * Mobile uses the same ownership; its composition is responsive in CSS.
 * @typedef {{number:number,id:string,parent:string,enter:number,live:number,
 *   hold:number,out:number,target:number,selector:string,title:string}} StoryScene
 */
export const STORY_SCENES = Object.freeze([
  {
    "number": 1,
    "id": "opening",
    "parent": "hero",
    "enter": 0,
    "live": 0,
    "hold": 0.044,
    "out": 0.056,
    "target": 0.02,
    "selector": ".story-beat--01",
    "title": "UNTERNEHMENSENTWICKLUNG"
  },
  {
    "number": 2,
    "id": "consulting",
    "parent": "hero",
    "enter": 0.058,
    "live": 0.064,
    "hold": 0.088,
    "out": 0.1,
    "target": 0.075,
    "selector": ".story-beat--02",
    "title": "BERATUNG"
  },
  {
    "number": 3,
    "id": "delivery",
    "parent": "hero",
    "enter": 0.102,
    "live": 0.109,
    "hold": 0.137,
    "out": 0.148,
    "target": 0.122,
    "selector": ".story-beat--03",
    "title": "UMSETZUNG"
  },
  {
    "number": 4,
    "id": "challenge",
    "parent": "principle",
    "enter": 0.149,
    "live": 0.156,
    "hold": 0.181,
    "out": 0.19,
    "target": 0.168,
    "selector": ".story-beat--04",
    "title": "FORTSCHRITT"
  },
  {
    "number": 5,
    "id": "processes",
    "parent": "principle",
    "enter": 0.192,
    "live": 0.199,
    "hold": 0.228,
    "out": 0.233,
    "target": 0.21,
    "selector": ".story-beat--05",
    "title": "PROZESSE"
  },
  {
    "number": 6,
    "id": "friction",
    "parent": "principle",
    "enter": 0.233,
    "live": 0.24,
    "hold": 0.263,
    "out": 0.271,
    "target": 0.26,
    "selector": ".story-beat--06",
    "title": "REIBUNG"
  },
  {
    "number": 7,
    "id": "question",
    "parent": "principle",
    "enter": 0.273,
    "live": 0.28,
    "hold": 0.301,
    "out": 0.309,
    "target": 0.291,
    "selector": ".story-beat--07",
    "title": "FRAGE"
  },
  {
    "number": 8,
    "id": "zahlfix",
    "parent": "principle",
    "enter": 0.311,
    "live": 0.318,
    "hold": 0.339,
    "out": 0.348,
    "target": 0.33,
    "selector": ".story-beat--08",
    "title": "ZAHLFIX"
  },
  {
    "number": 9,
    "id": "services",
    "parent": "services",
    "enter": 0.348,
    "live": 0.37,
    "hold": 0.445,
    "out": 0.466,
    "target": 0.39,
    "selector": ".content-beat--09",
    "title": "BERATUNG + UMSETZUNG"
  },
  {
    "number": 10,
    "id": "workflow",
    "parent": "workflow",
    "enter": 0.466,
    "live": 0.51,
    "hold": 0.535,
    "out": 0.548,
    "target": 0.522,
    "selector": ".workflow-copy",
    "title": "ANALYSIEREN / DIGITALISIEREN / OPTIMIEREN"
  },
  {
    "number": 11,
    "id": "automation",
    "parent": "workflow",
    "enter": 0.548,
    "live": 0.555,
    "hold": 0.592,
    "out": 0.61,
    "target": 0.575,
    "selector": ".content-beat--11",
    "title": "AUTOMATISIEREN"
  },
  {
    "number": 12,
    "id": "implementation",
    "parent": "reporting",
    "enter": 0.612,
    "live": 0.635,
    "hold": 0.653,
    "out": 0.665,
    "target": 0.645,
    "selector": ".content-beat--12",
    "title": "SOFTWAREIMPLEMENTIERUNG"
  },
  {
    "number": 13,
    "id": "software",
    "parent": "reporting",
    "enter": 0.667,
    "live": 0.692,
    "hold": 0.705,
    "out": 0.716,
    "target": 0.7,
    "selector": ".content-beat--13",
    "title": "INDIVIDUELLE SOFTWARE"
  },
  {
    "number": 14,
    "id": "ai",
    "parent": "reporting",
    "enter": 0.718,
    "live": 0.75,
    "hold": 0.756,
    "out": 0.768,
    "target": 0.753,
    "selector": ".content-beat--14",
    "title": "KI"
  },
  {
    "number": 15,
    "id": "support",
    "parent": "reporting",
    "enter": 0.77,
    "live": 0.8,
    "hold": 0.806,
    "out": 0.818,
    "target": 0.803,
    "selector": ".content-beat--15",
    "title": "SUPPORT"
  },
  {
    "number": 16,
    "id": "tailored",
    "parent": "collaboration",
    "enter": 0.82,
    "live": 0.836,
    "hold": 0.848,
    "out": 0.857,
    "target": 0.844,
    "selector": ".content-beat--16",
    "title": "KEINE STANDARDLOESUNG"
  },
  {
    "number": 17,
    "id": "direct",
    "parent": "collaboration",
    "enter": 0.86,
    "live": 0.875,
    "hold": 0.888,
    "out": 0.897,
    "target": 0.883,
    "selector": ".content-beat--17",
    "title": "KEINE UMWEGE"
  },
  {
    "number": 18,
    "id": "principles",
    "parent": "collaboration",
    "enter": 0.9,
    "live": 0.919,
    "hold": 0.929,
    "out": 0.938,
    "target": 0.925,
    "selector": ".content-beat--18",
    "title": "UMSETZUNGSFOKUS"
  },
  {
    "number": 19,
    "id": "about",
    "parent": "collaboration",
    "enter": 0.941,
    "live": 0.957,
    "hold": 0.97,
    "out": 0.979,
    "target": 0.963,
    "selector": ".content-beat--19",
    "title": "UEBER ZAHLFIX"
  },
  {
    "number": 20,
    "id": "contact",
    "parent": "contact",
    "enter": 0.979,
    "live": 0.997,
    "hold": 1,
    "out": 1,
    "target": 1,
    "selector": ".contact-copy",
    "title": "KONTAKT"
  }
].map(Object.freeze));
export const SCENES_BY_ID = Object.freeze(Object.fromEntries(STORY_SCENES.map(s => [s.id, s])));
export const PLATES = Object.freeze({
  hero: {enter: 0, live: 0, hold: .14, out: .149},
  structure: {enter: .149, live: .156, hold: .340, out: .354},
  services: {enter: .348, live: .370, focus: .405, hold: .445, out: .466},
  workflow: {enter: .466, live: .480, travelStart: .490, travelEnd: .550, hold: .610, out: .623},
  reporting: {enter: .610, statement: .622, live: .622, dashboard: .695, hold: .808, out: .820},
  collaboration: {enter: .818, live: .828, hold: .978, out: .989},
  contact: {enter: .979, live: .997, hold: 1, out: 1}
});
export function sceneAt(progress) {
  return [...STORY_SCENES].reverse().find(s => progress >= s.enter) || STORY_SCENES[0];
}
export function nextScene(progress) {
  return STORY_SCENES[sceneAt(progress).number] || STORY_SCENES.at(-1);
}
export function serviceTarget(index) {
  const t = PLATES.services;
  return t.live + (t.hold - t.live) * Math.max(0, Math.min(9, index)) / 9;
}
export function beatOpacity(number, p) {
  const s = STORY_SCENES[number - 1];
  if (p < s.enter || p > s.out) return 0;
  const smooth = t => {t = Math.max(0, Math.min(1, t)); return t*t*(3-2*t);};
  if (p < s.live) return smooth((p - s.enter) / (s.live - s.enter));
  if (p <= s.hold) return 1;
  return 1 - smooth((p - s.hold) / (s.out - s.hold));
}

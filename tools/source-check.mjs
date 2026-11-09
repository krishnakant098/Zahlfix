import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { STORY_SCENES } from '../public/assets/v6/scene-registry.js';
const html=fs.readFileSync('public/index.html','utf8');
let failures=0;
function check(ok,label){console.log(`${ok?'PASS':'FAIL'} ${label}`);if(!ok)failures++;}
const must=['public/assets/v6/scene-registry.js','public/assets/v6/boot.js','public/assets/v6/contact.js','public/assets/v6/components.css','public/assets/v6/fallback.css','public/assets/login-transition.js','netlify/functions/_rate.mjs','netlify/functions/_request.mjs','tools/rotate-password.mjs'];
for(const file of must)check(fs.existsSync(file),file);
for(const match of html.matchAll(/(?:src|href)="(\/[^"?#]*)/g)) {
  const ref=match[1];if(ref==='/')continue;
  check(fs.existsSync(path.join('public',ref)),`local reference: ${ref}`);
}
for(const match of html.matchAll(/data-scene-target="([^"]+)"/g))check(STORY_SCENES.some(s=>s.id===match[1]),`semantic destination: ${match[1]}`);
check((html.match(/data-scene="/g)||[]).length===7,'seven physical containers retained');
check((html.match(/data-service-select="/g)||[]).length===10,'ten interactive service controls');
check(!html.includes('data-jump='),'no hard-coded numeric HTML navigation');
const text=(html.match(/class="story-transcript"[^>]*>([\s\S]*?)<\/ol>/)||[])[1]||'';
const decode=s=>s.replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
const lines=[...text.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map(m=>decode(m[1]));
const approved=JSON.parse(fs.readFileSync('docs/approved-narrative.de.json','utf8'));
check(JSON.stringify(lines)===JSON.stringify(approved),'all twenty approved German narrative beats unchanged');
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
for(const file of [...walk('public/assets/v6'),...walk('netlify'),...walk('tools')].filter(f=>/\.(m?js)$/.test(f))) {
 const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
 check(result.status===0,`JavaScript syntax: ${file}`);
 if(result.status)console.error(result.stderr);
}
if(failures)process.exit(1);
console.log('Source integrity/content checks passed. These are not live-deployment tests.');

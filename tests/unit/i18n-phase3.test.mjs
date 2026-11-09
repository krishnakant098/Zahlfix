import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MESSAGES, getMessage } from '../../public/assets/v6/i18n-content.js';
import { composeEnquiry } from '../../public/assets/v6/contact.js';
const read = path => readFileSync(path,'utf8');
const page = locale => read(`public/${locale}/index.html`);
const approved = JSON.parse(read('docs/approved-narrative.de.json'));
const transcription = html => [...(html.match(/class="story-transcript"[^>]*>([\s\S]*?)<\/ol>/)?.[1] || '').matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)]
  .map(m=>m[1].replace(/<[^>]+>/g,'').replaceAll('&amp;','&').replaceAll('&#39;',"'").trim());

test('P3 independently composes 15-20 without modifying the approved German transcript',()=>{
  assert.deepEqual(transcription(page('de')),approved);
  assert.deepEqual(transcription(page('en')),Array.from({length:20},(_,i)=>MESSAGES.en[`scene.${String(i+1).padStart(2,'0')}.transcript`]));
  for(let i=15;i<=20;i++){
    const key=`scene.${i}.transcript`;
    assert.notEqual(MESSAGES.en[key],MESSAGES.de[key]);
    assert(MESSAGES.en[key].length>20);
  }
});

test('P3 templates expose localised, pre-rendered scene text and accessible names',()=>{
  for(const locale of ['en','de']){
    const html=page(locale);
    for(let i=15;i<=20;i++)assert(html.includes(`data-i18n="scene.${i}.transcript"`));
    for(const key of ['scene.15.line1','scene.15.line2','scene.16.line1','scene.16.line2','scene.17.line1','scene.17.line2','scene.18.word3','scene.19.mission','scene.19.body','scene.20.line1','scene.20.line2','scene.20.body']){
      const rendered=MESSAGES[locale][key].replaceAll('&','&amp;');
      assert(html.includes(`data-i18n="${key}">${rendered}`),`${locale} ${key}`);
    }
    for(const i of [15,16,17,18,19,20])assert(html.includes(`data-i18n-aria-label="scene.${i}.label"`));
    assert.equal((html.match(/data-scene="/g)||[]).length,7);
    assert.equal((html.match(/data-service-select="/g)||[]).length,10);
    assert.equal((html.match(/class="content-beat content-beat--/g)||[]).length>=7,true);
    assert(html.includes('data-i18n="support.head"'));
    assert(html.includes('data-i18n="principles.routeCaption"'));
    assert(!/data-source-copy="Zwei Gr/.test(html));
  }
});

test('P3 form copy and input placeholders are localised at first paint',()=>{
  for(const locale of ['en','de']){
    const html=page(locale);
    for(const key of ['form.namePlaceholder','form.companyPlaceholder','form.emailPlaceholder','form.phonePlaceholder','form.challengePlaceholder']){
      assert(html.includes(`data-i18n-placeholder="${key}"`));
      assert(html.includes(`placeholder="${MESSAGES[locale][key]}`),`${locale} ${key} rendered`);
    }
    assert(html.includes(`data-i18n="form.submit">${MESSAGES[locale]['form.submit']}`));
    assert(html.includes(`href="/${locale}/datenschutz.html"`));
    for(const legal of ['impressum.html','datenschutz.html','agb.html'])assert(html.includes(`href="/${locale}/${legal}"`));
    for(const required of ['contact-name','contact-company','contact-email','contact-challenge'])assert(html.includes(`id="${required}"`));
    assert(html.includes('id="challengeFormStatus" role="status"'));
  }
});

test('P3 outgoing mailto contains the selected language; copying does not imply delivery',()=>{
  const data=new URLSearchParams({name:'Amir',company:'Example GmbH',email:'amir@example.com',phone:'',challenge:'Process handoff'});
  for(const locale of ['de','en']){
    const out=composeEnquiry(data,locale);
    const parsed=new URL(out.url);
    assert.equal(parsed.protocol,'mailto:');
    assert.equal(parsed.pathname,'info@zahlfix.com');
    assert.deepEqual([...parsed.searchParams.keys()],['subject','body']);
    assert.equal(parsed.searchParams.get('subject'),out.subject);
    assert(out.subject.startsWith(MESSAGES[locale]['form.mail.subject']));
    assert(out.body.includes(MESSAGES[locale]['form.mail.company']+': Example GmbH'));
    assert(out.body.includes(MESSAGES[locale]['form.mail.challenge']+':'));
  }
  assert.notEqual(composeEnquiry(data,'en').body,composeEnquiry(data,'de').body);
  const src=read('public/assets/v6/contact.js');
  assert(src.includes("document.addEventListener('zahlfix:locale-change'"));
  assert(src.includes('Opening a mail client is not evidence of delivery'));
  assert(src.includes('form.append(label, output)'));
});

test('P3 dynamically updated principles core uses catalog instead of German constants',()=>{
  const main=read('public/assets/v6/main.js');
  assert(main.includes("getMessage(document.documentElement.lang, aboutAlpha > .2 ? 'principles.core.berlin'"));
  for(const key of ['principles.core.adaptive','principles.core.direct','principles.core.delivery','principles.core.berlin']){
    assert(MESSAGES.en[key]&&MESSAGES.de[key]);
  }
  const ui=read('public/assets/v6/locale-ui.js');
  assert(ui.includes("querySelectorAll('[data-legal-page]')"));
  assert(ui.includes("'placeholder'"));
});

test('P3 six legal pages route to their own language and preserve identity, indexing lock and scope',()=>{
  const sourceTitle={
    'impressum.html':['Impressum','Legal notice'],
    'datenschutz.html':['Datenschutz','Privacy notice'],
    'agb.html':['Allgemeine Gesch\u00e4ftsbedingungen','Terms and conditions']
  };
  for(const [file,[deTitle,enTitle]] of Object.entries(sourceTitle)){
    const de=read(`public/de/${file}`),en=read(`public/en/${file}`);
    assert(de.includes('<html lang="de">')&&en.includes('<html lang="en">'));
    assert(de.includes(deTitle)&&en.includes(enTitle));
    assert(de.includes('name="robots" content="noindex,nofollow"'));
    assert(en.includes('name="robots" content="noindex,nofollow"'));
    assert(de.includes('href="/de/"')&&en.includes('href="/en/"'));
    assert(de.includes(`href="/en/${file}"`)&&en.includes(`href="/de/${file}"`));
    assert(de.includes('Vishnu Gopan Suresh') || file === 'agb.html');
    assert(en.includes('Rheinstra\u00dfe 20'));
    assert(en.includes('qualified legal approval before publication'));
    assert(!en.includes('Rechtliches /'));
    assert(en.includes('action="/logout"'));
  }
  const gdpr=read('public/en/datenschutz.html');
  assert(gdpr.includes('HttpOnly, Secure and SameSite=Strict'));
  assert(gdpr.includes('Netlify Blobs'));
  assert(gdpr.includes('email draft'));
  assert(gdpr.includes('Pexels'));
});

/**
 * EN/DE legal route generator. The approved/source German legal body is copied
 * without editing legal particulars; the English editorial adaptation is a
 * staging draft requiring a qualified German legal review before publication.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
const publicRoot = path.resolve('public');
const pages = {
  'impressum.html': {
    deTitle:'Impressum', enTitle:'Legal notice', number:'01',
    enSection: `<section>
      <h2>Information pursuant to Section 5 DDG (German Digital Services Act)</h2>
      <p><strong>ZahlFix UG (haftungsbeschr\u00e4nkt) i. G.</strong><br>Rheinstra\u00dfe 20<br>12161 Berlin<br>Germany</p>
      <p>Represented by its managing director:<br><strong>Vishnu Gopan Suresh</strong></p>
      <h2>Contact</h2>
      <p>Phone: <a href="tel:+4915152088398">+49 151 520 88 398</a><br>Email: <a href="mailto:info@zahlfix.com">info@zahlfix.com</a></p>
      <h2>Services</h2>
      <p>ZahlFix combines business consulting with technical implementation. Its services include digital transformation, process improvement, automation, custom software, AI applications, and technical implementation and support. The precise scope of services is set out in the relevant proposal or agreement.</p>
      <h2>Liability for external links</h2>
      <p>Operators of external websites linked from this site are responsible for their own content. Links will be removed when we become aware of unlawful content.</p>
      <h2>Copyright</h2>
      <p>Content and creative works produced by ZahlFix for this website are subject to German copyright law. Uses beyond statutory exceptions require prior consent from the relevant rights holder.</p>
      </section>`
  },
  'datenschutz.html': {
    deTitle:'Datenschutz', enTitle:'Privacy notice', number:'02',
    enSection:`<section>
      <p><strong>Last updated: September 2026</strong></p>
      <h2>1. Data controller</h2>
      <p><strong>ZahlFix UG (haftungsbeschr\u00e4nkt) i. G.</strong><br>Represented by managing director Vishnu Gopan Suresh<br>Rheinstra\u00dfe 20, 12161 Berlin, Germany<br>Phone: +49 151 520 88 398<br>Email: <a href="mailto:info@zahlfix.com">info@zahlfix.com</a></p>
      <h2>2. Website access and server logs</h2>
      <p>When you visit this website, technically necessary connection data may be processed, including your IP address, time of access, requested resources, browser information and status codes. These data are used to deliver the website securely, investigate errors and prevent misuse.</p>
      <h2>3. Password-protected access</h2>
      <p>Following successful PIN entry, the website uses a technically necessary session cookie for access control. The cookie does not contain the PIN and is set with HttpOnly, Secure and SameSite=Strict attributes. It is not retained for a persistent 'remember me' function; normally it ends with your browser session, and an additional server-side expiry applies. In production it is transmitted over HTTPS only.</p>
      <p>To limit automated PIN attacks, failed login attempts are temporarily evaluated. The application uses a cryptographic hash of the IP address to maintain counters in Netlify Blobs. These counters are cleared following a successful login and attempts outside the evaluation window are disregarded. Netlify may also apply infrastructure-level rate limiting.</p>
      <h2>4. Contact and enquiry form</h2>
      <p>The enquiry form requests your name, company, work email, optional phone number and a description of your project or challenge. In the current version, submitting the form opens an email draft in your own email application; the website does not save the form fields in its own database. If you send the email to us, we process your information to respond to your enquiry and, where applicable, take steps requested before entering into a contract.</p>
      <h2>5. External images</h2>
      <p>The website may load images from Pexels. Loading these files may establish a technical connection to Pexels. Images can be served locally for a more privacy-conscious production setup.</p>
      <h2>6. Your rights</h2>
      <p>Subject to the GDPR and its conditions, you may have rights to access, rectification, erasure, restriction of processing, portability and objection. You may also lodge a complaint with the competent data protection supervisory authority.</p>
      <h2>7. Security</h2>
      <p>We use appropriate technical and organisational safeguards. Password protection does not provide end-to-end encryption for sensitive files. Please do not send particularly sensitive or confidential documents over unsecured contact channels.</p>
      </section>`
  },
  'agb.html': {
    deTitle:'Allgemeine Gesch\u00e4ftsbedingungen', enTitle:'Terms and conditions', number:'03',
    enSection:`<section>
      <p><strong>Last updated: September 2026</strong></p>
      <h2>1. Scope</h2>
      <p>These terms apply to agreements between ZahlFix UG (haftungsbeschr\u00e4nkt) i. G., Rheinstra\u00dfe 20, 12161 Berlin, Germany, and its business customers. Individual agreements and specific proposals take precedence over these general terms.</p>
      <h2>2. Services</h2>
      <p>ZahlFix offers IT consulting, digital transformation, process improvement, automation, software design and development, AI applications and agents, software implementation and technical support. The precise scope of each engagement is defined in the relevant proposal or contract.</p>
      <h2>3. Customer cooperation</h2>
      <p>Customers must provide documents and information required for the agreed services in full and on time and remain responsible for factual accuracy and necessary approvals.</p>
      <h2>4. Fees and duration</h2>
      <p>Fees, payment terms, performance periods and termination rules are set out in the respective proposal or individual agreement.</p>
      <h2>5. Confidentiality and data protection</h2>
      <p>Both parties must treat confidential business information confidentially and protect it appropriately. Personal data are processed in accordance with applicable data protection laws.</p>
      <h2>6. Final provisions</h2>
      <p>German law applies to the extent legally permitted. Mandatory statutory provisions remain unaffected.</p>
      <p class="review-note">Operator notice: These website terms were technically adapted for the password-protected website. They require final review by qualified legal counsel before public use.</p>
      </section>`
  }
};
function escapeText(text){return String(text).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');}
function render({lang,page,data,deSection}){
  const en = lang === 'en';
  const title = en ? data.enTitle : data.deTitle;
  const label = en ? 'LEGAL / ' : 'RECHTLICHES / ';
  const section = en ? data.enSection : deSection;
  const back = en ? 'BACK TO SITE' : 'ZUR\u00dcCK';
  const url = `https://zahlfix.com/${lang}/${page}`;
  const legalLinks = {
    'impressum.html': en ? 'LEGAL NOTICE' : 'IMPRESSUM',
    'datenschutz.html': en ? 'PRIVACY' : 'DATENSCHUTZ',
    'agb.html': en ? 'TERMS' : 'AGB'
  };
  const links = Object.entries(legalLinks).filter(([id])=>id!==page).map(([id,text])=>`<a href="/${lang}/${id}">${text}</a>`).join('');
  const other = en ? 'de' : 'en';
  return `<!doctype html><html lang="${lang}"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#121212">
<meta name="robots" content="noindex,nofollow"><title>${escapeText(title)} \u2014 ZahlFix</title>
<link rel="canonical" href="${url}"><link rel="alternate" hreflang="de" href="https://zahlfix.com/de/${page}"><link rel="alternate" hreflang="en" href="https://zahlfix.com/en/${page}">
<link rel="stylesheet" href="/assets/legal.css"></head>
<body><header><a href="/${lang}/" aria-label="ZahlFix"><img src="/assets/zahlfix-z-logo.png" alt="" aria-hidden="true"><b>ZAHLFIX<span>.</span></b></a>
<div class="legal-header-actions"><nav class="legal-language" aria-label="Language / Sprache"><a lang="en" hreflang="en" href="/en/${page}" ${en?'aria-current="page"':''}>EN</a><span aria-hidden="true">/</span><a lang="de" hreflang="de" href="/de/${page}" ${!en?'aria-current="page"':''}>DE</a></nav><a href="/${lang}/#contact">${back}</a></div></header>
<main><p class="eyebrow">${label}${data.number}</p><h1>${escapeText(title)}</h1>${section}
${en?'<p class="legal-staging-note">English-language editorial adaptation for review. Obtain qualified legal approval before publication.</p>':''}
</main><footer>${links}<form action="/logout" method="post"><button type="submit">${en?'LOCK SESSION':'SPERREN'}</button></form></footer></body></html>\n`;
}
for (const [page,data] of Object.entries(pages)) {
  const source = await readFile(path.join(publicRoot,page),'utf8');
  const match = source.match(/<section>([\s\S]*?)<\/section>/);
  if (!match) throw new Error(`German legal section not found: ${page}`);
  const deSection = '<section>' + match[1] + '</section>';
  for (const lang of ['de','en']) {
    const dir = path.join(publicRoot,lang);
    await mkdir(dir,{recursive:true});
    await writeFile(path.join(dir,page), render({lang,page,data,deSection}));
    console.log(`${lang.toUpperCase()} legal route: /${lang}/${page}`);
  }
}

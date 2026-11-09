/** Mailto-only contact experience; no network submission or storage. */
import { getMessage } from './i18n-content.js';
const safeLocale = value => value === 'en' ? 'en' : 'de';
const translation = locale => key => getMessage(safeLocale(locale), key);
export function composeEnquiry(values, locale = 'de') {
  const t = translation(locale);
  const clean = key => String(values.get(key) || '').trim();
  const name = clean('name'), company = clean('company');
  const subject = `${t('form.mail.subject')}${company || name}`;
  const body = [
    `${t('form.mail.name')}: ${name}`,
    `${t('form.mail.company')}: ${company}`,
    `${t('form.mail.email')}: ${clean('email')}`,
    `${t('form.mail.phone')}: ${clean('phone') || '\u2014'}`,
    '', `${t('form.mail.challenge')}:`, clean('challenge')
  ].join('\n');
  return { subject, body, url: `mailto:info@zahlfix.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}` };
}
export function initContactForm() {
  const form = document.getElementById('challengeForm');
  const status = document.getElementById('challengeFormStatus');
  if (!form || !status) return;
  const locale = () => document.documentElement.lang === 'en' ? 'en' : 'de';
  const t = key => getMessage(locale(), key);
  const validate = () => {
    if (!form.reportValidity()) { status.textContent = t('form.status.invalid'); return false; }
    const data = new FormData(form);
    if (['name', 'company', 'challenge'].some(key => !String(data.get(key) || '').trim())) {
      status.textContent = t('form.status.blank');
      return false;
    }
    return true;
  };
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!validate()) return;
    const enquiry = composeEnquiry(new FormData(form), locale());
    status.textContent = t('form.status.mail');
    // Opening a mail client is not evidence of delivery. Keep entered values.
    window.location.href = enquiry.url;
  });
  document.getElementById('copyEnquiry')?.addEventListener('click', async () => {
    if (!validate()) return;
    const {subject, body} = composeEnquiry(new FormData(form), locale());
    const text = `${t('form.mail.to')}: info@zahlfix.com\n${t('form.mail.subjectLabel')}: ${subject}\n\n${body}`;
    try {
      await navigator.clipboard.writeText(text);
      status.textContent = t('form.status.copied');
    } catch {
      let output = document.getElementById('enquiryCopyText');
      if (!output) {
        const label = document.createElement('label');
        label.setAttribute('for', 'enquiryCopyText');
        label.id = 'enquiryCopyLabel';
        output = document.createElement('textarea');
        output.id = 'enquiryCopyText'; output.readOnly = true; output.rows = 8;
        form.append(label, output);
      }
      document.getElementById('enquiryCopyLabel').textContent = t('form.status.manualLabel');
      output.value = text; output.focus(); output.select();
      status.textContent = t('form.status.noClipboard');
    }
  });
  // Avoid showing a German status on the English site (or vice versa) after switching.
  document.addEventListener('zahlfix:locale-change', () => {
    status.textContent = '';
    const label = document.getElementById('enquiryCopyLabel');
    if (label) label.textContent = t('form.status.manualLabel');
    const manual = document.getElementById('enquiryCopyText');
    if (manual) manual.value = '';
  });
  form.querySelector('[type="submit"]').disabled = false;
}

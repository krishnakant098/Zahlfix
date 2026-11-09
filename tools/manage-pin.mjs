/** Operator-only PIN management tool. Never deployed as an HTTP function. Dry-run is the default. */
import { getStore } from '@netlify/blobs';
import { buildConfig, STORE_NAME, CONFIG_KEY, verifyPin, pinPolicyValid } from '../netlify/functions/_auth.mjs';
import readline from 'node:readline';
import { Writable } from 'node:stream';

const args = process.argv.slice(2);
const allowed = arg => arg === '--apply' || arg === '--pin-stdin' || arg.startsWith('--confirm-site=');
if (args.some(arg => !allowed(arg))) throw new Error('Unknown option. PINs must never appear in command-line arguments.');
const siteID = process.env.NETLIFY_SITE_ID;
const token = process.env.NETLIFY_AUTH_TOKEN;
if (!siteID || !token) throw new Error('Provide NETLIFY_SITE_ID and NETLIFY_AUTH_TOKEN through your secure operator environment.');

const store = getStore({ name: STORE_NAME, siteID, token, consistency: 'strong' });
const current = await store.getWithMetadata(CONFIG_KEY, { type: 'json', consistency: 'strong' });
if (!current?.etag || current.data?.schema !== 3) throw new Error('Existing auth configuration not found or invalid. Use first setup or auth:bootstrap for a new site.');
console.log(JSON.stringify({
  mode: args.includes('--apply') ? 'apply' : 'dry-run',
  siteID,
  store: STORE_NAME,
  schema: current.data.schema,
  authMode: current.data.authMode || 'legacy-schema3',
  createdAt: current.data.createdAt,
  rotatedAt: current.data.rotatedAt || null
}, null, 2));

if (!args.includes('--apply')) {
  console.log('No changes. PIN rotation requires --apply --confirm-site=<NETLIFY_SITE_ID>.');
} else {
  if (!args.includes(`--confirm-site=${siteID}`)) throw new Error('Explicit site confirmation is required.');

  async function secretPrompt(label) {
    process.stdout.write(label);
    const sink = new Writable({ write(_chunk, _encoding, callback) { callback(); } });
    const rl = readline.createInterface({ input: process.stdin, output: sink, terminal: true });
    return new Promise((resolve, reject) => {
      rl.once('SIGINT', () => { rl.close(); reject(new Error('Cancelled')); });
      rl.question('', value => { rl.close(); process.stdout.write('\n'); resolve(value); });
    });
  }

  let pin;
  if (args.includes('--pin-stdin')) {
    if (process.stdin.isTTY) throw new Error('--pin-stdin requires a pipe from a secure secret source.');
    let value = '';
    for await (const chunk of process.stdin) {
      value += chunk;
      if (value.length > 64) throw new Error('Input too large.');
    }
    pin = value.replace(/\r?\n$/, '');
  } else {
    if (!process.stdin.isTTY) throw new Error('Use --pin-stdin for non-interactive input.');
    pin = await secretPrompt('New 4-digit PIN (input hidden): ');
    const confirmation = await secretPrompt('Confirm 4-digit PIN: ');
    if (pin !== confirmation) throw new Error('PINs do not match.');
  }
  if (!pinPolicyValid(pin)) throw new Error('PIN must be exactly four numeric digits.');

  const replacement = buildConfig(pin);
  replacement.createdAt = current.data.createdAt;
  replacement.rotatedAt = new Date().toISOString();
  replacement.migratedFrom = current.data.authMode || 'legacy-schema3';
  const result = await store.set(CONFIG_KEY, JSON.stringify(replacement), { onlyIfMatch: current.etag });
  if (!result.modified) throw new Error('Configuration changed concurrently. Nothing overwritten. Start again.');
  const verified = await store.get(CONFIG_KEY, { type: 'json', consistency: 'strong' });
  if (verified?.passwordVersion !== replacement.passwordVersion || !verifyPin(pin, verified)) {
    throw new Error('PIN rotation read-back failed. Treat this as an incident; do not delete the config.');
  }
  pin = '';
  console.log(JSON.stringify({ rotated: true, siteID, at: replacement.rotatedAt, previousSessionsInvalidated: true }));
  console.log('Verify a private-window login, reject the old PIN, and remove the operator token from this shell.');
}

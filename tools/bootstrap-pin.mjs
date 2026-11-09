/** Operator-only first-config bootstrap. Creates the known initial PIN 6367 only when no config exists. */
import { getStore } from '@netlify/blobs';
import { buildConfig, DEFAULT_INITIAL_PIN, STORE_NAME, CONFIG_KEY, verifyPin } from '../netlify/functions/_auth.mjs';

const args = process.argv.slice(2);
const allowed = arg => arg === '--apply' || arg.startsWith('--confirm-site=');
if (args.some(arg => !allowed(arg))) throw new Error('Unknown option.');
const siteID = process.env.NETLIFY_SITE_ID;
const token = process.env.NETLIFY_AUTH_TOKEN;
if (!siteID || !token) throw new Error('Provide NETLIFY_SITE_ID and NETLIFY_AUTH_TOKEN through your secure operator environment.');
const store = getStore({ name: STORE_NAME, siteID, token, consistency: 'strong' });
const current = await store.getWithMetadata(CONFIG_KEY, { type: 'json', consistency: 'strong' });

if (current?.data) {
  console.log(JSON.stringify({
    mode: args.includes('--apply') ? 'apply' : 'dry-run',
    siteID,
    store: STORE_NAME,
    configured: true,
    schema: current.data.schema,
    initialPinMatches: verifyPin(DEFAULT_INITIAL_PIN, current.data)
  }, null, 2));
  console.log('No changes. A configuration already exists. Use npm run auth:pin for an intentional rotation.');
} else if (!args.includes('--apply')) {
  console.log(JSON.stringify({ mode: 'dry-run', siteID, store: STORE_NAME, configured: false, initialPin: DEFAULT_INITIAL_PIN }, null, 2));
  console.log('No changes. Bootstrap requires --apply --confirm-site=<NETLIFY_SITE_ID>.');
} else {
  if (!args.includes(`--confirm-site=${siteID}`)) throw new Error('Explicit site confirmation is required.');
  const config = buildConfig(DEFAULT_INITIAL_PIN);
  config.bootstrapPin = true;
  const result = await store.set(CONFIG_KEY, JSON.stringify(config), { onlyIfNew: true });
  if (!result.modified) throw new Error('Configuration appeared concurrently. Nothing overwritten.');
  const verified = await store.get(CONFIG_KEY, { type: 'json', consistency: 'strong' });
  if (!verifyPin(DEFAULT_INITIAL_PIN, verified)) throw new Error('Bootstrap read-back failed.');
  console.log(JSON.stringify({ bootstrapped: true, siteID, initialPin: DEFAULT_INITIAL_PIN, previousSessionsInvalidated: false }));
}

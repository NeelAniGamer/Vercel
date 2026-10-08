/**
 * Sarvam AI — one chat completion call.
 *
 * Run:  node scripts/sarvam-test.mjs      (from the Traffic/ directory)
 *
 * The API key is read from the environment and is NEVER printed, logged, or
 * written to disk by this script. If it is missing, the script says so and
 * exits — it does not fall back to a placeholder, because a placeholder that
 * appears to work is worse than a clear failure.
 */
import { SarvamAIClient } from 'sarvamai';

// Traffic/.env holds SARVAM_API_KEY=...
// Node does not read .env on its own before v20.6's --env-file, and this project
// has no dotenv dependency, so the one line that matters is parsed here. Kept
// deliberately tiny: no dependency added for a single key.
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const envPath = join(here, '..', '.env');

if (!process.env.SARVAM_API_KEY && existsSync(envPath)) {
  for (const raw of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = /^SARVAM_API_KEY\s*=\s*(.*)$/.exec(raw.trim());
    if (m && m[1]) {
      process.env.SARVAM_API_KEY = m[1].replace(/^["']|["']$/g, '');
      break;
    }
  }
}

const apiKey = process.env.SARVAM_API_KEY;
if (!apiKey) {
  console.error('SARVAM_API_KEY is not set.');
  console.error('Add it to Traffic/.env as:  SARVAM_API_KEY=<your key>');
  process.exit(1);
}

const client = new SarvamAIClient({ apiKey });

const response = await client.chat.completions({
  model: 'sarvam-105b-conversations',
  messages: [
    { role: 'system', content: 'You are a concise assistant.' },
    { role: 'user', content: 'Reply with exactly one short sentence confirming you are connected.' }
  ]
});

console.log(response.choices?.[0]?.message?.content ?? JSON.stringify(response, null, 2));
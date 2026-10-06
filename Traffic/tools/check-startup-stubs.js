#!/usr/bin/env node
/**
 * Startup-stub integrity check.
 *
 * The five startup stubs (lambo/env/bus/auto + cert_assets) must stay tiny and
 * must not drift back into inlining binary as base64. That regression is
 * expensive and silent: the game still boots, so nothing else notices, but the
 * page quietly re-gains tens of megabytes of JavaScript to download, parse and
 * main-thread-decode before the first frame.
 *
 * Two failures matter:
 *   1. a stub contains `base64,`            -> payload regression
 *   2. a stub assigns a path that is absent  -> silent broken asset at runtime
 *
 * (2) is the one that bit us: cert_assets.js pointed CERT_LOGO_1 at a 4.33 MB
 * 2282x1856 upscale of a logo the page already had at 512px, and the game
 * happily rendered it at 24px for the rest of time.
 *
 *   node Traffic/tools/check-startup-stubs.js
 *
 * Exits non-zero on any problem. Deliberately dependency-free so it can run in
 * CI before/independently of any npm install.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const TRAFFIC = path.resolve(__dirname, '..');
const MAX_STUB_BYTES = 8192;

// file -> how to pull the assigned paths out of it
const STUBS = [
  { file: 'cert_assets.js', re: /CERT_LOGO_\d\s*=\s*'([^']+)'/g },
  { file: 'lambo.js', re: /MODELS\['lambo'\]\s*=\s*'([^']+)'/g },
  { file: 'env.js', re: /MODELS\['env'\]\s*=\s*'([^']+)'/g },
  { file: 'bus.js', re: /MODELS\['bus'\]\s*=\s*'([^']+)'/g },
  { file: 'auto.js', re: /MODELS\['auto'\]\s*=\s*'([^']+)'/g },
];

// Aliases like CERT_LOGO_3 = CERT_LOGO_1 assign no literal path; ignore those.
const ALIAS = /CERT_LOGO_\d\s*=\s*CERT_LOGO_\d/;

// Matches a real inline payload — a long base64 run following a data URI
// prefix — not prose that merely mentions base64 in a comment. Kept identical
// to the check in pw_test.js so the two gates cannot disagree.
const INLINE_PAYLOAD = /base64,[A-Za-z0-9+/]{200,}/;

let failures = 0;

function fail(msg) {
  console.error('FAIL ' + msg);
  failures++;
}

for (const stub of STUBS) {
  const fp = path.join(TRAFFIC, stub.file);
  if (!fs.existsSync(fp)) {
    fail(`${stub.file} is missing`);
    continue;
  }

  const src = fs.readFileSync(fp, 'utf8');
  const bytes = Buffer.byteLength(src);

  if (INLINE_PAYLOAD.test(src)) {
    fail(`${stub.file} contains an inline base64 payload (${bytes} bytes)`);
  }
  if (bytes > MAX_STUB_BYTES) {
    fail(`${stub.file} is ${bytes} bytes, expected <= ${MAX_STUB_BYTES} (path stub)`);
  }

  // Strip alias lines before matching so CERT_LOGO_3 = CERT_LOGO_1 is not read
  // as a path assignment.
  const literal = src.split('\n').filter((l) => !ALIAS.test(l)).join('\n');
  const targets = [...literal.matchAll(stub.re)].map((m) => m[1]);

  if (!targets.length) {
    fail(`${stub.file} assigns no literal path — did the stub format change?`);
  }
  for (const t of targets) {
    const target = path.join(TRAFFIC, t);
    if (!fs.existsSync(target)) {
      fail(`${stub.file} -> ${t} does not exist`);
    } else {
      const kb = (fs.statSync(target).size / 1024).toFixed(1);
      console.log(`  ok  ${stub.file} -> ${t} (${kb} KB)`);
    }
  }
  console.log(`  ok  ${stub.file} is ${bytes} bytes, no base64`);
}

if (failures) {
  console.error(`\n${failures} startup-stub problem(s).`);
  process.exit(1);
}
console.log('\nStartup stubs OK: small, base64-free, all targets present.');

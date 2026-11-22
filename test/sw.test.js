import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
const listed = [...sw.matchAll(/'([^']+\.(?:js|css|html|png|webmanifest))'/g)].map(m => m[1]);

test('service worker precaches every app file, and only files that exist', () => {
  for (const dir of ['core', 'data', 'store', 'ui']) {
    for (const f of readdirSync(new URL(`../src/${dir}/`, import.meta.url))) {
      if (f.endsWith('.js')) assert.ok(listed.includes(`src/${dir}/${f}`), `sw.js is missing src/${dir}/${f}`);
    }
  }
  for (const f of listed) assert.ok(existsSync(new URL(`../${f}`, import.meta.url)), `sw.js lists missing file ${f}`);
});

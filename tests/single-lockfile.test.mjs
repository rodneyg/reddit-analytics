import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

const forbiddenLockfiles = ['pnpm-lock.yaml', 'yarn.lock', 'bun.lock', 'bun.lockb'];

test('npm is the only package manager lockfile', () => {
  const present = forbiddenLockfiles.filter((file) => existsSync(new URL(`../${file}`, import.meta.url)));
  assert.deepEqual(present, [], `unexpected secondary lockfile(s): ${present.join(', ')}`);
});

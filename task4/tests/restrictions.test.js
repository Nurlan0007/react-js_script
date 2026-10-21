import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => entry.isDirectory() ? sourceFiles(new URL(`${entry.name}/`, directory)) : [new URL(entry.name, directory)]));
  return files.flat().filter((file) => /\.[jt]sx?$/.test(file.pathname));
}

test('components use only permitted hooks and keep storage behind the API', async () => {
  const files = await sourceFiles(new URL('../src/', import.meta.url));
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    const hooks = [...source.matchAll(/\b(use[A-Z]\w*)\s*\(/g)].map((match) => match[1]);
    assert.ok(hooks.every((name) => ['useState', 'useEffect'].includes(name)), `${file.pathname}: forbidden/custom hook`);
    assert.doesNotMatch(source, /\bfunction\s+use[A-Z]|\b(?:const|let)\s+use[A-Z]/);
    if (!file.pathname.includes('/api/')) assert.doesNotMatch(source, /\b(?:localStorage|sessionStorage)\b/);
    assert.doesNotMatch(source, /\bdebounce\s*\(/);
  }
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  for (const dependency of Object.keys(pkg.dependencies)) assert.ok(!/axios|swr|query|redux|zustand/i.test(dependency), dependency);
});

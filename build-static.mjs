// Publish only browser assets. Authoring tools, QA captures and content sources
// remain in Git, but are never served by the static production deployment.
import {cp, mkdir, readdir, rm, stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

const root = path.dirname(fileURLToPath(import.meta.url));
const output = path.join(root, 'dist');
assert.equal(path.dirname(output), root);
assert.equal(path.basename(output), 'dist');
await rm(output, {recursive: true, force: true});
await mkdir(output);

for (const entry of await readdir(root, {withFileTypes: true})) {
  if (entry.isFile() && /\.(?:html|css|js)$/.test(entry.name)) {
    await cp(path.join(root, entry.name), path.join(output, entry.name));
  }
}
for (const directory of ['products', 'solutions', 'assets']) {
  await cp(path.join(root, directory), path.join(output, directory), {recursive: true});
}

async function listFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, {withFileTypes: true})) {
    const location = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(location));
    else files.push(location);
  }
  return files;
}
const files = await listFiles(output);
assert.equal(files.filter(file => file.endsWith('.html')).length, 36);
for (const file of files) {
  assert.ok(!/\.(?:mjs|py|md)$/.test(file), `Authoring source leaked into deploy output: ${file}`);
  assert.ok(!path.basename(file).startsWith('.'), `Hidden file leaked into deploy output: ${file}`);
}
let bytes = 0;
for (const file of files) bytes += (await stat(file)).size;
console.log(`Static release ready: ${files.length} files, 36 pages, ${(bytes / 1024 / 1024).toFixed(2)} MiB in dist/.`);

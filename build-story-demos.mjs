/* Keep the two hand-authored landing pages in sync with the shared demo renderer. */
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {renderStoryDemo,loadProductScene,loadSolutionScene} from './demo-scenes.mjs';

const root=path.dirname(fileURLToPath(import.meta.url));
const marker=/<!-- STORY-DEMO:START -->[\s\S]*?<!-- STORY-DEMO:END -->/g;
const pages=await Promise.all([
  {file:'index.html',scene:loadProductScene('hire')},
  {file:'enterprise.html',scene:loadSolutionScene('enterprise')}
].map(async({file,scene})=>{
  const filename=path.join(root,file);
  const html=await readFile(filename,'utf8');
  assert.equal([...html.matchAll(marker)].length,1,`${file}: expected one demo build slot`);
  const demo=renderStoryDemo(await scene);
  return {filename,html:html.replace(marker,()=>`<!-- STORY-DEMO:START -->\n${demo}\n    <!-- STORY-DEMO:END -->`)};
}));
for(const page of pages)await writeFile(page.filename,page.html);
console.log('Updated animated story demos on the homepage and enterprise page.');

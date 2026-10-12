/* Static, fictional storyboards. No live product or AI connection is implied. */
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const cache=new Map();
async function loadScene(file,slug){
 if(!cache.has(file))cache.set(file,readFile(new URL(`./content/${file}`,import.meta.url),'utf8').then(JSON.parse));
 const scene=(await cache.get(file)).find(x=>x.slug===slug);
 assert.ok(scene,`Missing fictional demo ${file}: ${slug}`);
 return scene;
}
export const loadProductScene=slug=>loadScene('demo-products.json',slug);
export const loadSolutionScene=slug=>loadScene('demo-solutions.json',slug);

export function validateScene(scene){
 assert.match(scene.slug,/^[a-z]+(?:-[a-z]+)*$/);
 assert.ok(['conversation','checklist','request','goals','insight','draft'].includes(scene.mode));
 for(const key of ['product','title','intro','record','prompt'])assert.ok(typeof scene[key]==='string'&&scene[key].trim(),`${scene.slug}: ${key}`);
 for(const key of ['initials','name','role'])assert.ok(scene.person?.[key]?.trim());
 assert.equal(scene.sources.length,3);assert.equal(scene.frames.length,4);assert.equal(scene.manual.items.length,4);
 assert.ok(scene.manual.title.trim()&&scene.manual.outcome.trim());
 for(const frame of scene.frames){
  for(const key of ['label','activity','heading','body','outcome'])assert.ok(frame[key]?.trim(),`${scene.slug}: frame ${key}`);
  assert.ok(frame.message.author.trim()&&frame.message.text.trim());assert.equal(frame.items.length,3);
  for(const item of frame.items){assert.ok(item.label.trim()&&item.detail.trim());assert.ok(['ready','active','pending'].includes(item.status));}
 }
 return scene;
}
const symbol=status=>status==='ready'?'✓':status==='active'?'→':'○';
const itemView=(item,mode,i)=>`<li class="story-item story-item-${item.status}"><span class="story-item-symbol" aria-hidden="true">${mode==='insight'?String(i+1).padStart(2,'0'):symbol(item.status)}</span><div><strong>${escape(item.label)}</strong><span>${escape(item.detail)}</span></div><span class="story-item-state">${item.status==='ready'?'Ready':item.status==='active'?'In progress':'Pending'}</span></li>`;
export function renderStoryDemo(input,prefix=''){
 const scene=validateScene(input);
 return `<section class="story-demo" id="story-demo" aria-labelledby="story-demo-title" data-story-demo data-scene="${escape(scene.slug)}" data-mode="${scene.mode}">
<div class="story-demo-wrap">
<div class="story-heading"><div><p class="story-eyebrow">A little less chasing. A little more clarity.</p><h2 id="story-demo-title">${escape(scene.title)}</h2></div><div><p>${escape(scene.intro)}</p><p class="story-disclosure">Fictional product walkthrough. Sample people and actions. No live messages, integrations or AI calls.</p></div></div>
<div class="story-toolbar" data-story-controls hidden><div class="story-playback"><button type="button" data-story-play aria-label="Pause animated demo">Pause <span aria-hidden="true">Ⅱ</span></button><button type="button" data-story-replay>Replay <span aria-hidden="true">↺</span></button></div><p data-story-status>Ready to play when in view.</p><div class="story-navigation"><button type="button" data-story-prev aria-label="Previous demo step" disabled>← <span>Back</span></button><button type="button" data-story-next aria-label="Next demo step"><span>Next</span> →</button></div></div>
<div class="story-board">
<div class="story-connected"><div class="story-side-label"><strong>With Hirebrew</strong><span>Context moves with the work</span></div>
<div class="story-window"><div class="story-appbar"><span><img src="${escape(prefix)}assets/brand/mark.svg" alt="" width="22" height="22">${escape(scene.product)}</span><span class="story-appbar-note">Illustrative workspace</span></div>
<div class="story-person"><span class="story-avatar" aria-hidden="true">${escape(scene.person.initials)}</span><div><strong>${escape(scene.person.name)}</strong><span>${escape(scene.person.role)}</span></div><span class="story-record">${escape(scene.record)}</span></div>
<div class="story-prompt">${escape(scene.prompt)}</div><div class="story-sources" aria-label="Context in this example">${scene.sources.map(x=>`<span>${escape(x)}</span>`).join('')}</div>
<div class="story-stage">${scene.frames.map((frame,i)=>`<article class="story-frame" data-story-frame${i?' hidden':''} aria-labelledby="story-frame-title-${i}"><div class="story-frame-heading"><span>${escape(frame.activity)}</span><h3 id="story-frame-title-${i}">${escape(frame.heading)}</h3><p>${escape(frame.body)}</p></div><ul class="story-items">${frame.items.map((x,j)=>itemView(x,scene.mode,j)).join('')}</ul><div class="story-message"><span class="story-message-mark" aria-hidden="true">${scene.mode==='draft'?'b.':'↳'}</span><div><strong>${escape(frame.message.author)}</strong><p>${escape(frame.message.text)}</p></div></div></article>`).join('\n')}</div>
<div class="story-progress" data-story-controls hidden aria-label="Demo steps">${scene.frames.map((frame,i)=>`<button type="button" data-story-step="${i}" aria-label="Step ${i+1}: ${escape(frame.label)}"${i===0?' aria-current="step"':''}><span class="story-progress-track" aria-hidden="true"><span></span></span><span>${escape(frame.label)}</span></button>`).join('')}</div></div>
<div class="story-result"><span aria-hidden="true">✓</span><div><span>In this example</span><strong data-story-outcome>${escape(scene.frames[0].outcome)}</strong></div></div></div>
<aside class="story-scattered" aria-labelledby="story-manual-title"><div class="story-side-label"><strong>Scattered workflow</strong><span>The same task, in separate places</span></div><div class="story-manual-window"><div class="story-manual-top"><h3 id="story-manual-title">${escape(scene.manual.title)}</h3><p>A familiar pattern, not a comparison with another provider.</p></div><ol class="story-manual-list">${scene.manual.items.map((text,i)=>`<li data-manual-step="${i}"${i===0?' class="is-current"':''}><span aria-hidden="true">${i+1}</span><p>${escape(text)}</p></li>`).join('')}</ol><div class="story-manual-note"><span aria-hidden="true">↔</span><p>Someone has to put the story back together.</p></div></div><div class="story-result story-result-manual"><span aria-hidden="true">↻</span><div><span>Still to resolve</span><strong>${escape(scene.manual.outcome)}</strong></div></div></aside>
</div><p class="story-footnote">A scripted illustration, not a customer result or a promise of production availability. People review decisions.</p><p class="sr-only" data-story-announcement role="status" aria-live="polite" aria-atomic="true"></p>
<noscript><details class="story-transcript"><summary>Read the four-step walkthrough</summary><ol>${scene.frames.map(x=>`<li><strong>${escape(x.label)}: ${escape(x.heading)}</strong><p>${escape(x.body)} ${escape(x.message.text)}</p></li>`).join('')}</ol></details></noscript>
<script type="application/json" data-story-data>${JSON.stringify({labels:scene.frames.map(x=>x.label),outcomes:scene.frames.map(x=>x.outcome)}).replace(/</g,'\\u003c')}</script>
</div></section>`;
}

import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import {loadProductScene,loadSolutionScene,renderStoryDemo,validateScene} from './demo-scenes.mjs';

const root=path.dirname(fileURLToPath(import.meta.url));
const read=file=>readFile(path.join(root,file),'utf8');
const productScenes=JSON.parse(await read('content/demo-products.json'));
const solutionScenes=JSON.parse(await read('content/demo-solutions.json'));
const products=(await Promise.all(['products-core.json','products-growth.json'].map(async file=>JSON.parse(await read(`content/${file}`))))).flat();
const solutions=(await Promise.all(['solutions-business.json','solutions-industries-a.json','solutions-industries-b.json'].map(async file=>JSON.parse(await read(`content/${file}`))))).flat();
const scenes=[...productScenes,...solutionScenes];
assert.equal(scenes.length,30,'Expected six product scenes and 24 solution scenes');
for(const [actual,expected,name] of [[productScenes,products,'products'],[solutionScenes,solutions,'solutions']]){
 assert.equal(new Set(actual.map(scene=>scene.slug)).size,actual.length,`${name}: duplicate scene slugs`);
 assert.deepEqual(actual.map(scene=>scene.slug).sort(),expected.map(item=>item.slug).sort(),`${name}: every page needs a scene`);
}
const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
for(const scene of scenes){
 validateScene(scene);
 assert.ok(scene.sources.every(source=>typeof source==='string'&&source.trim()),`${scene.slug}: context labels must be text`);
 assert.ok(scene.manual.items.every(item=>typeof item==='string'&&item.trim()),`${scene.slug}: manual steps must be text`);
 assert.equal(new Set(scene.frames.map(frame=>frame.label)).size,4,`${scene.slug}: four distinct stage labels required`);
 assert.equal(new Set(scene.frames.map(frame=>frame.heading)).size,4,`${scene.slug}: four distinct story moments required`);
 assert.equal(new Set(scene.frames.map(frame=>frame.outcome)).size,4,`${scene.slug}: every stage needs its own outcome`);
 assert.ok(!/[\u2013\u2014]/.test(JSON.stringify(scene)),`${scene.slug}: use plain punctuation in demo copy`);
}
assert.equal(new Set(scenes.map(scene=>scene.title)).size,30,'Every scene needs a tailored title');
assert.equal(new Set(scenes.map(scene=>scene.prompt)).size,30,'Every scene needs a tailored scenario');
assert.deepEqual(await loadProductScene('hire'),productScenes.find(scene=>scene.slug==='hire'));
assert.deepEqual(await loadSolutionScene('enterprise'),solutionScenes.find(scene=>scene.slug==='enterprise'));
await assert.rejects(loadProductScene('not-a-product'),/Missing fictional demo/);
await assert.rejects(loadSolutionScene('not-a-solution'),/Missing fictional demo/);

// Verify every public page ships the entire storyboard, not just an empty JS mount.
const pages=[
 ...productScenes.map(scene=>({file:`products/${scene.slug}.html`,scene,prefix:'../'})),
 ...solutionScenes.map(scene=>({file:`solutions/${scene.slug}.html`,scene,prefix:'../'})),
 {file:'platform.html',scene:await loadProductScene('hire'),prefix:''},
 {file:'solutions.html',scene:await loadSolutionScene('hr-teams'),prefix:''},
 {file:'index.html',scene:await loadProductScene('hire'),prefix:''},
 {file:'enterprise.html',scene:await loadSolutionScene('enterprise'),prefix:''}
];
assert.equal(pages.length,34);
for(const {file,scene,prefix} of pages){
 const html=await read(file);
 assert.equal((html.match(/\bdata-story-demo(?:\s|>)/g)||[]).length,1,`${file}: exactly one demo per page`);
 assert.ok(html.includes(renderStoryDemo(scene,prefix)),`${file}: generated demo differs from the current scene/renderer`);
 assert.equal((html.match(new RegExp(`<link rel="stylesheet" href="${prefix.replace(/\./g,'\\.')}story-demo\\.css">`,'g'))||[]).length,1,`${file}: one demo stylesheet`);
 assert.equal((html.match(new RegExp(`<script src="${prefix.replace(/\./g,'\\.')}story-demo\\.js" defer><\\/script>`,'g'))||[]).length,1,`${file}: one deferred demo script`);
 const heroEnd=html.indexOf('</section>');
 const demoStart=html.indexOf('<section class="story-demo"');
 assert.ok(demoStart>heroEnd,`${file}: demo must follow the hero`);
 if(file==='index.html'){
  const tourStart=html.indexOf('id="tour"');
  const walkthroughStart=html.search(/<details\b[^>]*\bid="conversation-walkthrough"/);
  const walkthroughEnd=html.indexOf('</details>',walkthroughStart);
  assert.ok(tourStart>heroEnd&&walkthroughStart>tourStart&&demoStart>walkthroughStart,`${file}: story demo must follow the product tour inside its conversation walkthrough`);
  assert.ok(demoStart<walkthroughEnd,`${file}: story demo must be inside the conversation walkthrough, not after it`);
 }else{
  const nextSection=html.slice(heroEnd+'</section>'.length,demoStart);
  assert.ok(!/<(?:section|nav|div)\b/.test(nextSection),`${file}: demo must immediately follow the hero`);
 }
 const demo=renderStoryDemo(scene,prefix);
 assert.equal((demo.match(/data-story-frame/g)||[]).length,4,`${file}: all four frames must be server rendered`);
 assert.equal((demo.match(/data-story-frame hidden/g)||[]).length,3,`${file}: only first frame visible before enhancement`);
 assert.equal((demo.match(/data-story-step="[0-3]"/g)||[]).length,4,`${file}: all step controls present`);
 assert.equal((demo.match(/data-story-controls hidden/g)||[]).length,2,`${file}: controls hidden until enhancement`);
 for(const selector of ['play','replay','prev','next','status','outcome','announcement','data'])assert.ok(demo.includes(`data-story-${selector}`),`${file}: missing runtime target ${selector}`);
 assert.match(demo,/data-story-prev aria-label="Previous demo step" disabled/);
 assert.match(demo,/data-story-announcement role="status" aria-live="polite" aria-atomic="true"/);
 const transcript=demo.match(/<noscript>([\s\S]*?)<\/noscript>/)?.[1];
 assert.ok(transcript,`${file}: a no-JavaScript transcript is required`);
 for(const frame of scene.frames){
  assert.ok(transcript.includes(escape(frame.heading))&&transcript.includes(escape(frame.body))&&transcript.includes(escape(frame.message.text)),`${file}: transcript must explain every stage`);
 }
 assert.match(demo,/Fictional product walkthrough/);
 assert.match(demo,/No live messages, integrations or AI calls/);
 assert.match(demo,/not a customer result or a promise of production availability/);
 const data=JSON.parse(demo.match(/<script type="application\/json" data-story-data>([\s\S]*?)<\/script>/)?.[1]);
 assert.deepEqual(data,{labels:scene.frames.map(frame=>frame.label),outcomes:scene.frames.map(frame=>frame.outcome)});
}

// Both HTML and embedded JSON must remain inert when copy contains markup characters.
const unsafe='</script><img src=x onerror="alert(1)">&\'"';
const injection=structuredClone(productScenes[0]);
for(const key of ['product','title','intro','record','prompt'])injection[key]=unsafe;
for(const key of ['initials','name','role'])injection.person[key]=unsafe;
injection.sources=Array(3).fill(unsafe);
injection.manual={title:unsafe,items:Array(4).fill(unsafe),outcome:unsafe};
for(const frame of injection.frames){
 for(const key of ['label','activity','heading','body','outcome'])frame[key]=unsafe;
 frame.message={author:unsafe,text:unsafe};
 frame.items=Array.from({length:3},()=>({label:unsafe,detail:unsafe,status:'ready'}));
}
const escaped=renderStoryDemo(injection,'../');
assert.ok(!escaped.includes('<img src=x'),'Copy must never become executable HTML');
assert.ok(escaped.includes(escape(unsafe)),'Text must preserve escaped special characters');
assert.equal((escaped.match(/<\/script>/g)||[]).length,1,'Copy must not terminate the JSON script');
assert.deepEqual(JSON.parse(escaped.match(/data-story-data>([\s\S]*?)<\/script>/)[1]).outcomes,Array(4).fill(unsafe));
assert.throws(()=>renderStoryDemo({...productScenes[0],mode:'" onclick="bad'}));
assert.throws(()=>renderStoryDemo({...productScenes[0],frames:[]}));
assert.throws(()=>renderStoryDemo({...productScenes[0],slug:'../unsafe'}));

const runtime=await read('story-demo.js');
const css=await read('story-demo.css');
assert.ok(!/\b(?:fetch|XMLHttpRequest|WebSocket|sendBeacon|localStorage|sessionStorage|indexedDB)\b/.test(runtime),'Story demos must not call services or persist visitor data');
assert.match(css,/@media\s*\(prefers-reduced-motion:\s*reduce\)/,'CSS must disable animation for reduced motion');
assert.match(css,/animation:none!important/);
assert.match(css,/\.story-demo \[hidden\]\{display:none!important\}/,'Unenhanced controls must stay hidden');
assert.match(css,/\.story-demo \.story-frame\[hidden\]\{[^}]*visibility:hidden[^}]*pointer-events:none[^}]*animation:none[^}]*\}/,'Inactive frames may reserve layout space, but must remain invisible, non-interactive and unanimated');

// A deliberately small DOM and clock exercise the shipped runtime, not a reimplementation.
function createDemo({reduced=false,observer=true,hidden=false,frameCount=4,brokenData=false}={}){
 let document,rootElement;
 class Target{
  constructor(){this.listeners=new Map();}
  addEventListener(type,listener){this.listeners.set(type,[...this.listeners.get(type)||[],listener]);}
  trigger(type,event={}){for(const listener of this.listeners.get(type)||[])listener(event);}
 }
 class Element extends Target{
  constructor(){super();this.dataset={};this.attributes=new Map();this.hidden=false;this.disabled=false;this.textContent='';this.classes=new Set();this.classList={add:value=>this.classes.add(value),remove:value=>this.classes.delete(value),toggle:(value,on)=>on?this.classes.add(value):this.classes.delete(value),contains:value=>this.classes.has(value)};}
  setAttribute(name,value){this.attributes.set(name,String(value));}
  getAttribute(name){return this.attributes.get(name)??null;}
  removeAttribute(name){this.attributes.delete(name);}
  click(){if(!this.disabled&&!this.hidden)this.trigger('click');}
  focus(){document.activeElement=this;rootElement.trigger('focusin',{target:this});}
 }
 const nodes={};
 for(const key of ['data','play','replay','prev','next','status','outcome','announcement','stage'])nodes[key]=new Element();
 nodes.data.textContent=brokenData?'{':JSON.stringify({labels:productScenes[0].frames.map(frame=>frame.label),outcomes:productScenes[0].frames.map(frame=>frame.outcome)});
 const frames=Array.from({length:frameCount},(_,i)=>Object.assign(new Element(),{hidden:i>0}));
 const steps=Array.from({length:4},()=>new Element());
 const manual=Array.from({length:4},()=>new Element());
 const controls=Array.from({length:2},()=>Object.assign(new Element(),{hidden:true}));
 rootElement=new Element();
 rootElement.style={setProperty:(key,value)=>rootElement.styles.set(key,value)};rootElement.styles=new Map();
 rootElement.querySelector=selector=>selector==='.story-stage'?nodes.stage:nodes[selector.replace('[data-story-','').replace(']','')]||null;
 rootElement.querySelectorAll=selector=>({'[data-story-frame]':frames,'[data-story-step]':steps,'[data-manual-step]':manual,'[data-story-controls]':controls}[selector]||[]);
 document=Object.assign(new Target(),{hidden,activeElement:null,querySelectorAll:selector=>selector==='[data-story-demo]'?[rootElement]:[]});
 const window=new Target();
 const motion=Object.assign(new Target(),{matches:reduced});
 const observers=[];
 class Observer{
  constructor(callback,options){this.callback=callback;this.options=options;observers.push(this);}
  observe(target){this.target=target;}
 }
 if(observer)window.IntersectionObserver=Observer;
 let nextTimer=0;
 const timers=new Map();
 const setTimeout=(callback,delay)=>{assert.equal(delay,5200,'A complete frame should be readable before advancing');const id=++nextTimer;timers.set(id,callback);return id;};
 const clearTimeout=id=>timers.delete(id);
 const context=vm.createContext({document,window,matchMedia:query=>{assert.equal(query,'(prefers-reduced-motion: reduce)');return motion;},IntersectionObserver:Observer,setTimeout,clearTimeout});
 const run=()=>vm.runInContext(runtime,context,{timeout:1000,filename:'story-demo.js'});
 const tick=()=>{const item=timers.entries().next().value;assert.ok(item,'Expected an active animation timer');timers.delete(item[0]);item[1]();};
 const intersect=(value,ratio=value?1:0)=>{assert.equal(observers.length,1);observers[0].callback([{isIntersecting:value,intersectionRatio:ratio}]);};
 const changeMotion=value=>{motion.matches=value;motion.trigger('change',{matches:value});};
 const visibility=value=>{document.hidden=value;document.trigger('visibilitychange');};
 const listenerCount=()=>[rootElement,document,window,motion,...Object.values(nodes),...steps].reduce((sum,target)=>sum+[...target.listeners.values()].reduce((n,list)=>n+list.length,0),0);
 run();
 return {root:rootElement,nodes,frames,steps,manual,controls,document,window,motion,observers,timers,run,tick,intersect,changeMotion,visibility,listenerCount};
}
const d=createDemo();
assert.equal(d.root.dataset.storyReady,'true');
assert.equal(d.root.dataset.storyIndex,'0');
assert.equal(d.timers.size,0,'Offscreen demos must not auto-advance');
assert.ok(d.controls.every(control=>!control.hidden),'Controls become available only after valid setup');
assert.equal(d.observers[0].target,d.nodes.stage,'Observe the changing workspace, not the long surrounding section');
assert.equal(d.observers[0].options.threshold,.2);
d.intersect(true,.19);
assert.equal(d.timers.size,0,'A sliver of the workspace cannot start autoplay');
assert.match(d.nodes.status.textContent,/Scroll into the workspace to play/);
d.intersect(true,.2);
assert.equal(d.timers.size,1);
assert.ok(d.root.classList.contains('is-playing'));
d.tick();
assert.equal(d.root.dataset.storyIndex,'1');
assert.deepEqual(d.frames.map(frame=>frame.hidden),[true,false,true,true]);
assert.equal(d.steps[1].getAttribute('aria-current'),'step');
assert.ok(d.steps[0].classList.contains('is-complete'));
assert.ok(d.manual[1].classList.contains('is-current'));
assert.equal(d.nodes.outcome.textContent,productScenes[0].frames[1].outcome);
assert.equal(d.nodes.announcement.textContent,'','Autoplay must not flood the live region');
d.nodes.play.click();
assert.equal(d.timers.size,0,'Pause clears the timer');
assert.equal(d.root.dataset.storyPlaying,'false');
d.nodes.next.click();
assert.equal(d.root.dataset.storyIndex,'2');
assert.match(d.nodes.announcement.textContent,/Step 3 of 4/);
assert.equal(d.timers.size,0,'Manual step changes stay paused');
d.nodes.prev.click();assert.equal(d.root.dataset.storyIndex,'1');
d.steps[3].click();assert.equal(d.root.dataset.storyIndex,'3');assert.ok(d.nodes.next.disabled);
d.steps[0].click();assert.equal(d.root.dataset.storyIndex,'0');assert.ok(d.nodes.prev.disabled);
for(const [from,key,target] of [[0,'ArrowLeft',3],[3,'ArrowRight',0],[0,'End',3],[3,'Home',0]]){
 let prevented=false;
 d.steps[from].trigger('keydown',{key,preventDefault(){prevented=true;}});
 assert.ok(prevented);assert.equal(d.root.dataset.storyIndex,String(target));assert.equal(d.document.activeElement,d.steps[target]);
}
d.nodes.replay.click();assert.equal(d.root.dataset.storyIndex,'0');assert.equal(d.timers.size,1);
for(let i=0;i<4;i++)d.tick();
assert.equal(d.root.dataset.storyIndex,'3');assert.equal(d.timers.size,0);assert.equal(d.root.dataset.storyPlaying,'false');
assert.match(d.nodes.status.textContent,/Walkthrough complete/);
assert.equal(d.nodes.play.getAttribute('aria-label'),'Play animated demo again');
d.nodes.play.click();assert.equal(d.root.dataset.storyIndex,'0');assert.equal(d.timers.size,1);
d.intersect(true,.1);assert.equal(d.timers.size,0,'Dropping below workspace visibility threshold pauses advancement');
d.intersect(true,.2);assert.equal(d.timers.size,1,'Reaching the workspace visibility threshold resumes playback');
d.intersect(false);assert.equal(d.timers.size,0,'Leaving viewport cancels the timer');
d.intersect(true);assert.equal(d.timers.size,1);
d.visibility(true);assert.equal(d.timers.size,0,'Hidden browser tabs cannot advance');
d.visibility(false);assert.equal(d.timers.size,1);
d.steps[0].focus();assert.equal(d.timers.size,0,'Keyboard focus within a moving story pauses it');
d.nodes.play.click();assert.equal(d.timers.size,1);
d.window.trigger('pagehide');assert.equal(d.timers.size,0);
d.window.trigger('pageshow');assert.equal(d.timers.size,1);
d.changeMotion(true);assert.equal(d.timers.size,0);assert.ok(d.nodes.play.hidden);assert.equal(d.root.dataset.storyPlaying,'false');
d.nodes.next.click();assert.equal(d.root.dataset.storyIndex,'1','Manual stepping remains available with reduced motion');
d.nodes.replay.click();assert.equal(d.root.dataset.storyIndex,'0');assert.equal(d.timers.size,0,'Replay must not enable reduced-motion autoplay');
d.changeMotion(false);assert.ok(!d.nodes.play.hidden);assert.equal(d.timers.size,0,'A changed motion preference must not unexpectedly restart playback');
const count=d.listenerCount();d.run();assert.equal(d.listenerCount(),count,'Repeated script execution cannot add listeners');assert.equal(d.observers.length,1,'Repeated execution cannot add observers');
const reduced=createDemo({reduced:true});reduced.intersect(true);assert.equal(reduced.timers.size,0);assert.ok(reduced.nodes.play.hidden);assert.match(reduced.nodes.status.textContent,/Motion is off/);
const fallback=createDemo({observer:false});assert.equal(fallback.timers.size,1,'Without observer support, controls and normal autoplay still work');fallback.nodes.play.click();assert.equal(fallback.timers.size,0);
for(const options of [{brokenData:true},{frameCount:3}]){const invalid=createDemo(options);assert.ok(!invalid.root.dataset.storyReady);assert.ok(invalid.controls.every(control=>control.hidden));assert.equal(invalid.timers.size,0);}

console.log('PASS: 30 tailored four-stage storyboards on 34 pages, static content and no-JS transcripts, safe HTML/JSON rendering, controls and live-region targets, local-only runtime, autoplay completion, pause/replay, manual and keyboard steps, viewport/visibility lifecycle, reduced motion and idempotent enhancement.');

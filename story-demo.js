/* Local animated concept demos. No requests, persistence or external services. */
(() => {
 'use strict';
 const duration=5200;
 document.querySelectorAll('[data-story-demo]').forEach(root=>{
  if(root.dataset.storyReady==='true')return;
  const dataNode=root.querySelector('[data-story-data]');
  const frames=[...root.querySelectorAll('[data-story-frame]')];
  let data;
  try {data=JSON.parse(dataNode.textContent);if(frames.length!==4||data.labels.length!==4||data.outcomes.length!==4)return;} catch {return;}
  root.dataset.storyReady='true';
  const play=root.querySelector('[data-story-play]'),replay=root.querySelector('[data-story-replay]');
  const prev=root.querySelector('[data-story-prev]'),next=root.querySelector('[data-story-next]');
  const steps=[...root.querySelectorAll('[data-story-step]')],manual=[...root.querySelectorAll('[data-manual-step]')];
  const status=root.querySelector('[data-story-status]'),outcome=root.querySelector('[data-story-outcome]'),announcement=root.querySelector('[data-story-announcement]');
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  let index=0,timer,visible=false,playing=!motion.matches,finished=false;
  root.style.setProperty('--story-duration',`${duration}ms`);
  root.querySelectorAll('[data-story-controls]').forEach(element=>element.hidden=false);
  function clear(){clearTimeout(timer);timer=undefined;root.classList.remove('is-playing');}
  function announce(){announcement.textContent=`Step ${index+1} of 4. ${data.labels[index]}. ${data.outcomes[index]}`;}
  function updateControls(){
   play.hidden=motion.matches;
   play.textContent=finished?'Play again ↺':playing?'Pause Ⅱ':'Play ▶';
   play.setAttribute('aria-label',finished?'Play animated demo again':playing?'Pause animated demo':'Play animated demo');
   prev.disabled=index===0;next.disabled=index===frames.length-1;
   root.dataset.storyIndex=String(index);
   root.dataset.storyPlaying=String(playing);
   status.textContent=motion.matches?`Motion is off. Step ${index+1} of 4.`:finished?'Walkthrough complete. Replay or choose a step.':!playing?`Paused. Step ${index+1} of 4.`:!visible||document.hidden?'Scroll into the workspace to play.':`Playing step ${index+1} of 4`;
  }
  function schedule(){
   clear();updateControls();
   if(!playing||!visible||document.hidden||motion.matches||finished)return;
   root.classList.add('is-playing');
   timer=setTimeout(()=>{if(index<frames.length-1){show(index+1);schedule();}else{finished=true;playing=false;clear();updateControls();}},duration);
  }
  function show(target,notify=false){
   index=Math.max(0,Math.min(frames.length-1,target));
   frames.forEach((frame,i)=>{frame.hidden=i!==index;});
   steps.forEach((step,i)=>{if(i===index)step.setAttribute('aria-current','step');else step.removeAttribute('aria-current');step.classList.toggle('is-complete',i<index);});
   manual.forEach((item,i)=>{item.classList.toggle('is-current',i===index);item.classList.toggle('is-past',i<index);});
   outcome.textContent=data.outcomes[index];
   updateControls();if(notify)announce();
  }
  function select(target){playing=false;finished=false;clear();show(target,true);}
  play.addEventListener('click',()=>{if(finished){index=0;finished=false;show(0);}playing=!playing;schedule();});
  replay.addEventListener('click',()=>{finished=false;playing=!motion.matches;show(0,true);schedule();});
  prev.addEventListener('click',()=>select(index-1));next.addEventListener('click',()=>select(index+1));
  steps.forEach((step,i)=>{
   step.addEventListener('click',()=>select(i));
   step.addEventListener('keydown',event=>{
    let target;
    if(event.key==='ArrowRight')target=(i+1)%frames.length;
    if(event.key==='ArrowLeft')target=(i+frames.length-1)%frames.length;
    if(event.key==='Home')target=0;if(event.key==='End')target=frames.length-1;
    if(target!==undefined){event.preventDefault();select(target);steps[target].focus();}
   });
  });
  // Focus inside a changing story pauses it. Explicit Play can resume it.
  root.addEventListener('focusin',event=>{if(event.target===play||event.target===replay)return;if(playing){playing=false;clear();updateControls();}});
  document.addEventListener('visibilitychange',schedule);
  motion.addEventListener('change',()=>{playing=false;finished=false;clear();updateControls();});
  if('IntersectionObserver' in window){
   const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting&&entries[0].intersectionRatio>=.2;schedule();},{threshold:.2});observer.observe(root.querySelector('.story-stage'));
  }else{visible=true;}
  window.addEventListener('pagehide',clear);
  window.addEventListener('pageshow',schedule);
  show(0);schedule();
 });
})();

/* Hirebrew website concept. All sample state is in memory, never submitted. */
'use strict';
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const state = { role:'hr', advanced:false, reply:'', score:'', scoreSaved:false, onboarded:false, requested:false };
const announce = (text) => { $('#demo-live').textContent = text; };
const roles = {
  hr:{context:'Your hiring workspace',name:'Ada Okafor',initials:'AO',job:'HR manager',nav:['Overview','Hiring pipeline','Messages','Team calendar']},
  manager:{context:'Your interview workspace',name:'Tunde Bello',initials:'TB',job:'Hiring manager',nav:['My interviews','Scorecards','Hiring team','Messages']},
  candidate:{context:'Your candidate workspace',name:'Amara Eze',initials:'AE',job:'Candidate',nav:['My application','Messages','Interviews','My profile']},
  employee:{context:'Your people workspace',name:'Chidi Nwosu',initials:'CN',job:'New team member',nav:['My home','My onboarding','My requests','My growth']}
};
function stats(items){return `<div class="demo-stats">${items.map(([label,value,note])=>`<div class="demo-stat"><span>${label}</span><strong>${value}</strong><small>${note||''}</small></div>`).join('')}</div>`;}
function greeting(hello,title){return `<p class="demo-greeting">${hello}</p><div class="demo-title-row"><h3>${title}</h3><span class="demo-date">Sample workspace</span></div>`;}
function renderDemo(){
  const role=roles[state.role];
  $('#demo-context').textContent=role.context;
  $('#demo-nav').innerHTML=role.nav.map((label,i)=>`<div class="demo-nav-item ${i===0?'active':''}"><span class="demo-nav-icon" aria-hidden="true">${['◫','↗','↔','○'][i]}</span>${label}</div>`).join('');
  $('.sidebar-bottom').innerHTML=`<span class="tiny-avatar">${role.initials}</span><span>${role.name}<small>${role.job}</small></span>`;
  let content='';
  if(state.role==='hr'){
    content=greeting('Good morning, Ada','Good people, in progress.')+stats([['Open roles','4','active'],['In interview',state.advanced?'8':'7','people'],['Candidate replies',state.reply?'1':'0','new']])+`<div class="demo-table-head"><strong>Your shortlist</strong><button data-view-manager>Open interview panel ↗</button></div>
    <div class="person-row"><span class="person"><span class="tiny-avatar pink">AE</span><span>Amara Eze<small>Product Designer</small></span></span><span class="status-badge ${state.advanced?'blue':'peach'}">${state.advanced?'Interview':'Shortlisted'}</span><button class="mini-action ${state.advanced?'done':''}" data-advance ${state.advanced?'disabled':''}>${state.advanced?'Advanced ✓':'Invite to interview'}</button></div>
    <div class="person-row"><span class="person"><span class="tiny-avatar blue">KO</span><span>Kemi Ogunleye<small>Product Designer</small></span></span><span class="status-badge blue">Interview</span><span class="mini-note">Scheduled</span></div>
    <div class="person-row"><span class="person"><span class="tiny-avatar green">IM</span><span>Ibrahim Musa<small>Product Designer</small></span></span><span class="status-badge">In review</span><span class="mini-note">Review pending</span></div>
    ${state.reply?`<p class="mini-note"><strong>Amara replied:</strong> ${escapeHtml(state.reply)}</p>`:`<p class="mini-note">${state.advanced?'Amara is ready for an interview. Switch to Candidates to reply.':'Invite Amara, then explore the candidate and manager perspectives.'}</p>`}`;
  } else if(state.role==='candidate'){
    content=greeting('Hello, Amara','Your next chapter starts here.')+`<div class="demo-table-head"><strong>Product Designer</strong><span class="status-badge ${state.advanced?'blue':'peach'}">${state.advanced?'Interview stage':'Shortlisted'}</span></div><div class="conversation"><span class="person"><span class="tiny-avatar">AO</span><span>Ada from the hiring team<small>Message to you</small></span></span><p>${state.advanced?"We'd love to meet you, Amara. Tunde and I will join your interview. Does Tuesday at 11:00 WAT work for you?":"Hi Amara, thanks for sharing your portfolio. You're on our shortlist. Do you have any questions about the role?"}</p><time>Example message</time></div>${state.reply?`<div class="conversation response"><strong>Your reply</strong><p>${escapeHtml(state.reply)}</p></div>`:''}<form class="message-form" id="message-form"><label for="candidate-reply" class="sr-only">Reply to Ada</label><input id="candidate-reply" name="reply" required maxlength="240" autocomplete="off" placeholder="${state.reply?'Update your reply':'Write a reply to Ada...'}" value="${escapeHtml(state.reply)}"><button class="mini-action" type="submit">Reply <span aria-hidden="true">↗</span></button></form><p class="mini-note" id="message-note">Your reply will appear in the HR preview. Nothing is sent externally.</p>`;
  } else if(state.role==='manager'){
    content=greeting('Hello, Tunde','A better conversation starts here.')+`<div class="review-card"><div class="demo-table-head"><strong>${state.advanced?'Amara Eze':'Kemi Ogunleye'}</strong><span class="status-badge blue">Interview panel</span></div><h4>Product Designer interview</h4><p>Panel: you + Ada Okafor<br>Focus: craft, collaboration and problem-solving.</p><p class="mini-note">Example scorecard. Choose your recommendation:</p><div class="score-options" role="group" aria-label="Interview recommendation">${['Strong evidence','Follow up','Not enough evidence'].map(s=>`<button data-score="${s}" aria-pressed="${state.score===s}">${s}</button>`).join('')}</div><button class="mini-action ${state.scoreSaved?'done':''}" data-save-score>${state.scoreSaved?'Scorecard saved ✓':'Save scorecard'}</button><p class="mini-note" id="score-note">${state.scoreSaved?'Your recommendation is saved in this preview. Final decisions remain with the hiring team.':'Only sample data is used. This does not assess a real person.'}</p></div><p class="mini-note">${state.advanced?'Amara appeared here because HR advanced the application.':'Advance Amara from HR to see the shared workflow update.'}</p>`;
  } else {
    content=greeting('Welcome aboard, Chidi','A good start, together.')+`<div class="demo-table-head"><strong>Your first-week checklist</strong><span>${state.onboarded?'3':'2'} of 3 complete</span></div><div class="task-row"><span class="task-check checked">✓</span><span>Meet your buddy<small>Ngozi is ready to say hello.</small></span><span>Done</span></div><div class="task-row"><span class="task-check checked">✓</span><span>Check your day-one plan<small>Your people, place and first conversation.</small></span><span>Done</span></div><div class="task-row"><span class="task-check ${state.onboarded?'checked':''}">${state.onboarded?'✓':'3'}</span><span>Set your first learning goal<small>One small step toward what's next.</small></span><button class="mini-action ${state.onboarded?'done':''}" data-onboard ${state.onboarded?'disabled':''}>${state.onboarded?'Done ✓':'Mark complete'}</button></div><div class="employee-foot"><span><strong>Your people team is here.</strong>Ask a question about your first week.</span><button class="mini-action" data-welcome-question ${state.requested?'disabled':''}>${state.requested?'Request added ✓':'Try a request ↗'}</button></div><p class="mini-note" id="employee-note">${state.requested?'Sample request: “Can we arrange my first check-in?” Added to this preview only.':state.onboarded?'Your sample welcome checklist is complete.':'A connected welcome, not another disconnected checklist.'}</p>`;
  }
  $('#demo-content').innerHTML=content;
  bindDemoActions();
}
function setRole(role,focus=false){
  if(!roles[role])return;
  state.role=role;
  $$('[data-role]').forEach(tab=>{const selected=tab.dataset.role===role;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;});
  $('#demo-panel').setAttribute('aria-labelledby',`tab-${role}`);
  renderDemo();
  if(focus)$(`#tab-${role}`).focus();
}
function bindDemoActions(){
  $('[data-advance]')?.addEventListener('click',()=>{state.advanced=true;state.score='';state.scoreSaved=false;renderDemo();announce('Amara advanced to interview. The candidate and manager previews are updated.');$('[data-view-manager]').focus();});
  $('[data-view-manager]')?.addEventListener('click',()=>setRole('manager',true));
  $('[data-view-candidate]')?.addEventListener('click',()=>setRole('candidate',true));
  $('#message-form')?.addEventListener('submit',event=>{event.preventDefault();const reply=$('#candidate-reply').value.trim();if(!reply){$('#message-note').textContent='Please write a reply before saving.';$('#candidate-reply').focus();return;}state.reply=reply;renderDemo();$('#candidate-reply').focus();announce('Your reply is saved in the preview and visible in the HR perspective.');});
  $$('[data-score]').forEach(button=>button.addEventListener('click',()=>{state.score=button.dataset.score;state.scoreSaved=false;$$('[data-score]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));$('[data-save-score]').textContent='Save scorecard';$('#score-note').textContent='Ready for your review.';}));
  $('[data-save-score]')?.addEventListener('click',()=>{if(!state.score){$('#score-note').textContent='Choose a recommendation first.';announce('Choose a recommendation first.');return;}state.scoreSaved=true;renderDemo();$('[data-save-score]').focus();announce('Example scorecard saved.');});
  $('[data-onboard]')?.addEventListener('click',()=>{state.onboarded=true;renderDemo();$('[data-welcome-question]').focus();announce('Your sample first-week checklist is complete.');});
  $('[data-welcome-question]')?.addEventListener('click',event=>{state.requested=true;event.currentTarget.textContent='Request added ✓';event.currentTarget.disabled=true;$('#employee-note').textContent='Sample request: “Can we arrange my first check-in?” Added to this preview only.';announce('Sample request added in the preview only.');});
}
$$('[data-role]').forEach(button=>{
  button.addEventListener('click',()=>setRole(button.dataset.role));
  button.addEventListener('keydown',event=>{const tabs=$$('[data-role]');let index=tabs.indexOf(button);if(event.key==='ArrowRight')index=(index+1)%tabs.length;else if(event.key==='ArrowLeft')index=(index+tabs.length-1)%tabs.length;else if(event.key==='Home')index=0;else if(event.key==='End')index=tabs.length-1;else return;event.preventDefault();setRole(tabs[index].dataset.role,true);});
});
$$('[data-go-role]').forEach(link=>link.addEventListener('click',()=>setRole(link.dataset.goRole)));
$('#reset-demo').addEventListener('click',()=>{Object.assign(state,{advanced:false,reply:'',score:'',scoreSaved:false,onboarded:false,requested:false});renderDemo();announce('The role-based sample actions have been reset.');});
const requestedPerspective = new URLSearchParams(window.location.search).get('perspective');
setRole(Object.hasOwn(roles, requestedPerspective) ? requestedPerspective : 'hr');

const prompts={
  invite:{title:'A warm next step for Amara.',text:"Hi Amara, we'd love to get to know you better. Please join Ada and Tunde for a conversation about the Product Designer role. You can confirm a time or let us know what works for you.",context:'Based on: role brief + interview stage'},
  summary:{title:'Good signals. One open question.',text:'The example panel notes highlight clear design reasoning and thoughtful collaboration. There is less evidence about prioritising under tight deadlines. A follow-up conversation could explore that gap before the team makes a decision.',context:'Based on: illustrative panel notes. Not a hiring recommendation.'},
  plan:{title:'A first week with room to belong.',text:'Day 1: Meet your buddy and settle in.\nDay 2: Get to know the team and its work.\nDay 3: Explore your first project together.\nDay 4: Pick a small learning goal.\nDay 5: Check in, ask questions, make a plan.',context:'Based on: sample role + first-week checklist'}
};
let activePrompt='invite';
$$('[data-prompt]').forEach(button=>button.addEventListener('click',()=>{activePrompt=button.dataset.prompt;const prompt=prompts[activePrompt];$$('[data-prompt]').forEach(b=>{b.classList.toggle('selected',b===button);b.setAttribute('aria-pressed',String(b===button));});$('#draft-title').textContent=prompt.title;$('#draft-text').textContent=prompt.text;$('#draft-context').textContent=prompt.context;$('#draft-state').textContent=prompt.reviewed?'Reviewed by you. Saved in this preview only.':'You review before anything moves.';$('#approve-draft').innerHTML=`${prompt.reviewed?'Edit again':'Review draft'} <span aria-hidden="true">↗</span>`;}));

const menuButton=$('.menu-toggle');
menuButton.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')!=='true';menuButton.setAttribute('aria-expanded',String(open));$('#nav-links').classList.toggle('open',open);$('span',menuButton).textContent=open?'−':'+';});
function closeMenu(){menuButton.setAttribute('aria-expanded','false');$('#nav-links').classList.remove('open');$('span',menuButton).textContent='+';}
$$('#nav-links a').forEach(link=>link.addEventListener('click',closeMenu));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menuButton.getAttribute('aria-expanded')==='true'&&!$('.nav-trigger[aria-expanded="true"]')){closeMenu();menuButton.focus();}});

const previousFocus=new WeakMap();
function openDialog(dialog){previousFocus.set(dialog,document.activeElement);dialog.showModal();document.body.style.overflow='hidden';}
function closeDialog(dialog){dialog.close();}
$$('dialog').forEach(dialog=>{
  $('[data-close]',dialog).addEventListener('click',()=>closeDialog(dialog));
  dialog.addEventListener('close',()=>{document.body.style.overflow='';previousFocus.get(dialog)?.focus();});
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeDialog(dialog);});
});
$$('[data-pilot]').forEach(button=>button.addEventListener('click',()=>{closeMenu();openDialog($('#pilot-dialog'));}));
$('#privacy-info').addEventListener('click',()=>openDialog($('#privacy-dialog')));
$('#approve-draft').addEventListener('click',()=>{$('#review-text').value=$('#draft-text').textContent;openDialog($('#review-dialog'));});
$('#save-review').addEventListener('click',()=>{const text=$('#review-text').value.trim();if(!text){$('#review-text').setCustomValidity('Add draft text before saving.');$('#review-text').reportValidity();return;}$('#review-text').setCustomValidity('');prompts[activePrompt].text=text;prompts[activePrompt].reviewed=true;$('#draft-text').textContent=text;$('#draft-state').textContent='Reviewed by you. Saved in this preview only.';$('#approve-draft').innerHTML='Edit again <span aria-hidden="true">↗</span>';closeDialog($('#review-dialog'));});
$('#review-text').addEventListener('input',()=>$('#review-text').setCustomValidity(''));
$('#pilot-form').addEventListener('submit',event=>{
  event.preventDefault();const data=new FormData(event.currentTarget);const team=String(data.get('team')).trim();const goal=String(data.get('goal')).trim();$('#form-error').textContent='';$('#form-success').textContent='';
  if(!team||!goal){$('#form-error').textContent='Please add your team name and what success would look like.';(!team?$('#pilot-team'):$('#pilot-goal')).focus();return;}
  const brief=`HIREBREW | PILOT STARTING BRIEF\n\nTeam: ${team}\nTeam size: ${data.get('size')}\nStarting workflow: ${data.get('focus')}\n\nA good first month:\n${goal}\n\nSuggested preparation\n1. Choose a pilot owner and one representative workflow.\n2. Identify HR, manager, candidate or employee participants.\n3. Agree measurable success and a review date.\n4. Verify identity, role permissions and data controls.\n5. Confirm each integration and its provider configuration.\n6. Test every handoff with sample data before using real records.\n7. Confirm human review and approved data access for any AI feature.\n\nThis brief was generated locally from the Hirebrew website concept. It is not a submitted enquiry, product commitment or service agreement. No data was sent to Hirebrew.\n`;
  try{const url=URL.createObjectURL(new Blob([brief],{type:'text/plain;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='Hirebrew-Pilot-Brief.txt';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);$('#form-success').textContent='Your pilot brief is ready. Check your downloads. Nothing was submitted.';}catch{$('#form-error').textContent='Your browser could not create the download. Please try another browser.';}
});

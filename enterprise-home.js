/* Local-only interactions for the enterprise marketing preview. */
'use strict';
(() => {
  const select = (selector, root = document) => root.querySelector(selector);
  const selectAll = (selector) => [...document.querySelectorAll(selector)];
  const completed = new Set();
  const handoffDetails = {
    invite: {label:'Invited ✓', message:'Amara’s interview invitation is ready in this sample. In the full tour, switch to Candidates to reply.'},
    review: {label:'Reviewed ✓', message:'Tunde’s sample feedback has been reviewed. A hiring decision still belongs to the team.'},
    welcome: {label:'Ready ✓', message:'Chidi’s sample welcome plan is ready. The employee tour lets you complete a first-week task.'}
  };
  const handoffButtons = selectAll('[data-handoff]');
  const handoffLabels = handoffButtons.map(button => button.innerHTML);
  function updateHandoffProgress() {
    select('#workspace-count').textContent = `${completed.size} of 3`;
    select('#workspace-progress-bar').style.width = `${completed.size / 3 * 100}%`;
  }
  handoffButtons.forEach(button => button.addEventListener('click', () => {
    const item = handoffDetails[button.dataset.handoff];
    completed.add(button.dataset.handoff);
    button.textContent = item.label;
    button.disabled = true;
    updateHandoffProgress();
    const message = completed.size === 3 ? 'Three clearer next steps. Take the product tour below to explore the connected role-based workflow.' : item.message;
    select('#workspace-insight').textContent = message;
    select('#workspace-status').textContent = message;
  }));
  select('#workspace-reset').addEventListener('click', () => {
    completed.clear();
    handoffButtons.forEach((button, index) => { button.innerHTML = handoffLabels[index]; button.disabled = false; });
    updateHandoffProgress();
    select('#workspace-insight').innerHTML = 'A good next step for everyone.<br><strong>Try a handoff to see what changes.</strong>';
    select('#workspace-status').textContent = 'The sample handoffs have been reset.';
  });

  const modules = {
    hire: {name:'Hire',title:'Better hiring starts with a connected team.',description:'Bring approved roles, candidates, conversations and interview decisions into the same story.',features:['Requisitions and hiring approvals','Candidate pipeline and two-way messages','Interview panels and structured scorecards'],steps:[['Approved role','Clear ownership from the start'],['Shared shortlist','Context for the whole hiring team'],['Structured conversation','Candidate replies and panel feedback'],['Human decision','Evidence stays with the process']],action:'Try the hiring workflow',role:'hr'},
    onboard: {name:'Onboard',title:'Make day one feel like a beginning.',description:'Turn a signed offer into a coordinated welcome. Give the new joiner, manager and people team a shared starting point.',features:['Preboarding and new-joiner tasks','Manager and people-team handoffs','First-week and 30/60/90-day plans'],steps:[['Prepare the welcome','Bring the manager into the plan'],['Share the essentials','Make tasks and owners visible'],['Start the first week','Help your new joiner find their feet'],['Check in together','Agree the next learning goal']],action:'Try the employee welcome',role:'employee'},
    people: {name:'People',title:'A clearer home for everyday HR.',description:'Help employees find the next step and give the people team the context to respond.',features:['Employee records and self-service','Leave, letters and employee requests','Contracts, cases and people operations'],steps:[['One people context','Find the record behind the request'],['Employee request','A clear place to ask'],['Responsible owner','Route the next action to a person'],['Visible follow-through','Keep the employee in the loop']],action:'Try an employee request',role:'employee'},
    grow: {name:'Grow',title:'Turn everyday progress into a bigger future.',description:'Bring goals, conversations and development into the employee experience beyond onboarding.',features:['Goals, reviews and regular check-ins','Feedback and one-to-one conversations','Learning and internal opportunities'],steps:[['Set a meaningful goal','Make the next step specific'],['Have the conversation','Bring feedback into the rhythm'],['Build new capability','Connect learning and development'],['Explore what’s next','Make room for internal growth']],action:'Explore the employee perspective',role:'employee'},
    intelligence: {name:'Intelligence',title:'Put people context behind the next decision.',description:'Explore the workforce, hiring and headcount views that help leadership ask better questions.',features:['Workforce and headcount planning views','Hiring and departmental reporting concepts','Brew AI drafts and summaries for review'],steps:[['Gather the context','People, roles and open actions'],['Understand the question','Connect the view to the decision'],['Review the evidence','Check the source and the limits'],['Decide with people','Keep human accountability clear']],action:'Explore Brew AI examples',href:'#brew'}
  };
  let currentModule = 'hire';
  function setModule(key, focus = false) {
    const item = modules[key];
    if (!item) return;
    currentModule = key;
    selectAll('[data-module]').forEach(button => {
      const selected = button.dataset.module === key;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    select('#module-panel').setAttribute('aria-labelledby', `module-tab-${key}`);
    select('#module-title').textContent = item.title;
    select('#module-description').textContent = item.description;
    const features = select('#module-features');
    features.replaceChildren(...item.features.map(text => { const li = document.createElement('li'); li.textContent = text; return li; }));
    const map = select('#module-map');
    map.setAttribute('aria-label', `${item.name} workflow overview`);
    select('.map-label>span', map).textContent = `HIREBREW ${item.name.toUpperCase()}`;
    select('ol', map).replaceChildren(...item.steps.map(([title, note]) => {
      const li = document.createElement('li');
      const name = document.createElement('span'); name.textContent = title;
      const description = document.createElement('small'); description.textContent = note;
      li.append(name, description); return li;
    }));
    const action = select('#module-action');
    action.href = item.href || '#tour';
    action.textContent = `${item.action} →`;
    const detail = select('#module-detail');
    detail.href = `products/${key}.html`;
    detail.textContent = `Explore Hirebrew ${item.name} →`;
    if (focus) select(`#module-tab-${key}`).focus();
  }
  selectAll('[data-module]').forEach(button => {
    button.addEventListener('click', () => setModule(button.dataset.module));
    button.addEventListener('keydown', event => {
      const tabs = selectAll('[data-module]'); let index = tabs.indexOf(button);
      if (event.key === 'ArrowRight') index = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') index = (index + tabs.length - 1) % tabs.length;
      else if (event.key === 'Home') index = 0;
      else if (event.key === 'End') index = tabs.length - 1;
      else return;
      event.preventDefault(); setModule(tabs[index].dataset.module, true);
    });
  });
  selectAll('[data-module-link]').forEach(link => link.addEventListener('click', () => setModule(link.dataset.moduleLink)));
  select('#module-action').addEventListener('click', () => {
    const role = modules[currentModule].role;
    if (role) select(`#tab-${role}`).click();
  });
  const queryProduct = new URLSearchParams(window.location.search).get('product');
  if (Object.hasOwn(modules, queryProduct)) setModule(queryProduct);
})();

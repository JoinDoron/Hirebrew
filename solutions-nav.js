/* Shared Solutions navigation. Local links only; no external services. */
(() => {
  'use strict';
  const groups = [
    {title:'By business size', items:[
      ['Startups','Build your hiring and people foundations.','solutions/startups.html'],
      ['Mid-Market','Keep growing teams and workflows connected.','solutions/mid-market.html'],
      ['Enterprise','Plan people operations around your complexity.','solutions/enterprise.html']
    ]},
    {title:'By teams', items:[
      ['HR teams','Connect hiring, onboarding and everyday HR.','solutions/hr-teams.html'],
      ['Finance teams','Bring workforce context into planning.','solutions/finance-teams.html'],
      ['Legal teams','Define data responsibilities and review controls.','solutions/legal-teams.html'],
      ['IT teams','Evaluate access, systems and integration needs.','solutions/it-teams.html'],
      ['Founders','Build the team behind your next chapter.','solutions/founders.html']
    ]},
    {title:'By industry', compact:true, items:[
      ['Advertising','','solutions/advertising.html'],
      ['AI','','solutions/ai.html'],
      ['BPO','','solutions/bpo.html'],
      ['Construction','','solutions/construction.html'],
      ['Crypto','','solutions/crypto.html'],
      ['Education','','solutions/education.html'],
      ['Finance','','solutions/finance.html'],
      ['Fintech','','solutions/fintech.html'],
      ['Gaming','','solutions/gaming.html'],
      ['Healthcare','','solutions/healthcare.html'],
      ['IT','','solutions/it.html'],
      ['Manufacturing','','solutions/manufacturing.html'],
      ['Nonprofit','','solutions/nonprofit.html'],
      ['Oil & Gas','','solutions/oil-gas.html'],
      ['Retail','','solutions/retail.html'],
      ['Technology','','solutions/technology.html'],
      ['All industries','','solutions.html#industries',16]
    ]}
  ];
  document.querySelectorAll('.solutions-nav').forEach((root, index) => {
    if (root.dataset.solutionsReady === 'true') return;
    root.dataset.solutionsReady = 'true';
    const button = document.createElement('button');
    button.className = 'solutions-toggle'; button.type = 'button';
    button.innerHTML = 'Solutions <span aria-hidden="true">⌄</span>';
    button.setAttribute('aria-expanded','false');
    const panel = document.createElement('div');
    panel.className = 'solutions-panel'; panel.id = `solutions-menu${index ? `-${index}` : ''}`;
    panel.hidden = true; button.setAttribute('aria-controls',panel.id);
    groups.forEach((group, groupIndex) => {
      const section = document.createElement('section');
      section.className = `solutions-group${group.compact?' solutions-group-compact':''}`;
      const heading = document.createElement('h2');
      heading.id = `${panel.id}-heading-${groupIndex}`; heading.textContent = group.title;
      section.setAttribute('aria-labelledby',heading.id);
      const list = document.createElement('ul');
      group.items.forEach(([title,description,href,count]) => {
        const li = document.createElement('li'); const link = document.createElement('a');
        link.href = (root.dataset.root || './') + href;
        if (link.pathname === window.location.pathname && !link.hash) link.setAttribute('aria-current','page');
        const strong = document.createElement('strong'); strong.textContent = title; link.append(strong);
        if (count) {
          li.className = 'solutions-directory-link';
          const badge = document.createElement('span'); badge.className = 'solutions-count';
          badge.textContent = count; badge.setAttribute('aria-label',`${count} industries`); strong.append(badge);
        }
        if (description) {const note = document.createElement('span'); note.className = 'solutions-description'; note.textContent = description; link.append(note);}
        li.append(link); list.append(li);
      });
      section.append(heading,list); panel.append(section);
    });
    root.replaceChildren(button,panel);
    let hoverTimer;
    function close(restoreFocus=false) {
      clearTimeout(hoverTimer); button.setAttribute('aria-expanded','false'); panel.hidden=true;
      if(restoreFocus)button.focus();
    }
    function open() {
      clearTimeout(hoverTimer); document.dispatchEvent(new CustomEvent('hirebrew:solutions-open'));
      button.setAttribute('aria-expanded','true'); panel.hidden=false;
    }
    button.addEventListener('click',()=>{clearTimeout(hoverTimer);if(panel.hidden)open();else close();});
    button.addEventListener('keydown',event=>{
      if(event.key==='ArrowDown'){event.preventDefault();open();panel.querySelector('a').focus();}
    });
    root.addEventListener('pointerenter',()=>{
      if(matchMedia('(hover:hover) and (min-width:801px)').matches){clearTimeout(hoverTimer);hoverTimer=setTimeout(open,160);}
    });
    root.addEventListener('pointerleave',()=>{
      clearTimeout(hoverTimer);
      if(matchMedia('(hover:hover) and (min-width:801px)').matches && !root.contains(document.activeElement))hoverTimer=setTimeout(()=>close(),180);
    });
    document.addEventListener('click',event=>{if(!root.contains(event.target))close();});
    document.addEventListener('hirebrew:platform-open',()=>close());
    document.addEventListener('focusin',event=>{
      // Do not shift the mobile layout before a sibling toggle receives its click.
      if(!root.contains(event.target)&&!event.target.closest?.('.platform-toggle'))close();
    });
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&!panel.hidden){event.preventDefault();event.stopPropagation();close(true);}
    },true);
    panel.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>close()));
  });
})();

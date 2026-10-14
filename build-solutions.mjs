/* Individually authored content, generated as portable static HTML. */
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import {e,arrow,head,header,footer} from './marketing-shell.mjs';
import {renderStoryDemo,loadSolutionScene} from './demo-scenes.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const files=['solutions-business.json','solutions-industries-a.json','solutions-industries-b.json'];
const solutions=(await Promise.all(files.map(file=>readFile(path.join(root,'content',file),'utf8').then(JSON.parse)))).flat();
const categories={
 size:{id:'business-sizes',name:'Business size',title:'Built around your next chapter.',description:'From your first specialist hire to a more complex organisation, start with the people workflow that matters now.'},
 team:{id:'teams',name:'Teams',title:'Different responsibilities. Shared progress.',description:'Give every stakeholder a clearer role in the employee journey, without losing the context between teams.'},
 industry:{id:'industries',name:'Industries',title:'Your world. Your way of working.',description:'Explore 16 industry perspectives, with practical use cases and the specialist requirements to validate before a pilot.'}
};
assert.equal(solutions.length,24);
assert.equal(new Set(solutions.map(s=>s.slug)).size,24);
for(const s of solutions){
 assert.match(s.slug,/^[a-z]+(?:-[a-z]+)*$/);assert.ok(categories[s.category]);
 for(const key of ['name','legacyId','metaTitle','metaDescription','headline','subhead','summary','challengeTitle','challenge','workflowTitle','workflowIntro'])assert.ok(typeof s[key]==='string'&&s[key].trim(),`${s.slug}: ${key}`);
 for(const [key,count] of Object.entries({priorities:3,steps:4,capabilities:4,faqs:3,related:3}))assert.equal(s[key].length,count,`${s.slug}: ${key}`);
 assert.equal(s.pilot.checks.length,3);
 for(const slug of s.related)assert.ok(slug!==s.slug&&solutions.some(x=>x.slug===slug),`${s.slug}: invalid related page ${slug}`);
 for(const feature of s.capabilities)assert.match(feature.href,/^(?:index|enterprise)\.html#[a-z-]+$/);
}
const brief=s=>`HIREBREW PILOT BRIEF\n${s.name}\n\nWORKFLOW TO EVALUATE\n${s.workflowTitle}\n${s.workflowIntro}\n\nHANDOFFS\n${s.steps.map(x=>`${x.label} | ${x.owner}\n${x.title}\n${x.body}`).join('\n\n')}\n\nPILOT SCOPE\n${s.pilot.title}\n${s.pilot.body}\n\nVALIDATION CHECKLIST\n${s.pilot.checks.map(x=>'[ ] '+x).join('\n')}\n\nBOUNDARIES\n${s.pilot.boundary}\n\nAI EVALUATION\n${s.ai.body}\nExample prompt: ${s.ai.example}\n\nNEXT STEP\nAssign an owner, test with sample data, record gaps and agree acceptance criteria before any live rollout. This is a planning document, not a booking, service commitment or confirmation of production readiness.\n`;
async function page(s){
 const p='../',c=categories[s.category];
 return `${head(s.metaTitle,s.metaDescription,p)}
<body class="enterprise-page marketing-theme solution-page solution-${s.category}" data-solution="${s.slug}">
${header(p)}
<main id="main">
<section class="solution-hero enterprise-wrap" aria-labelledby="page-title">
<nav class="solution-breadcrumb" aria-label="Breadcrumb"><a href="../solutions.html">Solutions</a><span aria-hidden="true">/</span><a href="../solutions.html#${c.id}">${c.name}</a><span aria-hidden="true">/</span><span aria-current="page">${e(s.name)}</span></nav>
<h1 id="page-title">${e(s.headline)}</h1>
<div class="solution-hero-bottom"><p>${e(s.subhead)}</p><div class="solution-hero-actions"><a class="enterprise-button" href="#pilot">Plan your pilot ${arrow}</a><a class="enterprise-text-link" href="#story-demo">Watch the demo ${arrow}</a></div></div>
</section>
${renderStoryDemo(await loadSolutionScene(s.slug),p)}
<nav class="solution-sections enterprise-wrap" aria-label="On this page"><a href="#opportunity">Your priorities</a><a href="#workflow">The workflow</a><a href="#capabilities">What connects</a><a href="#brew">Brew AI</a><a href="#questions">Questions</a></nav>
<section class="solution-opportunity enterprise-wrap solution-space" id="opportunity" aria-labelledby="opportunity-title">
<div><h2 id="opportunity-title">${e(s.challengeTitle)}</h2><p>${e(s.challenge)}</p></div>
<div class="solution-priorities">${s.priorities.map(x=>`<article><h3>${e(x.title)}</h3><p>${e(x.body)}</p></article>`).join('\n')}</div>
</section>
<section class="solution-workflow solution-space" id="workflow" aria-labelledby="workflow-title"><div class="enterprise-wrap">
<div class="solution-section-heading"><h2 id="workflow-title">${e(s.workflowTitle)}</h2><p>${e(s.workflowIntro)}</p></div>
<p class="solution-workflow-note">Illustrative workflow. Explore the ownership at each handoff.</p>
<div class="workflow-tabs" role="tablist" aria-label="Workflow handoffs" hidden>${s.steps.map((x,i)=>`<button type="button" role="tab" id="step-tab-${i}" aria-controls="step-${i}" aria-selected="${i===0}" tabindex="${i===0?0:-1}">${e(x.label)}<span aria-hidden="true">→</span></button>`).join('')}</div>
<div class="workflow-panels">${s.steps.map((x,i)=>`<article id="step-${i}" class="workflow-panel" aria-labelledby="step-title-${i}" data-workflow-panel><div class="workflow-owner"><span>Workflow owner</span><strong>${e(x.owner)}</strong></div><div><h3 id="step-title-${i}">${e(x.title)}</h3><p>${e(x.body)}</p></div></article>`).join('\n')}</div>
<div class="solution-workflow-foot"><p>See connected sample interactions in the product tour.</p><a class="enterprise-text-link" href="../index.html#tour">Explore the product ${arrow}</a></div>
</div></section>
<section class="solution-space enterprise-wrap" id="capabilities" aria-labelledby="capabilities-title">
<div class="solution-section-heading"><h2 id="capabilities-title">The right pieces.<br> Working together.</h2><p>Start with a focused workflow. Connect more of the employee journey as your evaluation develops.</p></div>
<div class="solution-capabilities">${s.capabilities.map(x=>`<a href="../${x.href}"><h3>${e(x.name)}</h3><p>${e(x.body)}</p><span class="solution-explore">Explore the capability ${arrow}</span></a>`).join('\n')}</div>
</section>
<section class="solution-ai" id="brew" aria-labelledby="brew-title"><div class="enterprise-wrap solution-ai-layout">
<div><h2 id="brew-title">${e(s.ai.title)}</h2><p>${e(s.ai.body)}</p><a class="enterprise-text-link" href="../index.html#brew">Explore Brew AI ${arrow}</a></div>
<aside class="solution-prompt"><span>Example prompt for a human-reviewed draft</span><p>${e(s.ai.example)}</p><small>Illustrative only. No AI request is sent from this page.</small></aside>
</div></section>
<section class="solution-space enterprise-wrap solution-pilot-layout" id="pilot" aria-labelledby="pilot-title">
<div><h2 id="pilot-title">${e(s.pilot.title)}</h2><p>${e(s.pilot.body)}</p><aside class="solution-boundary"><h3>Define the boundaries early.</h3><p>${e(s.pilot.boundary)}</p></aside><a class="enterprise-text-link" href="../assets/resources/pilots/${s.slug}.txt" download>Download the starting brief ${arrow}</a></div>
<form class="solution-planner" data-pilot-form hidden novalidate>
<h3>Make the pilot yours.</h3><p class="planner-intro">Build a brief to share with your team. This stays in your browser and does not book a demo.</p>
<fieldset><legend>Choose your evaluation priorities</legend>${s.pilot.checks.map((x,i)=>`<label class="planner-check"><input type="checkbox" name="priority" value="${e(x)}"${i===0?' checked':''}><span>${e(x)}</span></label>`).join('\n')}</fieldset>
<label for="pilot-outcome">What would success look like? <span>(optional)</span></label>
<textarea id="pilot-outcome" name="outcome" rows="3" maxlength="600" aria-describedby="pilot-privacy" placeholder="For example: every new starter has a named onboarding owner."></textarea>
<p class="planner-help" id="pilot-privacy">Use sample details, not personal or confidential employee information. Nothing is submitted or saved on reload.</p>
<button class="enterprise-button" type="submit">Create pilot brief ${arrow}</button><p class="planner-error" id="pilot-error" role="alert"></p>
<div class="planner-result" hidden><p role="status">Your brief is ready. Download it to keep a copy.</p><a class="enterprise-text-link" data-pilot-download download="hirebrew-${s.slug}-pilot.txt">Download your brief ${arrow}</a></div>
</form>
</section>
<section class="solution-questions enterprise-wrap" id="questions" aria-labelledby="questions-title"><h2 id="questions-title">A few good questions.</h2><div class="enterprise-faq">${s.faqs.map(x=>`<details><summary>${e(x.q)}<span aria-hidden="true">+</span></summary><p>${e(x.a)}</p></details>`).join('\n')}</div></section>
<section class="solution-related enterprise-wrap" aria-labelledby="related-title"><div><h2 id="related-title">Keep exploring.</h2><a class="enterprise-text-link" href="../solutions.html">All solutions ${arrow}</a></div><ul>${s.related.map(slug=>{const x=solutions.find(x=>x.slug===slug);return `<li><a href="${slug}.html"><span>${categories[x.category].name}</span><strong>${e(x.name)}</strong>${arrow}</a></li>`;}).join('')}</ul></section>
<section class="solution-close"><div class="enterprise-wrap"><h2>Good people.<br> A clearer way forward.</h2><a class="enterprise-button" href="#pilot">Plan your pilot ${arrow}</a></div></section>
</main>
${footer(p)}
<script type="application/json" id="pilot-content">${JSON.stringify({name:s.name,slug:s.slug,brief:brief(s)}).replace(/</g,'\\u003c')}</script>
</body>
</html>\n`;
}
async function directory(){return `${head('Hirebrew solutions | Find your people workflow','Find Hirebrew solutions for 3 business sizes, 5 teams and 16 industries. Explore tailored hiring, onboarding, people operations and development workflows.','')}
<body class="enterprise-page marketing-theme solution-directory">
${header('','enterprise.html#rollout')}
<main id="main">
<section class="solution-hero enterprise-wrap" aria-labelledby="page-title"><p class="solution-breadcrumb">Hirebrew solutions</p><h1 id="page-title">Your business is different.<br> Your people come first.</h1><div class="solution-hero-bottom"><p>Find your starting point. Build a more connected people journey around the way your organisation actually works.</p><a class="enterprise-button" href="#industries">Explore your industry ${arrow}</a></div></section>
${renderStoryDemo(await loadSolutionScene('hr-teams'))}
<nav class="solution-sections enterprise-wrap" aria-label="Solution categories"><a href="#business-sizes">By business size <span>3</span></a><a href="#teams">By team <span>5</span></a><a href="#industries">By industry <span>16</span></a></nav>
<div class="directory-search enterprise-wrap" hidden><label for="solution-search">Find a solution</label><div><input id="solution-search" type="search" placeholder="Try construction, finance or HR" aria-describedby="search-status"><button type="button" data-clear-search hidden>Clear search</button></div><p id="search-status" role="status" aria-live="polite">24 solutions to explore.</p></div>
${Object.entries(categories).map(([key,c])=>`<section class="directory-group enterprise-wrap" id="${c.id}" aria-labelledby="${c.id}-title" data-directory-group><div class="directory-heading"><div><p>${c.name}</p><h2 id="${c.id}-title">${c.title}</h2></div><p>${c.description}</p></div><div class="directory-grid directory-${key}">${solutions.filter(s=>s.category===key).sort((a,b)=>key==='industry'?a.name.localeCompare(b.name):0).map(s=>`<a class="directory-item" id="${s.legacyId}" href="solutions/${s.slug}.html" data-directory-item data-search="${e(`${s.name} ${c.name} ${s.summary}`.toLowerCase())}"><h3>${e(s.name)}</h3><p>${e(s.summary)}</p><span>Explore solution ${arrow}</span></a>`).join('\n')}</div></section>`).join('\n')}
<div class="directory-empty enterprise-wrap" hidden><h2>No matching solutions yet.</h2><p>Try a business size, team or industry, or clear the search to see every option.</p><button type="button" class="enterprise-button" data-clear-search>Show all solutions</button></div>
<section class="solution-close"><div class="enterprise-wrap"><h2>Start with a workflow.<br> Build from there.</h2><a class="enterprise-button" href="index.html#tour">Take the product tour ${arrow}</a></div></section>
</main>
${footer('')}
</body>
</html>\n`;}
await mkdir(path.join(root,'solutions'),{recursive:true});
await mkdir(path.join(root,'assets/resources/pilots'),{recursive:true});
for(const s of solutions){
 await writeFile(path.join(root,'solutions',`${s.slug}.html`),await page(s));
 await writeFile(path.join(root,'assets/resources/pilots',`${s.slug}.txt`),brief(s));
}
await writeFile(path.join(root,'solutions.html'),await directory());
console.log(`Built ${solutions.length} dedicated solution pages, directory and tailored pilot briefs.`);

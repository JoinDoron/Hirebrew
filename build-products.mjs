/* Product copy is authored separately; output works on any static host. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {e,arrow,head,header,footer} from './marketing-shell.mjs';
import {renderStoryDemo,loadProductScene} from './demo-scenes.mjs';

const root=path.dirname(fileURLToPath(import.meta.url));
const products=(await Promise.all(['products-core.json','products-growth.json'].map(file=>readFile(path.join(root,'content',file),'utf8').then(JSON.parse)))).flat();
const solutions=(await Promise.all(['solutions-business.json','solutions-industries-a.json','solutions-industries-b.json'].map(file=>readFile(path.join(root,'content',file),'utf8').then(JSON.parse)))).flat();
assert.deepEqual(products.map(p=>p.slug),['hire','onboard','people','grow','intelligence','brew-ai']);
for(const p of products){
 for(const key of ['name','metaTitle','metaDescription','headline','subhead','summary','challengeTitle','challenge','workflowTitle','workflowIntro'])assert.ok(typeof p[key]==='string'&&p[key].trim(),`${p.slug}: ${key}`);
 for(const [key,count] of Object.entries({priorities:3,steps:4,capabilities:4,useCases:3,faqs:3,related:2,audiences:2}))assert.equal(p[key].length,count,`${p.slug}: ${key}`);
 assert.equal(p.pilot.checks.length,3);
 for(const related of p.related)assert.ok(related.slug!==p.slug&&products.some(x=>x.slug===related.slug));
 for(const audience of p.audiences)assert.ok(solutions.some(x=>x.slug===audience.slug));
 assert.match(p.demo.href,/^index\.html(?:\?(?:perspective|product)=[a-z-]+)?#(?:tour|brew|platform)$/);
}
const brief=p=>`HIREBREW ${p.name.toUpperCase()} | PRODUCT PILOT BRIEF\n\n${p.headline}\n${p.subhead}\n\nCAPABILITIES TO EXPLORE\n${p.capabilities.map(c=>`${c.name}\n${c.body}`).join('\n\n')}\n\nPRACTICAL USE CASES\n${p.useCases.map(c=>`${c.title}\nSituation: ${c.situation}\nWorkflow: ${c.workflow}\nIntended improvement: ${c.outcome}`).join('\n\n')}\n\nWORKFLOW\n${p.workflowTitle}\n${p.steps.map(s=>`${s.label} | ${s.owner}\n${s.title}\n${s.body}`).join('\n\n')}\n\nPILOT\n${p.pilot.title}\n${p.pilot.body}\n\nEVALUATION CHECKLIST\n${p.pilot.checks.map(c=>'[ ] '+c).join('\n')}\n\nSCOPE BOUNDARIES\n${p.pilot.boundary}\n\nAI AND HUMAN REVIEW\n${p.ai.body}\nExample prompt: ${p.ai.example}\n\nNEXT STEP\nAssign an owner, walk through the workflow with sample data and record the evidence required before a live rollout. This document is not a submitted enquiry, booking or confirmation of production readiness.\n`;
const planner=p=>`<form class="solution-planner" data-pilot-form hidden novalidate>
<h3>Make the pilot yours.</h3><p class="planner-intro">Choose what to evaluate in ${e(p.name)}. Download a brief for your team; nothing is submitted or booked.</p>
<fieldset><legend>Choose your evaluation priorities</legend>${p.pilot.checks.map((check,i)=>`<label class="planner-check"><input type="checkbox" name="priority" value="${e(check)}"${i===0?' checked':''}><span>${e(check)}</span></label>`).join('\n')}</fieldset>
<label for="pilot-outcome">What would success look like? <span>(optional)</span></label>
<textarea id="pilot-outcome" name="outcome" rows="3" maxlength="600" aria-describedby="pilot-privacy" placeholder="Describe the handoff or experience you want to improve."></textarea>
<p class="planner-help" id="pilot-privacy">Use sample details, not personal or confidential employee information. Nothing is submitted or saved on reload.</p>
<button class="enterprise-button" type="submit">Create pilot brief ${arrow}</button><p class="planner-error" id="pilot-error" role="alert"></p>
<div class="planner-result" hidden><p role="status">Your brief is ready. Download it to keep a copy.</p><a class="enterprise-text-link" data-pilot-download download="hirebrew-${p.slug}-product-pilot.txt">Download your brief ${arrow}</a></div>
</form>`;
async function productPage(p){return `${head(p.metaTitle,p.metaDescription,'../',{styles:['product-pages.css']})}
<body class="enterprise-page solution-page product-page product-${p.slug}" data-product="${p.slug}">
${header('../')}
<main id="main">
<section class="solution-hero enterprise-wrap" aria-labelledby="page-title">
<nav class="solution-breadcrumb" aria-label="Breadcrumb"><a href="../platform.html">Platform</a><span aria-hidden="true">/</span><span aria-current="page">Hirebrew ${e(p.name)}</span></nav>
<h1 id="page-title">${e(p.headline)}</h1>
<div class="solution-hero-bottom"><p>${e(p.subhead)}</p><div class="solution-hero-actions"><a class="enterprise-button" href="#pilot">Plan your pilot ${arrow}</a><a class="enterprise-text-link" href="#story-demo">Watch the demo ${arrow}</a></div></div>
</section>
${renderStoryDemo(await loadProductScene(p.slug),'../')}
<nav class="solution-sections enterprise-wrap" aria-label="On this page"><a href="#why">Why ${e(p.name)}</a><a href="#capabilities">Capabilities</a><a href="#use-cases">Use cases</a><a href="#workflow">How it connects</a><a href="#questions">Questions</a></nav>
<section class="solution-opportunity enterprise-wrap solution-space" id="why" aria-labelledby="why-title">
<div><h2 id="why-title">${e(p.challengeTitle)}</h2><p>${e(p.challenge)}</p></div>
<div class="solution-priorities">${p.priorities.map(x=>`<article><h3>${e(x.title)}</h3><p>${e(x.body)}</p></article>`).join('\n')}</div>
</section>
<section class="product-capability-section" id="capabilities" aria-labelledby="capabilities-title"><div class="enterprise-wrap">
<div class="solution-section-heading"><h2 id="capabilities-title">Inside Hirebrew ${e(p.name)}.</h2><p>Explore the features behind the promise. Agree the scope and deployment requirements before working with real employee data.</p></div>
<div class="product-capabilities">${p.capabilities.map(x=>`<article><h3>${e(x.name)}</h3><p>${e(x.body)}</p></article>`).join('\n')}</div>
</div></section>
<section class="product-use-cases enterprise-wrap solution-space" id="use-cases" aria-labelledby="use-cases-title">
<div class="product-use-case-heading"><h2 id="use-cases-title">Real work.<br> A clearer way through.</h2><p>Practical ways to evaluate ${e(p.name)} with your team. These are workflow examples, not customer case studies.</p></div>
<div class="product-case-list">${p.useCases.map((x,i)=>`<details${i===0?' open':''}><summary>${e(x.title)}<span aria-hidden="true">+</span></summary><div class="product-case-body"><p><strong>The situation</strong>${e(x.situation)}</p><p><strong>With Hirebrew</strong>${e(x.workflow)}</p><p class="product-case-outcome"><strong>What changes</strong>${e(x.outcome)}</p></div></details>`).join('\n')}</div>
</section>
<section class="solution-workflow solution-space" id="workflow" aria-labelledby="workflow-title"><div class="enterprise-wrap">
<div class="solution-section-heading"><h2 id="workflow-title">${e(p.workflowTitle)}</h2><p>${e(p.workflowIntro)}</p></div>
<p class="solution-workflow-note">Illustrative workflow. Select a stage to see who owns the next step.</p>
<div class="workflow-tabs" role="tablist" aria-label="Workflow handoffs" hidden>${p.steps.map((x,i)=>`<button type="button" role="tab" id="step-tab-${i}" aria-controls="step-${i}" aria-selected="${i===0}" tabindex="${i===0?0:-1}">${e(x.label)}<span aria-hidden="true">→</span></button>`).join('')}</div>
<div class="workflow-panels">${p.steps.map((x,i)=>`<article id="step-${i}" class="workflow-panel" aria-labelledby="step-title-${i}" data-workflow-panel><div class="workflow-owner"><span>Workflow owner</span><strong>${e(x.owner)}</strong></div><div><h3 id="step-title-${i}">${e(x.title)}</h3><p>${e(x.body)}</p></div></article>`).join('\n')}</div>
<div class="solution-workflow-foot"><p>Explore the relevant sample experience on the homepage.</p><a class="enterprise-text-link" href="../${e(p.demo.href)}">${e(p.demo.label)} ${arrow}</a></div>
</div></section>
<section class="solution-ai product-ai" id="assistance" aria-labelledby="assistance-title"><div class="enterprise-wrap solution-ai-layout">
<div><h2 id="assistance-title">${e(p.ai.title)}</h2><p>${e(p.ai.body)}</p><a class="enterprise-text-link" href="../index.html#brew">Try the illustrative AI drafts ${arrow}</a></div>
<aside class="solution-prompt"><span>Example prompt for human review</span><p>${e(p.ai.example)}</p><small>Illustrative only. No AI request is sent from this page.</small></aside>
</div></section>
<section class="solution-space enterprise-wrap solution-pilot-layout" id="pilot" aria-labelledby="pilot-title">
<div><h2 id="pilot-title">${e(p.pilot.title)}</h2><p>${e(p.pilot.body)}</p><aside class="solution-boundary"><h3>Clear scope. Informed decisions.</h3><p>${e(p.pilot.boundary)}</p></aside><a class="enterprise-text-link" href="../assets/resources/products/${p.slug}.txt" download>Download the starting brief ${arrow}</a></div>
${planner(p)}
</section>
<section class="solution-questions enterprise-wrap" id="questions" aria-labelledby="questions-title"><h2 id="questions-title">Good questions.<br> Clear answers.</h2><div class="enterprise-faq">${p.faqs.map(x=>`<details><summary>${e(x.q)}<span aria-hidden="true">+</span></summary><p>${e(x.a)}</p></details>`).join('\n')}</div></section>
<section class="product-connections enterprise-wrap" aria-labelledby="connections-title"><div class="solution-section-heading"><h2 id="connections-title">The next handoff<br> is already in view.</h2><p>${e(p.name)} is part of a connected people journey. Explore the products and perspectives around it.</p></div><div class="product-connection-grid"><div><h3>Connected products</h3>${p.related.map(r=>{const x=products.find(x=>x.slug===r.slug);return `<a href="${x.slug}.html"><strong>${e(x.name)} ${arrow}</strong><p>${e(r.why)}</p></a>`;}).join('\n')}</div><div><h3>Built around your context</h3>${p.audiences.map(a=>{const x=solutions.find(x=>x.slug===a.slug);return `<a href="../solutions/${x.slug}.html"><strong>${e(x.name)} ${arrow}</strong><p>${e(a.why)}</p></a>`;}).join('\n')}</div></div></section>
<section class="solution-close"><div class="enterprise-wrap"><h2>Make the next step<br> a better one.</h2><a class="enterprise-button" href="#pilot">Plan your pilot ${arrow}</a></div></section>
</main>
${footer('../')}
<script type="application/json" id="pilot-content">${JSON.stringify({name:p.name,slug:p.slug,brief:brief(p)}).replace(/</g,'\\u003c')}</script>
</body>
</html>\n`;}
async function platformPage(){return `${head('The Hirebrew platform | Hiring, people and growth connected','Explore Hirebrew Hire, Onboard, People, Grow, Intelligence and Brew AI. Six product perspectives on a connected employee journey.','',{styles:['product-pages.css']})}
<body class="enterprise-page solution-directory product-directory">
${header('','enterprise.html#rollout')}
<main id="main">
<section class="solution-hero enterprise-wrap" aria-labelledby="page-title"><p class="solution-breadcrumb">The Hirebrew platform</p><h1 id="page-title">One people story.<br> Every chapter connected.</h1><div class="solution-hero-bottom"><p>From the role you need to the people you grow. Explore six products designed around the moments between teams.</p><div class="solution-hero-actions"><a class="enterprise-button" href="#products">Explore the products ${arrow}</a><a class="enterprise-text-link" href="#story-demo">Watch the demo ${arrow}</a></div></div></section>
${renderStoryDemo(await loadProductScene('hire'))}
<nav class="solution-sections enterprise-wrap" aria-label="Platform products">${products.map(p=>`<a href="products/${p.slug}.html">${e(p.name)}</a>`).join('')}</nav>
<section class="product-directory-body enterprise-wrap" id="products" aria-labelledby="products-title"><div class="solution-section-heading"><h2 id="products-title">Start where the<br> work needs you.</h2><p>Each product page explains the use cases, participants and capabilities to evaluate. Start with one workflow, then explore the connections.</p></div><div class="product-catalog">${products.map(p=>`<article><div class="product-catalog-title"><h3>${e(p.name)}</h3>${p.slug==='brew-ai'?'<span>Human-reviewed assistance</span>':''}</div><p>${e(p.summary)}</p><ul>${p.capabilities.slice(0,3).map(c=>`<li>${e(c.name)}</li>`).join('')}</ul><a class="enterprise-text-link" href="products/${p.slug}.html">Explore ${e(p.name)} ${arrow}</a></article>`).join('\n')}</div><p class="product-preview-note">This website demonstrates sample workflows and product concepts. Live availability, integrations, permissions and AI services must be confirmed before a production rollout.</p></section>
<section class="product-journey-band"><div class="enterprise-wrap"><div class="solution-section-heading"><h2>A new hire is<br> only the beginning.</h2><p>A hiring decision becomes an onboarding responsibility, an employee request and a development conversation. Keep the context moving with the person.</p></div><ol class="product-journey">${products.filter(p=>p.slug!=='brew-ai').map(p=>`<li><a href="products/${p.slug}.html">${e(p.name)} ${arrow}</a><p>${e(p.summary)}</p></li>`).join('')}</ol><a class="enterprise-text-link" href="products/brew-ai.html">Explore how Brew AI supports human review ${arrow}</a></div></section>
<section class="solution-close"><div class="enterprise-wrap"><h2>Your priorities.<br> A practical starting point.</h2><a class="enterprise-button" href="solutions.html">Find your solution ${arrow}</a></div></section>
</main>
${footer('')}
</body>
</html>\n`;}
await mkdir(path.join(root,'products'),{recursive:true});
await mkdir(path.join(root,'assets/resources/products'),{recursive:true});
for(const p of products){await writeFile(path.join(root,'products',`${p.slug}.html`),await productPage(p));await writeFile(path.join(root,'assets/resources/products',`${p.slug}.txt`),brief(p));}
await writeFile(path.join(root,'platform.html'),await platformPage());
console.log('Built six dedicated product pages, platform overview and six product pilot briefs.');

// Pet weight chart and medication re-reminder: node tests/petweight.js (needs playwright). No network.
const {chromium}=require('playwright');const path=require('path');
const URL='file://'+path.resolve(__dirname,'..','index.html');let fails=0;
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
(async()=>{const b=await chromium.launch();
for(const lang of ['en','he']){
 const p=await b.newPage(),errs=[];p.on('pageerror',e=>{if(!/ServiceWorker/.test(e.message))errs.push(e.message)});
 await p.addInitScript(l=>{try{localStorage.setItem('lang',l)}catch(e){}},lang);
 await p.goto(URL);await p.evaluate(()=>{setDomain('pets')});await p.click('#t2');await p.click('[data-f=log]');
 const idx=await p.evaluate(()=>DOMAINS.pets.events.findIndex(e=>e.k==='weight'));const mi=await p.evaluate(()=>DOMAINS.pets.events.findIndex(e=>e.k==='meds'));
 const add=async(date,type,dose,rep)=>{await p.fill('#lp','Rex');await p.fill('#lc','Dog');await p.fill('#ld',date);await p.selectOption('#lt',String(type));await p.fill('#ls',dose);if(rep!=null)await p.fill('#lrp',String(rep));await p.click('#la');await p.waitForTimeout(150);try{await p.click('[data-f=log]')}catch(e){}};
 ok(await p.locator('#lrw').isHidden(),lang+': repeat-days field hidden for non-medication events');
 await p.selectOption('#lt',String(idx));ok(/kg|ק"ג/.test(await p.getAttribute('#ls','placeholder')),lang+': weighing shows a kg hint');
 await p.selectOption('#lt',String(mi));ok(await p.locator('#lrw').isVisible(),lang+': repeat-days field shown for medication');
 p.on('dialog',d=>d.accept());
 await add('2026-10-01',idx,'4.0');await p.click('#t2');await p.click('[data-f=log]');
 ok(/One more weighing|שקילה נוספת/.test(await p.innerText('#app')),lang+': a single weighing asks for one more');
 await add('2026-11-01',idx,'4,5');await p.click('#t2');await p.click('[data-f=log]');
 ok(await p.locator('svg[role=img] polyline').count()===1,lang+': weight chart drawn after two weighings');
 ok(/4\.5 kg/.test(await p.innerText('#app'))&&/\+0\.50/.test(await p.innerText('#app')),lang+': latest weight and change shown (comma decimal accepted)');
 ok(/10%|10 ?%/.test(await p.innerText('#app')),lang+': 12% change flags a vet check');
 await add('2026-11-10',mi,'5 ml',7);await p.waitForTimeout(150);
 const rem=await p.evaluate(()=>JSON.parse(localStorage.getItem('rem')||'[]'));
 ok(rem.some(r=>r.d==='2026-11-17'),lang+': medication with repeat 7 days adds a reminder for 2026-11-17 '+JSON.stringify(rem.map(r=>r.d)));
 ok(errs.length===0,lang+': no page errors '+errs.join(';'));await p.close()}
await b.close();console.log(fails?`\n${fails} FAILED`:'\nALL PASSED');process.exit(fails?1:0)})();

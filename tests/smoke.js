// Smoke tests: node tests/smoke.js  (needs playwright). Mocks the Gemini API, no key or network needed.
const {chromium,devices}=require('playwright');const path=require('path');
const URL='file://'+path.resolve(__dirname,'..','index.html');let fails=0;
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
(async()=>{
 // 1. i18n key parity
 global.window=global;require('../i18n.js');const he=Object.keys(I18N.he),en=Object.keys(I18N.en).filter(k=>k!=='crops');
 ok(he.every(k=>en.includes(k))&&en.every(k=>he.includes(k)),'i18n he/en keys match '+he.filter(k=>!en.includes(k)).concat(en.filter(k=>!he.includes(k))).join(','));
 require('../crops.js');ok(CROPS.every(c=>I18N.en.crops[c.id]),'every crop has an English translation');
 require('../farmer.js');ok(FARM.every(f=>f.en&&f.en.sections.length===f.sections.length),'every farm guide has English');
 const b=await chromium.launch();
 for(const lang of ['he','en']){
  const ctx=await b.newContext({...devices['Pixel 7'],locale:lang==='he'?'he-IL':'en-US'});const p=await ctx.newPage();const errs=[];
  p.on('pageerror',e=>/ServiceWorker/.test(e.message)||errs.push(e.message));p.on('dialog',d=>d.accept());
  let mode='ok';const calls=[];
  await p.route('https://generativelanguage.googleapis.com/**',r=>{const n=r.request().url();calls.push(n);const h={'access-control-allow-origin':'*'};
   if(mode==='overload'&&n.includes('3.5-flash:'))return r.fulfill({status:503,contentType:'application/json',headers:h,body:'{"error":{"message":"high demand"}}'});
   r.fulfill({contentType:'application/json',headers:h,body:JSON.stringify({candidates:[{content:{parts:[{text:'MOCK-ANSWER'}]}}]})})});
  await p.goto(URL);await p.evaluate(l=>setLang(l),lang);
  const txt=async()=>await p.innerText('body');
  ok((await p.evaluate(()=>document.documentElement.lang))===lang,lang+': html lang set');
  for(const [id,name] of [['t1','home'],['t2','farm'],['t3','diag'],['t4','help'],['t5','about']]){await p.click('#'+id);const t=await txt();ok(!/undefined|NaN|\[object/.test(t),`${lang}: ${name} tab has no undefined`)}
  if(lang==='en'){await p.click('#t2');for(const f of ['log','ask','guides']){await p.click(`[data-f=${f}]`);ok(!/[֐-׿]/.test((await txt()).replace(/עברית/g,'')),`en: farm/${f} has no Hebrew`)}
   await p.click('#t5');ok(!/[֐-׿]/.test((await txt()).replace(/עברית/g,'')),'en: about has no Hebrew')}
  // home crops and detail
  await p.click('#t1');await p.click('[data-id=strawberry]');ok(/🍓/.test(await txt()),lang+': crop detail opens');
  // farm log
  await p.click('#t2');await p.click('[data-f=log]');await p.fill('#lp','Plot A');await p.fill('#lc','Strawberry');await p.click('#la');
  ok((await txt()).includes('Plot A'),lang+': log entry saved');
  await p.selectOption('#lk','ins');await p.fill('#lb','Dani');await p.fill('#lp','Plot A');await p.fill('#lc','Strawberry');await p.click('#la');
  ok(await p.locator('[data-ok]').count()===1,lang+': instruction open');await p.click('[data-ok]');ok(await p.locator('[data-ok]').count()===0,lang+': instruction marked done');
  // key + speed test
  await p.click('#t4');await p.fill('#key','AIzaTEST');await p.click('#sk');await p.click('#st');await p.waitForTimeout(700);ok(!/❌/.test(await p.innerText('#so')),lang+': speed test passes (mock)');
  // diagnosis (with overload on 3.5-flash -> others win)
  mode='overload';await p.click('#t3');await p.setInputFiles('#ph',path.resolve(__dirname,'..','icon-192.png'));await p.click('#ai');await p.waitForTimeout(800);
  ok((await p.innerText('#out')).includes('MOCK-ANSWER'),lang+': diagnosis returns despite one model overloaded');
  // advisor
  await p.click('#t2');await p.click('[data-f=ask]');await p.fill('#aq','q');await p.click('#ab');await p.waitForTimeout(500);ok((await p.innerText('#ao')).includes('MOCK-ANSWER'),lang+': advisor answers');
  ok(errs.length===0,lang+': no page errors '+errs.join(';'));await ctx.close()}
 await b.close();console.log(fails?`\n${fails} FAILED`:'\nALL PASSED');process.exit(fails?1:0)})()

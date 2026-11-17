// Aquarium readings log and cycle tracker: node tests/water.js (needs playwright). No network.
const {chromium}=require('playwright');const path=require('path');
const URL='file://'+path.resolve(__dirname,'..','index.html');let fails=0;
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
(async()=>{const b=await chromium.launch();
for(const lang of ['en','he']){
 const p=await b.newPage(),errs=[];p.on('pageerror',e=>{if(!/ServiceWorker/.test(e.message))errs.push(e.message)});
 await p.addInitScript(l=>{try{localStorage.setItem('lang',l)}catch(e){}},lang);
 await p.goto(URL);await p.evaluate(()=>{setDomain('aquarium')});await p.click('#t2');await p.click('[data-f=calc]');
 // no tank name: saving is refused with a message
 await p.fill('#cno','30');await p.click('#wsv');ok((await p.innerText('#wmsg')).length>5,lang+': saving without a tank name is refused with a message');
 const start=new Date(Date.now()-9*864e5).toISOString().slice(0,10);
 await p.fill('#tnm','Main');await p.fill('#cl','100');await p.fill('#cw','40');await p.fill('#ch','40');await p.fill('#tsd',start);await p.click('#tsv');await p.waitForTimeout(100);
 await p.click('#t2');await p.click('[data-f=calc]');
 ok((await p.inputValue('#tsd'))===start,lang+': tank start date is saved with the profile');
 ok(/9/.test(await p.innerText('#cyc'))&&/No readings|עוד אין מדידות/.test(await p.innerText('#cyc')),lang+': cycle card shows day 9 and asks for readings');
 const save=async(no,a,ni)=>{await p.fill('#cno',String(no));await p.fill('#ca',String(a));await p.fill('#cni',String(ni));await p.click('#wsv')};
 await save(0,2,0);ok(/Stage 1|שלב 1/.test(await p.innerText('#cyc')),lang+': ammonia only is stage 1');
 await save(5,1,1);ok(/Stage 2|שלב 2/.test(await p.innerText('#cyc')),lang+': nitrite is stage 2');
 await save(20,0,0);ok(/complete|הסתיים/.test(await p.innerText('#cyc')),lang+': zero ammonia and nitrite with nitrate means cycle looks complete');
 ok(await p.locator('#wch svg').count()>=1,lang+': a trend chart is drawn after two or more readings');
 ok(await p.locator('#wls .note').count()===3,lang+': history lists the saved readings');
 const stored=await p.evaluate(()=>JSON.parse(localStorage.getItem('wlog')||'{}'));ok(stored.Main&&stored.Main.length===3,lang+': readings persisted per tank');
 const snap=await p.evaluate(()=>({tanks:localStorage.getItem('tanks'),wlog:localStorage.getItem('wlog')}));await p.close();
 const q=await b.newPage();q.on('pageerror',e=>{if(!/ServiceWorker/.test(e.message))errs.push(e.message)});
 await q.addInitScript(([l,t,w])=>{try{localStorage.setItem('lang',l);localStorage.setItem('tanks',t);localStorage.setItem('wlog',w)}catch(e){}},[lang,snap.tanks,snap.wlog]);
 await q.goto(URL);await q.evaluate(()=>{setDomain('aquarium')});await q.click('#t2');await q.click('[data-f=calc]');
 ok(await q.locator('#wls .note').count()===3&&await q.locator('#wch svg').count()>=1,lang+': saved history and charts render from stored data on a fresh load');
 ok(errs.length===0,lang+': no page errors '+errs.join(';'));await q.close()}
await b.close();console.log(fails?`\n${fails} FAILED`:'\nALL PASSED');process.exit(fails?1:0)})();

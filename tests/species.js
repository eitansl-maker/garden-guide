// Species overlay + language tests: node tests/species.js (needs playwright)
const {chromium,devices}=require('playwright');const path=require('path');
const URL='file://'+path.resolve(__dirname,'..','index.html');let fails=0;
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
(async()=>{const b=await chromium.launch();
 for(const lang of ['he','en','de','da','fi','pt']){
  const p=await (await b.newContext({...devices['Pixel 7']})).newPage();const errs=[];p.on('pageerror',e=>/ServiceWorker/.test(e.message)||errs.push(e.message));p.on('dialog',d=>d.accept());
  await p.route('https://eoyfkteuzyqychgkzihv.supabase.co/**',r=>r.abort());
  await p.goto(URL);await p.evaluate(l=>setLang(l),lang);
  ok((await p.evaluate(()=>document.documentElement.lang))===lang,lang+': html lang');
  for(const id of ['t1','t2','t3','t4','t5']){await p.click('#'+id);const t=await p.innerText('body');ok(!/undefined|NaN|\[object/.test(t),lang+': tab '+id+' clean')}
  // pets and fish tabs
  for(const d of ['pets','aquarium']){await p.evaluate(x=>setDomain(x),d);await p.click('#t1');const t=await p.innerText('body');ok(!/undefined|NaN|\[object/.test(t),lang+': '+d+' home clean')}
  await p.evaluate(()=>setDomain('plants'));
  ok(errs.length===0,lang+': no page errors '+errs.join('|'));await p.context().close()}
 // overlay: a new crop with country filter, new pet translation
 {const p=await (await b.newContext({...devices['Pixel 7']})).newPage();await p.route('https://eoyfkteuzyqychgkzihv.supabase.co/**',r=>r.abort());await p.goto(URL);await p.evaluate(()=>setLang('de'));
  await p.evaluate(()=>{const he={name:"אוכמנית",water:"w",why:"y",sun:"s",tips:"t",harvest:"h"},de={name:"Heidelbeere",water:"w",why:"y",sun:"s",tips:"t",harvest:"h"};
   SPECIES.apply({species:[{domain:"plants",key:"blueberry",attrs:{emoji:"🫐",pack:"veg"}},{domain:"pets",key:"dog",attrs:{emoji:"🐕"}}],
    info:[{domain:"plants",key:"blueberry",lang:"he",content:he},{domain:"plants",key:"blueberry",lang:"de",content:de},{domain:"pets",key:"dog",lang:"de",content:{name:"Hund",feed:"f",water:"w",move:"m",vet:"v",tips:"t"}}],
    country:[{domain:"plants",key:"blueberry",country:"DE",months:[1,2,3,4,5,6,7,8,9,10,11,12]}]})});
  await p.evaluate(()=>{CC="DE"});await p.click('#t1');ok((await p.innerText('body')).includes('Heidelbeere'),'DE: blueberry visible with German name');
  await p.evaluate(()=>{CC="IL"});await p.click('#t2');await p.click('#t1');ok(!(await p.innerText('body')).includes('Heidelbeere'),'IL: blueberry hidden by country');
  ok(await p.evaluate(()=>DOMAINS.pets.items.find(x=>x.id==='dog').de.name==='Hund'),'pet German content applied')}
 await b.close();console.log(fails?fails+' FAILED':'ALL PASSED');process.exit(fails?1:0)})();

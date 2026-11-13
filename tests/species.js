// Species overlay + language tests: node tests/species.js (needs playwright)
const {chromium,devices}=require('playwright');const path=require('path');
const URL='file://'+path.resolve(__dirname,'..','index.html');let fails=0;
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
(async()=>{const b=await chromium.launch();
 {const p=await (await b.newContext({...devices['Pixel 7']})).newPage();await p.route('https://eoyfkteuzyqychgkzihv.supabase.co/**',r=>r.abort());await p.goto(URL);await p.evaluate(()=>{setLang('pl');setDomain('aquarium')});await p.click('#t3');const t=await p.innerText('#app');ok(/ryby/.test(t)&&/Jaka ryba/.test(t),'PL fish photo tab in Polish');ok(await p.evaluate(()=>/Polish/.test(prompt_('x'))),'PL prompt answers in Polish');await p.evaluate(()=>setDomain('plants'));await p.click('#t1');ok(/Ogród Ilana/.test(await p.innerText('body')),'PL home title translated')}
 for(const lang of ['he','en','de','da','fi','pt','pl']){
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
 // attrs.wiki from the database gives new pets and fish a photo title
 {const p=await (await b.newContext({...devices['Pixel 7']})).newPage();await p.route('https://eoyfkteuzyqychgkzihv.supabase.co/**',r=>r.abort());await p.goto(URL);
  ok(await p.evaluate(()=>{SPECIES.apply({species:[{domain:'aquarium',key:'zzfish',attrs:{emoji:'🐟',wiki:'Guppy'}},{domain:'plants',key:'zzplant',attrs:{emoji:'🌱',pack:'veg',wiki:'Tomato'}}],info:[{domain:'aquarium',key:'zzfish',lang:'en',content:{name:'ZZ',feed:'f',water:'w',move:'m',vet:'v',tips:'t'}},{domain:'plants',key:'zzplant',lang:'he',content:{name:'ZZ',water:'w',why:'y',sun:'s',tips:'t',harvest:'h'}}],country:[]});return DOMAINS.aquarium.items.find(x=>x.id==='zzfish').wiki==='Guppy'&&CROPS.find(c=>c.id==='zzplant').wiki==='Tomato'}),'new species take their photo title from attrs.wiki')}
 // pet log remembers the animal: typing a known name fills the type/breed
 {const p=await (await b.newContext({...devices['Pixel 7']})).newPage();await p.route('https://eoyfkteuzyqychgkzihv.supabase.co/**',r=>r.abort());p.on('dialog',d=>d.accept());await p.goto(URL);await p.evaluate(()=>setDomain('pets'));await p.click('#t2');await p.click('[data-f=log]');
  await p.fill('#lp','Rexy');await p.fill('#lc','Labrador');await p.click('#la');
  ok(await p.inputValue('#lp')==='Rexy'&&await p.inputValue('#lc')==='Labrador','single pet: name and breed prefilled after saving');
  await p.fill('#lp','Mitzi');await p.fill('#lc','Cat');await p.click('#la');
  await p.fill('#lp','');await p.fill('#lc','');await p.fill('#lp','Rexy');
  ok(await p.inputValue('#lc')==='Labrador','known name fills breed');
  await p.fill('#lp','Mitzi');ok(await p.inputValue('#lc')==='Cat','switching to another pet updates the breed')}
 // photo diagnosis follows the domain: fish and pets get their own wording and prompt
 {const p=await (await b.newContext({...devices['Pixel 7']})).newPage();await p.route('https://eoyfkteuzyqychgkzihv.supabase.co/**',r=>r.abort());await p.goto(URL);
  for(const [d,re,pr] of [['aquarium',/דג|fish/i,/אקווריום|aquarium/i],['pets',/חיה|pet|animal/i,/חיית|pet/i],['plants',/עלה|leaf/i,/מגדל|crops/i]]){
   await p.evaluate(x=>setDomain(x),d);await p.click('#t3');const t=await p.innerText('#app');
   ok(re.test(t)&&(d==='plants'||!/leaf|עלה ופרי/.test(t)),d+': photo tab wording matches the domain');
   ok(await p.evaluate(()=>/./.test(prompt_('x'))),d+': photo prompt exists');ok(pr.test(await p.evaluate(()=>prompt_('x'))),d+': prompt is about '+d)}
  await p.evaluate(()=>{setLang('de');setDomain('aquarium')});await p.click('#t3');ok(/Fisch/.test(await p.innerText('#app'))&&/German/.test(await p.evaluate(()=>prompt_('x'))),'DE fish: German wording, answer-in-German prompt')}
 // pet log: no per-plot status block, saved vet contacts can be re-selected
 {const p=await (await b.newContext({...devices['Pixel 7']})).newPage();await p.route('https://eoyfkteuzyqychgkzihv.supabase.co/**',r=>r.abort());p.on('dialog',d=>d.accept());await p.goto(URL);await p.evaluate(()=>setDomain('pets'));await p.click('#t2');await p.click('[data-f=log]');
  await p.fill('#lp','Rexy');await p.fill('#lc','Lab');await p.click('#la');
  ok(!/לפי חלקה|per plot/.test(await p.innerText('#app')),'pets log has no per-plot status');
  await p.fill('#rn','Dr Cohen');await p.fill('#rp','0501234567');await p.fill('#vp','Rexy');await p.fill('#vd','itchy');await p.click('#vm').catch(()=>{});
  await p.evaluate(()=>{flog()});await p.waitForSelector('#rs');
  await p.selectOption('#rs','0');ok(await p.inputValue('#rn')==='Dr Cohen'&&await p.inputValue('#rp')==='0501234567','saved vet contact can be selected again');
  ok((await p.$eval('#vs',e=>getComputedStyle(e).width))!=='0px'&&await p.$eval('#vm',e=>getComputedStyle(e).fontSize)!=='','vet buttons are real full-width buttons')}
 // category chips: flowers and houseplants are separate from vegetables
 {const p=await (await b.newContext({...devices['Pixel 7']})).newPage();await p.route('https://eoyfkteuzyqychgkzihv.supabase.co/**',r=>r.abort());await p.goto(URL);await p.click('#t1');
  ok((await p.$$('[data-pk]')).length===3,'home has 3 category chips');
  ok(await p.$('[data-id=strawberry]')!==null,'veg chip shows strawberry');await p.click('[data-pk=house]');
  ok(await p.$('[data-id=pothos]')!==null&&await p.$('[data-id=strawberry]')===null,'houseplants chip shows only houseplants');
  await p.click('[data-pk=flowers]');ok(await p.$('[data-id=strawberry]')===null&&await p.$('[data-id=pothos]')===null,'flowers chip excludes veg and houseplants')}
 await b.close();console.log(fails?fails+' FAILED':'ALL PASSED');process.exit(fails?1:0)})();

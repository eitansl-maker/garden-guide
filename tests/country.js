// Country selection test: node tests/country.js (needs playwright)
const {chromium}=require('playwright');const path=require('path');let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
(async()=>{const b=await chromium.launch();
 for(const lang of['he','en']){const p=await b.newPage();await p.goto('file://'+path.resolve(__dirname,'..','index.html'));await p.evaluate(l=>setLang(l),lang);
  await p.click('#t4');await p.selectOption('#cs','DK');
  ok(await p.evaluate(()=>localStorage.getItem('country'))==='DK',lang+': country saved');
  ok(await p.evaluate(()=>prompt_('x').includes(L==='he'?'בדנמרק':'in Denmark')),lang+': diagnosis prompt uses the country');
  await p.click('#t2');await p.click('[data-f=guides]');const t=await p.innerText('#kn');ok(/miljøstyrelsen|Miljøstyrelsen/i.test(t),lang+': local sources shown for Denmark');
  ok(await p.evaluate(()=>{setCountry('PT');const r=cName()&&COUNTRIES.PT.src.length===2&&cIn().length>3&&sowMonths(CROPS[0]).length>0;setCountry('IL');return r}),lang+': Portugal is available');
  await p.click('#t1');ok(/./.test(await p.innerText('#app'))&&(await p.innerText('#app')).length>20,lang+': home still renders');
  ok(await p.evaluate(()=>{const c=CROPS.find(x=>x.id==='tomato');CC='DK';const d=sowMonths(c).join();CC='FI';const f=sowMonths(c).join();CC='IL';return d==='4,5,6'&&f==='5,6,7'&&sowMonths(c).join()===c.months.join()}),lang+': sowing months follow climate');
  ok(await p.evaluate(()=>{setDomain('pets');home();const a=document.getElementById('app').innerText;const pr=prompt_('x');setDomain('plants');home();return /⚠/.test(a)&&a.length>40&&/vet|וטרינר/i.test(pr)&&document.querySelectorAll('#app .card').length>3}),lang+': pets domain renders from its pack and plants return');
  ok(await p.evaluate(()=>{const A=document.getElementById('app');const ids=new Set();for(const pk of packsOf('plants')){HPK=pk.id;home();A.querySelectorAll('[data-id]').forEach(x=>ids.add(x.dataset.id))}HPK='veg';home();const chips=A.querySelectorAll('[data-pk]').length;return ids.size>=CROPS.length&&chips===3&&packsOf('plants').length===3&&CROPS.every(c=>cropPack(c,'plants'))&&hasPack('plants','flowers')}),lang+': packs shown as category chips, default all open');
  ok(await p.evaluate(()=>{const A=document.getElementById('app');const grab=()=>{const o={};for(const pk of packsOf('plants')){HPK=pk.id;home();o[pk.id]={ids:[...A.querySelectorAll('[data-id]')].map(x=>x.dataset.id),lock:/🔒/.test(A.innerText)}}HPK='veg';return o};
   PACKS_ENFORCE=true;localStorage.setItem('ent','["plants:flowers"]');let g=grab();const locked=g.veg.lock&&g.house.lock&&!g.flowers.lock&&g.veg.ids.length===0&&g.house.ids.length===0&&g.flowers.ids.includes('marigold');
   localStorage.setItem('ent','["plants"]');g=grab();const all=!g.veg.lock&&!g.flowers.lock&&!g.house.lock&&g.veg.ids.includes('tomato')&&g.house.ids.includes('pothos');
   localStorage.setItem('ent','[]');PACKS_ENFORCE=false;home();return locked&&all&&hasPack('pets')&&hasPack('plants','veg')}),lang+': entitlements lock/unlock by pack and domain, off by default');
  ok(await p.evaluate(()=>{const c=CROPS.find(x=>x.id==='tomato');CC='PT';const a=sowMonths(c).join();CC='AU';const s=sowMonths(c).join();CC='IL';return a==='3,4,5'&&s==='10,11,12'&&COUNTRIES.AU.src.length===2}),lang+': Portugal has its own calendar, southern hemisphere shifts 6 months');
  ok(await p.evaluate(()=>{setCountry('PT');const a=document.getElementById('ac').textContent.includes('🇵🇹');setCountry('IL');return a&&document.getElementById('ac').textContent.includes('🇮🇱')}),lang+': header flag follows the country');
  await p.close()}
 await b.close();process.exit(fails?1:0)})();

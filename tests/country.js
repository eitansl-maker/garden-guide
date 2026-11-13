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
  await p.close()}
 await b.close();process.exit(fails?1:0)})();

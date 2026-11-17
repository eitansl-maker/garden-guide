// Farm guides by country: Israeli guides carry a Middle East research notice elsewhere: node tests/guides.js (needs playwright).
const {chromium}=require('playwright');const path=require('path');
const URL='file://'+path.resolve(__dirname,'..','index.html');let fails=0;
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
(async()=>{const b=await chromium.launch();
for(const [lang,ctry,re] of [['en','DE',/Middle Eastern country/],['de','DK',/Nahen Ostens|Mellemøsten/],['he','PL',/במזרח התיכון/],['en','IL',null]]){
 const p=await b.newPage(),errs=[];p.on('pageerror',e=>{if(!/ServiceWorker/.test(e.message))errs.push(e.message)});
 await p.addInitScript(([l,c])=>{try{localStorage.setItem('lang',l);localStorage.setItem('country',c)}catch(e){}},[lang,ctry]);
 await p.goto(URL);await p.click('#t2');await p.click('[data-f=guides]');
 const list=await p.innerText('#app');
 if(re){ok(re.test(list),lang+'/'+ctry+': list marks research from the Middle East');
  await p.click('[data-g]');const d=await p.innerText('#app');ok(re.test(d),lang+'/'+ctry+': guide page shows the notice')}
 else{ok(!/Middle Eastern country/.test(list),lang+'/'+ctry+': Israeli guides in Israel carry no foreign notice');await p.click('[data-g]');ok(!/Middle Eastern country/.test(await p.innerText('#app')),lang+'/'+ctry+': guide page has no notice in Israel')}
 ok(errs.length===0,lang+'/'+ctry+': no page errors '+errs.join(';'));await p.close()}
await b.close();console.log(fails?`\n${fails} FAILED`:'\nALL PASSED');process.exit(fails?1:0)})();

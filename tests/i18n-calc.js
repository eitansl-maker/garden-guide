// Aquarium calculator / log / pet weight strings exist in every language: node tests/i18n-calc.js (needs playwright). No network.
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
const URL='file://'+path.resolve(__dirname,'..','index.html');let fails=0;
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
const LANGS=['de','da','fi','pt','pl'];
(async()=>{
 // static: every English string passed to lb(...), fld(...), lbt(...) in index.html has all five translations
 const src=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
 const q='"((?:[^"\\\\]|\\\\.)*)"';
 const en=new Set();
 for(const m of src.matchAll(new RegExp('\\blb\\('+q+','+q,'g')))en.add(m[2]);
 for(const m of src.matchAll(new RegExp('\\bfld\\("[a-z]+",'+q+','+q,'g')))en.add(m[2]);
 for(const m of src.matchAll(new RegExp('lbt\\([^,]+,'+q+','+q,'g')))en.add(m[2]);
 const b=await chromium.launch();const p=await b.newPage();const errs=[];p.on('pageerror',e=>{if(!/ServiceWorker/.test(e.message))errs.push(e.message)});
 await p.goto(URL);
 const miss=await p.evaluate(([list,langs])=>list.filter(e=>!window.CT[e]||langs.some(l=>!CT[e][l])),[[...en].map(e=>{try{return JSON.parse('"'+e+'"')}catch(x){return e}}),LANGS]);
 ok(en.size>40,'found '+en.size+' English strings in the calculator, log and weight code');
 ok(miss.length===0,'every one has de, da, fi, pt and pl translations'+(miss.length?': '+miss.slice(0,3).join(' | '):''));
 ok(await p.evaluate(()=>Object.values(CT).every(v=>{const a=(v.de.match(/\{\d\}/g)||[]).join();return ['da','fi','pt','pl'].every(l=>(v[l].match(/\{\d\}/g)||[]).join()===a)})),'placeholders are the same in every language');
 // rendered: calculator in each language shows no English labels
 for(const lang of LANGS){
  const pg=await b.newPage();await pg.addInitScript(l=>{try{localStorage.setItem('lang',l)}catch(e){}},lang);await pg.goto(URL);
  await pg.evaluate(()=>{setDomain('aquarium')});await pg.click('#t2');await pg.click('[data-f=calc]');
  const t=await pg.innerText('#app');
  ok(!/Tank profile|Calculate|Readings and water change|Save profile|Temperature \(C\)/.test(t),lang+': calculator has no English labels');
  await pg.close()}
 ok(errs.length===0,'no page errors '+errs.join(';'));
 await b.close();console.log(fails?`\n${fails} FAILED`:'\nALL PASSED');process.exit(fails?1:0)})();

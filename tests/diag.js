// Structured diagnosis test: node tests/diag.js (needs playwright). Mocks Gemini, no key or network.
const {chromium}=require('playwright');const path=require('path');
const URL='file://'+path.resolve(__dirname,'..','index.html');let fails=0;
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
(async()=>{const b=await chromium.launch();
for(const mode of ['json','text']){
 const p=await b.newPage(),errs=[];p.on('pageerror',e=>errs.push(e.message));let sent=null;
 await p.route('**/generativelanguage.googleapis.com/**',r=>{sent=JSON.parse(r.request().postData());const txt=mode==='json'?JSON.stringify({what:'Yellowing leaf edges',urgency:'high',certainty:'unsure',causes:['Overwatering'],check:['Drainage'],steps:['Water less'],ask_expert:true,ask_expert_why:'Unclear photo'}):'plain text answer';r.fulfill({json:{candidates:[{content:{parts:[{text:txt}]}}]}})});
 await p.addInitScript(()=>{try{localStorage.setItem('gkey','AIzaTEST')}catch(e){}});
 await p.goto(URL);await p.waitForTimeout(800);
 await p.evaluate(()=>{TAB="diag";tabs();diag()});
 await p.setInputFiles('#ph',{name:'a.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==','base64')});
 await p.click('#ai');await p.waitForTimeout(1500);
 const t=await p.innerText('#out');
 ok(!!(sent&&sent.generationConfig&&sent.generationConfig.responseSchema),mode+': request asks for a JSON schema');
 if(mode==='json'){ok(/Yellowing leaf edges/.test(t)&&/Urgent/.test(t)&&/Not sure/.test(t),'json: card shows what, urgency and certainty');ok(/Worth asking a professional: Unclear photo/.test(t),'json: expert warning shown when asked');ok(!/\{|"what"/.test(t),'json: no raw JSON on screen')}
 else ok(t.trim()==='plain text answer','text: non-JSON answer falls back to plain text');
 ok(errs.length===0,mode+': no page errors');await p.close()}
await b.close();console.log(fails?'FAILED':'ALL PASSED');process.exit(fails?1:0)})();

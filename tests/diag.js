// Structured diagnosis test, one card format per domain: node tests/diag.js (needs playwright). Mocks Gemini, no key or network.
const {chromium}=require('playwright');const path=require('path');
const URL='file://'+path.resolve(__dirname,'..','index.html');let fails=0;
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
const ANS={
 plants:{what:'Yellowing leaf edges',urgency:'high',certainty:'unsure',causes:['Overwatering'],check:['Drainage'],steps:['Water less'],prevent:['Mulch'],ask_expert:true,ask_expert_why:'Unclear photo'},
 pets:{what:'Red itchy ear',urgency:'medium',certainty:'likely',red_flags:['Head tilt'],causes:['Ear infection'],home_care:['Keep dry'],avoid:['No human ear drops'],ask_expert:true,ask_expert_why:'Pain'},
 aquarium:{what:'White spots on fish',urgency:'high',certainty:'likely',tests:['Ammonia','Nitrite'],causes:['Ich'],steps:['Raise temperature slowly'],avoid:['No copper with shrimp'],ask_expert:false}};
const EXPECT={plants:['Yellowing leaf edges','Urgent','Not sure','How to prevent it','Mulch','Worth asking an extension adviser'],
 pets:['Red itchy ear','Medium urgency','Signs that need a vet right away','Head tilt','What not to do','No human ear drops','Worth seeing a vet'],
 aquarium:['White spots on fish','Water tests to do first','Ammonia','What not to do','No copper with shrimp']};
(async()=>{const b=await chromium.launch();
for(const dom of ['plants','pets','aquarium','text']){
 const p=await b.newPage(),errs=[];p.on('pageerror',e=>{if(!/ServiceWorker/.test(e.message))errs.push(e.message)});let sent=null;
 await p.route('**/generativelanguage.googleapis.com/**',r=>{sent=JSON.parse(r.request().postData());r.fulfill({json:{candidates:[{content:{parts:[{text:dom==='text'?'plain text answer':JSON.stringify(ANS[dom])}]}}]}})});
 await p.addInitScript(()=>{try{localStorage.setItem('gkey','AIzaTEST')}catch(e){}});
 await p.goto(URL);await p.waitForTimeout(800);
 await p.evaluate(d=>{setDomain(d==='text'?'plants':d);TAB="diag";tabs();diag()},dom);
 if(dom==='plants'){ok(!(await p.isVisible('#ai')),'diagnose button is hidden before a photo is taken');ok((await p.evaluate(()=>getComputedStyle(document.getElementById('pl')).fontWeight))>=700,'photo button is bold and prominent')}
 await p.setInputFiles('#ph',{name:'a.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==','base64')});
 if(dom==='plants')ok(await p.isVisible('#ai'),'diagnose button appears after a photo is taken');await p.click('#ai');await p.waitForTimeout(1500);
 const t=await p.innerText('#out');const props=Object.keys(((sent||{}).generationConfig||{}).responseSchema?.properties||{});
 ok(props.length>0,dom+': request asks for a JSON schema');
 if(dom==='text')ok(t.trim()==='plain text answer','text: non-JSON answer falls back to plain text');
 else{EXPECT[dom].forEach(x=>ok(t.includes(x),dom+': card shows "'+x+'"'));ok(!/\{|"what"/.test(t),dom+': no raw JSON on screen');
  const extra={plants:'prevent',pets:'red_flags',aquarium:'tests'}[dom];ok(props.includes(extra),dom+': schema has the domain field '+extra)}
 ok(errs.length===0,dom+': no page errors '+errs.join('|'));await p.close()}
await b.close();console.log(fails?'FAILED':'ALL PASSED');process.exit(fails?1:0)})();

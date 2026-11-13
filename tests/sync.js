// Unit test for sync.js with an in-memory fake Supabase client: node tests/sync.js
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
const mem={};global.localStorage={getItem:k=>k in mem?mem[k]:null,setItem:(k,v)=>{mem[k]=v}};
global.window=global;global.location={origin:'https://x.test',pathname:'/g/'};
require('../sync.js');
function fake(){const db={spaces:[],subjects:[],events:[],reminders:[],profiles:[{id:'u1',country:'DK',domains:['pets']}]};let n=0;
 const from=t=>{let op='select',f=[],pl=null;
  const b={select(){return b},eq(c,v){f.push(r=>r[c]===v);return b},in(c,vs){f.push(r=>vs.includes(r[c]));return b},
   insert(p){op='insert';pl=[].concat(p);return b},upsert(p){op='upsert';pl=[].concat(p);return b},delete(){op='delete';return b},update(p){op='update';pl=p;return b},
   then(res,rej){return Promise.resolve(run()).then(res,rej)}};
  function run(){const T=db[t],now=new Date().toISOString();
   if(op==='insert'){const rows=pl.map(r=>({id:r.id||'id'+(++n),owner_id:'u1',created_at:now,...r}));T.push(...rows);return{data:rows,error:null}}
   if(op==='upsert'){pl.forEach(r=>{const i=T.findIndex(x=>x.id===r.id);if(i>=0)T[i]={...T[i],...r};else T.push({owner_id:'u1',created_at:now,...r})});return{data:null,error:null}}
   if(op==='update'){T.filter(r=>f.every(g=>g(r))).forEach(r=>Object.assign(r,pl));return{data:null,error:null}}
   if(op==='delete'){db[t]=T.filter(r=>!f.every(g=>g(r)));return{data:null,error:null}}
   return{data:T.filter(r=>f.every(g=>g(r))),error:null}}
  return b};
 return{db,from}}
(async()=>{
 const S=window.SYNC,c=fake();S.setClient(c);S.user={id:'u1',email:'a@b.c'};
 let pr=null;S.onProfile=p=>{pr=p};
 await S.sync();ok(localStorage.getItem('country')==='DK'&&localStorage.getItem('domain')==='pets'&&pr&&pr.country==='DK','new device adopts cloud country and domain');
 localStorage.setItem('country','FI');await S.sync();ok(c.db.profiles[0].country==='FI','local explicit choice is pushed to the cloud');
 localStorage.setItem('flog','[]');
 const local=[{kind:'done',by:'',id:1,plot:'North',crop:'Tomato',date:'2026-11-01',ti:0,type:'ריסוס',product:'sulfur',dose:'',notes:''},
  {kind:'ins',by:'Dani',id:2,plot:'North',crop:'Tomato',date:'2026-11-20',ti:2,type:'דישון',product:'',dose:'',notes:'n'}];
 localStorage.setItem('flog',JSON.stringify(local));
 localStorage.setItem('rem',JSON.stringify([{id:5,d:'2026-11-20',t:'check'}]));
 await S.sync();ok(!S.err,'sync no error '+S.err);
 ok(c.db.spaces.length===1&&c.db.spaces[0].name==='North'&&c.db.spaces[0].domain==='plants','one space per plot');
 ok(c.db.subjects.length===1&&c.db.subjects[0].label==='Tomato','one subject per crop');
 ok(c.db.events.length===2&&c.db.events.some(e=>e.kind==='instruction'&&e.type==='fertilize'&&e.advisor_name==='Dani'),'events mapped (type key, kind, advisor)');
 ok(c.db.reminders.length===1&&c.db.reminders[0].title==='check','reminder pushed');
 let l=JSON.parse(localStorage.getItem('flog'));ok(l.every(x=>x.rid),'local entries got rid');
 await S.sync();ok(c.db.events.length===2&&c.db.spaces.length===1,'second sync is idempotent');
 // entry added on another device appears locally
 c.db.events.push({id:'remote1',space_id:c.db.spaces[0].id,subject_id:c.db.subjects[0].id,kind:'done',type:'harvest',occurred_on:'2026-11-10',product:null,dose:null,notes:'r',advisor_name:null,created_at:new Date().toISOString()});
 c.db.reminders.push({id:'rr',owner_id:'u1',title:'water',due_on:'2026-11-12',done_at:null});
 await S.sync();l=JSON.parse(localStorage.getItem('flog'));
 const r=l.find(x=>x.rid==='remote1');ok(r&&r.plot==='North'&&r.crop==='Tomato'&&r.ti===6&&r.type==='קטיף','remote entry pulled with plot, crop, Hebrew type');
 ok(JSON.parse(localStorage.getItem('rem')).some(x=>x.rid==='rr'),'remote reminder pulled');
 // local delete propagates
 const victim=l.find(x=>x.kind==='ins');S.markDeleted('flogdel',victim.rid);localStorage.setItem('flog',JSON.stringify(l.filter(x=>x!==victim)));
 await S.sync();ok(!c.db.events.some(e=>e.id===victim.rid),'deleted entry removed in cloud');
 // errors surface
 c.from=()=>({select(){return this},eq(){return this},delete(){return this},then(res){return Promise.resolve({data:null,error:{message:'boom'}}).then(res)}});
 await S.sync();ok(S.err==='boom','error surfaced: '+S.err);
 process.exit(fails?1:0)})();

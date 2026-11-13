// Cloud sync (Supabase). Local-first: localStorage stays the working copy, the cloud is a backup + multi-device sync.
// Needs the tables from knowledge-agent/garden-app-sql/01-core.sql. The key below is the PUBLISHABLE key (safe in the browser, protected by RLS).
(function(){
const SB_URL="https://eoyfkteuzyqychgkzihv.supabase.co",SB_KEY="sb_publishable_u4OPUHRXvkJ_yrWtcInTeg_OFfr5IKZ";
const TYPES=["spray","pest","fertilize","irrigate","prune","sow","harvest","other"];
const HE_TYPES=["ריסוס","הדברה","דישון","השקיה","גיזום / עבודת קרקע","זריעה / שתילה","קטיף","אחר"];
const store={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const uuid=()=>crypto.randomUUID();
const S={sb:null,user:null,busy:false,err:"",last:0,onChange:null};

S.setClient=c=>{S.sb=c};
S.init=function(){
  if(S.sb||!window.supabase)return;
  S.sb=window.supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  S.sb.auth.getSession().then(({data})=>setUser(data&&data.session&&data.session.user));
  S.sb.auth.onAuthStateChange((ev,ses)=>setUser(ses&&ses.user));
};
function setUser(u){const was=S.user&&S.user.id;S.user=u||null;if(S.user&&S.user.id!==was)S.sync();else if(S.onChange)S.onChange()}

S.signIn=async function(email){
  const r=await S.sb.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin+location.pathname}});
  if(r.error)throw r.error;
};
S.signOut=async function(){await S.sb.auth.signOut();S.user=null;if(S.onChange)S.onChange()};
S.deleteAccount=async function(){const r=await S.sb.rpc("delete_my_account");if(r.error)throw r.error;await S.sb.auth.signOut();S.user=null;if(S.onChange)S.onChange()};

let timer=null;
S.touch=function(){if(!S.user)return;clearTimeout(timer);timer=setTimeout(()=>S.sync(),1500)};
S.markDeleted=function(key,rid){if(!rid)return;const a=store.get(key,[]);a.push(rid);store.set(key,a)};

const must=r=>{if(r&&r.error)throw r.error;return r?r.data:null};

S.sync=async function(){
  if(!S.sb||!S.user||S.busy)return;S.busy=true;S.err="";
  try{
    const sb=S.sb;
    await syncLog(sb);await syncReminders(sb);
    S.last=Date.now();
  }catch(e){S.err=(e&&e.message)||String(e)}
  S.busy=false;if(S.onChange)S.onChange();
};

async function syncLog(sb){
  let log=store.get("flog",[]);
  // 1. deletions made on this device
  const del=store.get("flogdel",[]);
  if(del.length){must(await sb.from("events").delete().in("id",del));store.set("flogdel",[])}
  // 2. spaces (one per plot name)
  const spaces=must(await sb.from("spaces").select("id,name").eq("domain","plants"))||[];
  const spaceId={};spaces.forEach(s=>spaceId[s.name]=s.id);
  for(const p of new Set(log.map(x=>x.plot))){
    if(spaceId[p])continue;
    const r=must(await sb.from("spaces").insert({domain:"plants",name:p}).select());
    spaceId[p]=r[0].id;
  }
  // 3. subjects (one per crop in a plot)
  const ids=Object.values(spaceId);
  const subs=ids.length?(must(await sb.from("subjects").select("id,space_id,label").in("space_id",ids))||[]):[];
  const subId={};subs.forEach(s=>subId[s.space_id+"|"+s.label]=s.id);
  for(const x of log){
    const k=spaceId[x.plot]+"|"+x.crop;
    if(!x.crop||subId[k])continue;
    const r=must(await sb.from("subjects").insert({space_id:spaceId[x.plot],label:x.crop}).select());
    subId[k]=r[0].id;
  }
  // 4. push local entries
  log.forEach(x=>{if(!x.rid)x.rid=uuid()});
  if(log.length){
    must(await sb.from("events").upsert(log.map(x=>({
      id:x.rid,space_id:spaceId[x.plot],subject_id:x.crop?subId[spaceId[x.plot]+"|"+x.crop]:null,
      kind:x.kind==="ins"?"instruction":"done",type:TYPES[x.ti]||"other",occurred_on:x.date,
      product:x.product||null,dose:x.dose||null,notes:x.notes||null,advisor_name:x.by||null
    }))));
  }
  // 5. pull entries added on other devices
  const nameById={};Object.entries(spaceId).forEach(([n,i])=>nameById[i]=n);
  const labelById={};Object.entries(subId).forEach(([k,i])=>labelById[i]=k.split("|").slice(1).join("|"));
  const ev=ids.length?(must(await sb.from("events").select("id,space_id,subject_id,kind,type,occurred_on,product,dose,notes,advisor_name,created_at").in("space_id",ids))||[]):[];
  const have=new Set(log.map(x=>x.rid));let added=0;
  ev.forEach(e=>{
    if(have.has(e.id))return;
    const ti=TYPES.indexOf(e.type),t=ti<0?7:ti;
    log.push({kind:e.kind==="instruction"?"ins":"done",by:e.advisor_name||"",id:Date.parse(e.created_at)||Date.now(),rid:e.id,
      plot:nameById[e.space_id]||"",crop:labelById[e.subject_id]||"",date:e.occurred_on,ti:t,type:HE_TYPES[t],
      product:e.product||"",dose:e.dose||"",notes:e.notes||""});
    added++;
  });
  store.set("flog",log);
  return added;
}

async function syncReminders(sb){
  let rem=store.get("rem",[]);
  const del=store.get("remdel",[]);
  if(del.length){must(await sb.from("reminders").delete().in("id",del));store.set("remdel",[])}
  rem.forEach(x=>{if(!x.rid)x.rid=uuid()});
  if(rem.length)must(await sb.from("reminders").upsert(rem.map(x=>({id:x.rid,title:x.t,due_on:x.d}))));
  const remote=must(await sb.from("reminders").select("id,title,due_on,done_at"))||[];
  const have=new Set(rem.map(x=>x.rid));
  remote.forEach(r=>{if(!have.has(r.id)&&!r.done_at)rem.push({id:Date.now()+Math.floor(Math.random()*1000),rid:r.id,d:r.due_on,t:r.title})});
  store.set("rem",rem);
}

window.SYNC=S;
})();

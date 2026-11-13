// Species content from Supabase (species, species_info, species_country), merged into the app's local data.
// Local data (crops.js, domains.js, i18n.js) stays the offline baseline; the database adds more species, more languages and per-country calendars.
(function(){
const LANGS=["he","en","de","da","fi","pt"],NEW=["de","da","fi","pt"];
window.LANGS=LANGS;
window.LANGNAME={he:"עברית",en:"English",de:"Deutsch",da:"Dansk",fi:"Suomi",pt:"Português"};
const KEYS=["name","water","why","sun","tips","harvest"],PKEYS=["name","feed","water","move","vet","tips"];
// Every {he,en} object gets de/da/fi/pt = en until a real translation exists, so X[L] lookups never return undefined.
function fb(o,d){if(!o||typeof o!=="object"||d>8)return;if(!Array.isArray(o)&&o.he!==undefined&&o.en!==undefined)for(const l of NEW)if(o[l]===undefined)o[l]=o.en;for(const k in o){if(NEW.includes(k))continue;fb(o[k],d+1)}}
function prep(){for(const l of NEW)if(!I18N[l])I18N[l]=Object.assign({},I18N.en,{crops:Object.assign({},I18N.en.crops)});
 try{fb(DOMAINS,0);fb(window.lockText,0)}catch(e){}}
const store={get(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
async function page(sb,table,cols,f){let all=[],from=0;for(;;){let q=sb.from(table).select(cols);if(f)q=f(q);const r=await q.range(from,from+999);if(r.error)throw r.error;all=all.concat(r.data||[]);if(!r.data||r.data.length<1000)break;from+=1000}return all}
function apply(d){
 prep();const cm={};
 for(const r of d.country){(cm[r.domain+":"+r.key]=cm[r.domain+":"+r.key]||{})[r.country]=r.months||[]}
 const sp={};for(const r of d.species)sp[r.domain+":"+r.key]=r;
 const infoBy={};for(const r of d.info)(infoBy[r.domain+":"+r.key]=infoBy[r.domain+":"+r.key]||{})[r.lang]=r.content;
 for(const k in sp){const r=sp[k],dom=r.domain,id=r.key,inf=infoBy[k]||{},attrs=r.attrs||{};
  if(dom==="plants"){
   let c=CROPS.find(x=>x.id===id);
   if(!c){const he=inf.he;if(!he)continue;c=Object.assign({id,emoji:attrs.emoji||"🌱",pack:attrs.pack,months:[],cool:null},pick(he,KEYS));CROPS.push(c)}
   if(cm[k])c.cm=cm[k];
   for(const l of LANGS){if(l==="he"||!inf[l])continue;(I18N[l].crops=I18N[l].crops||{})[id]=pick(inf[l],KEYS)}
  }else if(DOMAINS[dom]&&DOMAINS[dom].items){
   const D=DOMAINS[dom];let x=D.items.find(y=>y.id===id);
   if(!x){if(!inf.he&&!inf.en)continue;x={id,emoji:attrs.emoji||"🐾",he:{},en:{}};D.items.push(x)}
   for(const l of LANGS){if(!inf[l])continue;if((l==="he"||l==="en")&&x[l]&&x[l].name)continue;x[l]=pick(inf[l],PKEYS)}
   fb(x,0);
  }}
}
function pick(o,keys){const r={};for(const k of keys)if(o[k]!==undefined)r[k]=o[k];return r}
async function load(){
 prep();const sb=window.SYNC&&SYNC.sb;const lg=[...new Set(["he","en",L])],ck="species:v1:"+lg.join();
 const cached=store.get(ck);if(cached)try{apply(cached);done()}catch(e){}
 if(!sb||(typeof navigator!=="undefined"&&navigator.onLine===false))return;
 try{const d={species:await page(sb,"species","domain,key,attrs"),info:await page(sb,"species_info","domain,key,lang,content",q=>q.in("lang",lg)),country:await page(sb,"species_country","domain,key,country,months")};
  apply(d);store.set(ck,d);done()}catch(e){}
}
function done(){try{const a=document.getElementById("app");if(!a||document.activeElement&&/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))return;if(TAB==="home")home()}catch(e){}}
window.SPECIES={load,apply,prep,fb};
})();

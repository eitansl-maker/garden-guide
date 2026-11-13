// Species content from Supabase (species, species_info, species_country), merged into the app's local data.
// Local data (crops.js, domains.js, i18n.js) stays the offline baseline; the database adds more species, more languages and per-country calendars.
(function(){
const LANGS=["he","en","de","da","fi","pt","pl"],NEW=["de","da","fi","pt","pl"];
window.LANGS=LANGS;
window.LANGNAME={he:"עברית",en:"English",de:"Deutsch",da:"Dansk",fi:"Suomi",pt:"Português",pl:"Polski"};
// English Wikipedia article titles (several fallbacks separated by |). The app looks up a free-licensed photo at runtime and shows the credit.
const WIKI={tulip:"Tulip",daffodil:"Daffodil|Narcissus (plant)",hyacinth:"Hyacinthus orientalis",crocus:"Crocus",snowdrop:"Galanthus",lily_valley:"Lily of the valley",cornflower:"Centaurea cyanus",poppy:"Papaver rhoeas|Poppy",lavender:"Lavandula|Lavender",rose:"Rose",peony:"Peony",dahlia:"Dahlia",sweetpea:"Sweet pea|Lathyrus odoratus",cosmos:"Cosmos bipinnatus|Cosmos (plant)",zinnia:"Zinnia",pansy:"Pansy",primrose:"Primula vulgaris|Primrose",forgetmenot:"Myosotis",hydrangea:"Hydrangea",geranium:"Pelargonium",petunia:"Petunia",calendula:"Calendula officinalis",nasturtium:"Tropaeolum majus|Nasturtium",foxglove:"Digitalis purpurea|Foxglove",lupin:"Lupinus|Lupin",harebell:"Campanula rotundifolia|Harebell",bougainvillea:"Bougainvillea",anemone:"Anemone coronaria|Anemone",cyclamen:"Cyclamen persicum|Cyclamen",iris:"Iris (plant)",chrysanthemum:"Chrysanthemum",gerbera:"Gerbera jamesonii|Gerbera",marigold:"Tagetes|Marigold",sunflower:"Sunflower|Helianthus annuus",
potato:"Potato",onion:"Onion",garlic:"Garlic",spinach:"Spinach",kale:"Kale",basil:"Basil",parsley:"Parsley",coriander:"Coriander",mint:"Mentha|Mint",rosemary:"Rosemary",thyme:"Thyme",dill:"Dill",chives:"Chives",sage:"Salvia officinalis|Sage",oregano:"Oregano",tomato:"Tomato",cucumber:"Cucumber",carrot:"Carrot",radish:"Radish",beet:"Beetroot|Beet",zucchini:"Zucchini",eggplant:"Eggplant",broccoli:"Broccoli",pepper:"Bell pepper|Capsicum",strawberry:"Strawberry",blueberry:"Blueberry",raspberry:"Raspberry",apple:"Apple",lemon:"Lemon",fig:"Common fig|Ficus carica",grape:"Grape",
pothos:"Epipremnum aureum|Pothos",snake:"Dracaena trifasciata|Sansevieria trifasciata",monstera:"Monstera deliciosa",peacelily:"Spathiphyllum",aloe:"Aloe vera",spiderplant:"Chlorophytum comosum",zzplant:"Zamioculcas zamiifolia|Zamioculcas",ficus:"Ficus benjamina",rubberplant:"Ficus elastica",orchid:"Phalaenopsis",
lettuce:"Lettuce",cabbage:"Cabbage",cauliflower:"Cauliflower",leek:"Leek",celery:"Celery",pumpkin:"Pumpkin",sweetcorn:"Sweet corn|Maize",peas:"Pea",beans:"Green bean|Phaseolus vulgaris",arugula:"Eruca vesicaria|Arugula",chard:"Chard",pear:"Pear",plum:"Plum",cherry:"Cherry",peach:"Peach",orange:"Orange (fruit)|Orange",olive:"Olive",pomegranate:"Pomegranate",avocado:"Avocado",kiwi:"Kiwifruit",blackcurrant:"Blackcurrant",rhubarb:"Rhubarb",sweetpotato:"Sweet potato",kohlrabi:"Kohlrabi",brusselssprouts:"Brussels sprout",fennel:"Fennel",okra:"Okra",watermelon:"Watermelon",asparagus:"Asparagus",cockatiel:"Cockatiel",lovebird:"Lovebird",hedgehog:"African pygmy hedgehog|Four-toed hedgehog",koi:"Koi",axolotl:"Axolotl",otocinclus:"Otocinclus",rummynose:"Hemigrammus rhodostomus|Rummy-nose tetra"};
const KEYS=["name","water","why","sun","tips","harvest"],PKEYS=["name","feed","water","move","vet","tips"];
// Every {he,en} object gets de/da/fi/pt = en until a real translation exists, so X[L] lookups never return undefined.
function fb(o,d){if(!o||typeof o!=="object"||d>8)return;if(!Array.isArray(o)&&o.he!==undefined&&o.en!==undefined)for(const l of NEW)if(o[l]===undefined)o[l]=o.en;for(const k in o){if(NEW.includes(k))continue;fb(o[k],d+1)}}
function prep(){try{for(const c of CROPS)if(!c.wiki&&WIKI[c.id])c.wiki=WIKI[c.id]}catch(e){}for(const l of NEW)if(!I18N[l])I18N[l]=Object.assign({},I18N.en,{crops:Object.assign({},I18N.en.crops)});
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
   if(!c.wiki&&(attrs.wiki||WIKI[id]))c.wiki=attrs.wiki||WIKI[id];
   for(const l of LANGS){if(l==="he"||!inf[l])continue;(I18N[l].crops=I18N[l].crops||{})[id]=pick(inf[l],KEYS)}
  }else if(DOMAINS[dom]&&DOMAINS[dom].items){
   const D=DOMAINS[dom];let x=D.items.find(y=>y.id===id);
   if(!x){if(!inf.he&&!inf.en)continue;x={id,emoji:attrs.emoji||"🐾",he:{},en:{}};D.items.push(x)}
   if(!x.wiki&&(attrs.wiki||WIKI[id]))x.wiki=attrs.wiki||WIKI[id];
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

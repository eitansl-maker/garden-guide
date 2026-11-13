// Domain packs: the app UI is built from the active pack. Adding a domain = a new entry here (+ a row in the cloud domain_packs). Draft content, not verified by a vet.
window.DOMAINS={
 plants:{icon:"🌿",name:{he:"צמחים וגינה",en:"Plants & garden"},
  // Packs: sellable sub-areas of a domain. A crop belongs to one pack (crop.pack, default = first pack). A domain with no packs is one unit.
  packs:[{id:"veg",icon:"🥕",name:{he:"ירקות ופירות",en:"Vegetables & fruit"}},{id:"flowers",icon:"🌻",name:{he:"פרחים",en:"Flowers"}},{id:"house",icon:"🪴",name:{he:"צמחי בית",en:"Houseplants"}}],
  events:[{k:"spray",he:"ריסוס",en:"Spraying"},{k:"pest",he:"הדברה",en:"Pest control"},{k:"fertilize",he:"דישון",en:"Fertilizing"},{k:"irrigate",he:"השקיה",en:"Irrigation"},{k:"prune",he:"גיזום / עבודת קרקע",en:"Pruning / soil work"},{k:"sow",he:"זריעה / שתילה",en:"Sowing / planting"},{k:"harvest",he:"קטיף",en:"Harvest"},{k:"other",he:"אחר",en:"Other"}]},
 pets:{icon:"🐾",name:{he:"כלבים וחתולים",en:"Dogs & cats"},
  tab:{he:"טיפול בחיות",en:"Pet care"},
  farmTab:{he:"יומן חיות",en:"Pet log"},
  // Event types (stable keys, synced as events.type). rep = suggested days until the next one (a reminder is offered; the vet's schedule wins).
  events:[{k:"feed",he:"האכלה",en:"Feeding"},{k:"vaccine",he:"חיסון",en:"Vaccination",rep:365},{k:"deworm",he:"תילוע",en:"Deworming",rep:90},{k:"flea",he:"פרעושים וקרציות",en:"Flea & tick treatment",rep:30},{k:"vet",he:"ביקור וטרינר",en:"Vet visit"},{k:"meds",he:"תרופה",en:"Medication"},{k:"weight",he:"שקילה",en:"Weighing"},{k:"groom",he:"טיפוח / רחצה",en:"Grooming / bath"},{k:"walk",he:"הליכה / משחק",en:"Walk / play"},{k:"other",he:"אחר",en:"Other"}],
  lab:{plot:{he:"שם החיה",en:"Pet name"},plotPh:{he:"למשל: רקס",en:"e.g. Rex"},crop:{he:"סוג / גזע",en:"Species / breed"},cropPh:{he:"למשל: כלב, לברדור",en:"e.g. Dog, Labrador"},type:{he:"סוג רישום",en:"Entry type"},prod:{he:"מזון / תרופה / חיסון",en:"Food / medication / vaccine"},dose:{he:"כמות / משקל",en:"Amount / weight"},by:{he:"שם הווטרינר",en:"Vet name"},kIns:{he:"הוראת וטרינר (לביצוע)",en:"Vet instruction (to do)"},saveT:{he:"שמור ביומן החיה",en:"Save to pet log"},remNote:{he:"נוספה תזכורת (לפי הלוח הרגיל, הווטרינר קובע)",en:"Reminder added (typical schedule, your vet decides)"}},
  askPrompt:{he:"אתה עוזר ידע על כלבים וחתולים. ענה בעברית קצרה וברורה, מעשית. אל תמליץ על תרופות ומינונים, ובכל חשש ממשי הפנה לווטרינר. שאלה: ",en:"You are a helper for dog and cat owners. Answer in short, clear, practical English. Do not recommend medications or doses; for any real concern refer to a veterinarian. Question: "},
  warn:{he:"זה אומדן בלבד ולא תחליף לווטרינר. במצב חירום (קשיי נשימה, הרעלה, דימום, קריסה) פנה מיד לווטרינר.",en:"This is an estimate only, not a replacement for a veterinarian. In an emergency (breathing trouble, poisoning, bleeding, collapse) see a vet immediately."},
  fields:[{k:"feed",he:"האכלה",en:"Feeding"},{k:"water",he:"מים",en:"Water"},{k:"move",he:"פעילות",en:"Activity"},{k:"vet",he:"וטרינר ומניעה",en:"Vet & prevention"},{k:"tips",he:"טיפ",en:"Tip"}],
  items:[
   {id:"dog",emoji:"🐕",he:{name:"כלב",feed:"פעמיים ביום, מזון מותאם גיל ומשקל. בלי שוקולד, ענבים, בצל ושום.",water:"מים טריים זמינים תמיד, במיוחד בחום.",move:"הליכה 30-120 דקות ביום לפי גזע וגיל. לא בשעות החמות בקיץ.",vet:"חיסונים ותילוע לפי לוח הווטרינר, בדיקה שנתית, טיפול נגד קרציות ופרעושים.",tips:"הרכב סגור בקיץ הוא סכנת חיים. אל תשאיר כלב ברכב."},en:{name:"Dog",feed:"Twice a day, age and weight appropriate food. No chocolate, grapes, onion or garlic.",water:"Fresh water always available, especially in heat.",move:"30-120 minutes of walking a day depending on breed and age. Avoid hot hours in summer.",vet:"Vaccines and deworming per the vet's schedule, yearly checkup, tick and flea prevention.",tips:"A closed car in summer can kill. Never leave a dog in a car."}},
   {id:"cat",emoji:"🐈",he:{name:"חתול",feed:"פעמיים-שלוש ביום, מזון איכותי עשיר בחלבון. בלי לילי, שוקולד, בצל ושום.",water:"מים טריים, עדיף מזרקה. חתולים שותים מעט, מזון רטוב עוזר.",move:"משחק יומי, גרדן ומקום גבוה. חתול בית צריך גירוי.",vet:"חיסונים ותילוע לפי הווטרינר, עיקור/סירוס, בדיקה שנתית, מניעת פרעושים.",tips:"חתול שמפסיק לאכול יותר מיום-יומיים או מתקשה במתן שתן: לווטרינר באותו יום."},en:{name:"Cat",feed:"Two to three times a day, high-quality protein-rich food. No lilies, chocolate, onion or garlic.",water:"Fresh water, a fountain is best. Cats drink little, wet food helps.",move:"Daily play, a scratching post and a high perch. Indoor cats need stimulation.",vet:"Vaccines and deworming per the vet, spay/neuter, yearly checkup, flea prevention.",tips:"A cat that stops eating for 1-2 days or struggles to urinate needs a vet the same day."}}
  ]}
};

// Entitlements: which packs the user may open. Off by default (everything open, no existing user is affected).
// Flip PACKS_ENFORCE to true when selling per category; then only domains/packs in ENT are open.
// ENT entries: "plants" (whole domain), "plants:flowers" (one pack), "*" (everything). Filled from the cloud entitlements table (sync.js) or localStorage "ent".
window.PACKS_ENFORCE=false;
window.ENT=function(){try{return JSON.parse(localStorage.getItem("ent")||"[]")}catch(e){return[]}};
window.hasPack=function(dom,pack){if(!window.PACKS_ENFORCE)return true;const e=window.ENT();return e.includes("*")||e.includes(dom)||(!!pack&&e.includes(dom+":"+pack))};
window.packsOf=dom=>(DOMAINS[dom]&&DOMAINS[dom].packs)||[];
window.cropPack=(c,dom)=>c.pack||(packsOf(dom||"plants")[0]||{}).id;
window.lockText={he:"החבילה הזו נעולה. היא נפתחת ברכישה.",en:"This pack is locked. Unlock it with a purchase."};

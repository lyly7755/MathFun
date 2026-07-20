const APP=require('path').join(__dirname,'..','index.html');
/* Daily puzzle: date maths, deterministic selection, streak + stats.
   Solvability of all 380 shipped puzzles ....... _dev/data_integrity.py
   Tap/interaction layer (180 levels) ........... _dev/verify.js            */
const fs=require('fs');
const h=fs.readFileSync(APP,'utf8');
const src=h.slice(h.indexOf('<script>')+8, h.indexOf('</script>'));
const REAL_DATE=Date;
let listener=null, els={}, store={};
const mkcl=()=>{const c=new Set();return{c,add:x=>c.add(x),remove:x=>c.delete(x),contains:x=>c.has(x)};};
function mk(id){
  const e={id,_t:'',_h:'',className:'',disabled:false,onclick:null,style:{},
    classList:mkcl(),setAttribute(){},addEventListener:(t,f)=>{listener=f;}};
  Object.defineProperty(e,'textContent',{get:()=>e._t,set:v=>{e._t=v;e._h=v;}});
  Object.defineProperty(e,'innerHTML',{get:()=>e._h,set:v=>{e._h=v;e._t=String(v).replace(/<[^>]+>/g,' ');}});
  return els[id]=e;
}
['board','lvlnum','sub','msg','undo','reset','go','next','prev','back','clock','par','lvlstars','hint',
 'dailybtn','dailysub','sc-daily','stats','menu','game','total','sc-easy','sc-medium','sc-hard'].forEach(mk);
const TBTNS=['easy','medium','hard'].map(t=>({getAttribute:()=>t,onclick:null}));
global.document={getElementById:id=>els[id]||mk(id),querySelectorAll:()=>TBTNS};
global.localStorage={getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=String(v)}};
let T=20653*86400+3600;
global.Date={now:()=>T*1000};
global.setInterval=()=>1; global.clearInterval=()=>{};
eval(src);

let bad=0;
const chk=(l,g,e)=>{const ok=(g===e);if(!ok)bad++;console.log((ok?'ok  ':'FAIL')+'  '+l+'  got '+JSON.stringify(g)+' expected '+JSON.stringify(e));};

// ---- date maths must agree with a real Date ----
let dateOk=true, labelOk=true;
const MONS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
for(const d of [0,1,59,60,19000,20653,20700,25000,30000,40000]){
  const r=new REAL_DATE(d*86400000), c=civil(d);
  if(c.y!==r.getUTCFullYear()||c.m!==r.getUTCMonth()+1||c.d!==r.getUTCDate()){
    dateOk=false; console.log('  civil mismatch @',d,c,r.toISOString().slice(0,10));
  }
  if(dayLabel(d)!==MONS[r.getUTCMonth()]+' '+r.getUTCDate()) labelOk=false;
}
chk('civil() matches real UTC dates ', dateOk, true);
chk('dayLabel() formats correctly   ', labelOk, true);
console.log('     day '+dayNo()+' renders as '+dayLabel(dayNo()));

// ---- selection deterministic + spread ----
chk('same day -> same puzzle        ', dailyIdx(20653)===dailyIdx(20653), true);
const runs=[]; for(let d=20653;d<20713;d++) runs.push(dailyIdx(d));
chk('no back-to-back repeats        ', runs.every((v,i)=>i===0||v!==runs[i-1]), true);
chk('every pick is a real puzzle    ', runs.every(v=>v>=0&&v<PACKS.daily.length), true);
console.log('     distinct over 60 days: '+new Set(runs).size+'/60');

// ---- solve the daily by driving the real win path ----
function solveOn(day, seconds){
  T=day*86400+3600;
  openDaily();
  tok=encode(lev().s[0]);                    // put the board on the answer
  for(let k=0;k<lev().m;k++) hist.push([]);  // account for the moves it took
  T += (seconds||0);
  check();                                   // then run the genuine win path
  return solved;
}
chk('daily solve registers          ', solveOn(20653,5), true);
chk('  streak                       ', daily.streak, 1);
chk('next day continues streak      ', (solveOn(20654,5), daily.streak), 2);
chk('third day                      ', (solveOn(20655,5), daily.streak), 3);
solveOn(20655,5);
chk('same day again -> no double    ', daily.streak, 3);
chk('dailies counted once per day   ', dailyCount(), 3);
solveOn(20658,5);
chk('gap resets streak              ', daily.streak, 1);
chk('best streak remembered         ', daily.best, 3);
chk('persisted                      ', JSON.parse(store['ms_daily']).best, 3);

// ---- daily par scales with the puzzle length, and stars still apply ----
T=20700*86400+3600; openDaily();
const m=lev().m;
chk('daily par matches move count   ', parNow(), m===1?45:90);
daily.done={}; daily.streak=0; daily.best=0; daily.last=-99;
solveOn(20800, 5);      const fast=daily.done[20800];
daily.done={};
solveOn(20800, 400);    const slow=daily.done[20800];
chk('fast daily solve -> 3 stars    ', fast, 3);
chk('slow daily solve -> 1 star     ', slow, 1);

// ---- menu surfaces ----
showMenu();
console.log('     daily row : '+els.dailysub.textContent.trim()+'   '+els['sc-daily'].textContent);
console.log('     stats     : '+els.stats.textContent.replace(/\s+/g,' ').trim());
console.log('     total     : '+els.total.textContent);
console.log(bad? bad+' DAILY FAILURES' : 'DAILY + STATS OK');

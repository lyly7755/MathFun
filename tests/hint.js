const APP=require('path').join(__dirname,'..','index.html');
const fs=require('fs');
const h=fs.readFileSync(APP,'utf8');
const src=h.slice(h.indexOf('<script>')+8, h.indexOf('</script>'));
let listener=null, els={}, store={};
const mkcl=()=>{const c=new Set();return{c,add:x=>c.add(x),remove:x=>c.delete(x),contains:x=>c.has(x)};};
function mk(id){                       // textContent and innerHTML clobber each other, as in a real DOM
  const e={id,_t:'',_h:'',className:'',disabled:false,onclick:null,
    style:{}, classList:mkcl(), setAttribute(){}, addEventListener:function(t,f){ this.listener=f; if(this.id==='board') listener=f; }};
  Object.defineProperty(e,'textContent',{get:()=>e._t,set:v=>{e._t=v;e._h=v;}});
  Object.defineProperty(e,'innerHTML',  {get:()=>e._h,set:v=>{e._h=v;e._t=String(v).replace(/<[^>]+>/g,'');}});
  return els[id]=e;
}
['board','lvlnum','sub','msg','undo','reset','go','next','back','clock','par','lvlstars','hint','dailybtn','dailysub','sc-daily','stats',
 'menu','game','total','sc-easy','sc-medium','sc-hard'].forEach(mk);
const TBTNS=['easy','medium','hard'].map(t=>({getAttribute:()=>t,onclick:null}));
global.document={getElementById:id=>els[id]||mk(id), querySelectorAll:()=>TBTNS};
global.localStorage={getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=String(v)}};
let T=1000; global.Date={now:()=>T*1000};
global.setInterval=()=>1; global.clearInterval=()=>{};
eval(src);

function nodes(){const o=[];const re=/<g class="([^"]+)" data-i="(\d+)" data-s="([a-z])"/g;let m;
  while((m=re.exec(els.board.innerHTML)))o.push({cls:m[1],i:+m[2],s:m[3]});return o;}
const tap=n=>listener({target:{getAttribute:k=>k==='data-i'?String(n.i):k==='data-s'?n.s:n.cls}});
const txt=()=>els.msg.innerHTML.replace(/<[^>]+>/g,' ').replace(/&nbsp;|&middot;/g,' ').replace(/\s+/g,' ').trim()||els.msg.textContent;
let bad=0;
const chk=(l,g,e)=>{const ok=(g===e);if(!ok)bad++;console.log((ok?'ok  ':'FAIL')+'  '+l+'  got '+JSON.stringify(g)+' expected '+JSON.stringify(e));};

// --- button visibility per tier ---
openTier('easy');   load(0); chk('hint button hidden on easy  ', els.hint.style.display, 'none');
openTier('medium'); load(0); chk('hint button hidden on medium', els.hint.style.display, 'none');
openTier('hard');   load(0); chk('hint button shown on hard   ', els.hint.style.display, '');

// --- hint reveals exactly one move, and it is followable ---
let nSolved=0, hintedFine=true;
for(let li=0; li<PACKS.hard.length; li++){
  T=1000; load(li);
  let steps=0;
  while(!solved && steps<PACKS.hard[li].m+1){
    els.hint.onclick();                       // ask for a hint
    const hs=nodes().filter(n=>n.cls.indexOf('stick')===0 && n.cls.indexOf('hint')>=0);
    const hg=nodes().filter(n=>n.cls.indexOf('slot')===0 && n.cls.indexOf('hint')>=0);
    if(hs.length!==1||hg.length!==1){ hintedFine=false; console.log('  bad hint markup on hard',li+1,hs.length,hg.length); break; }
    if(hg[0].cls.indexOf('blind')>=0){ hintedFine=false; console.log('  hinted slot still blind on',li+1); break; }
    tap(hs[0]); tap(hg[0]);                   // follow it
    steps++;
  }
  if(solved) nSolved++;
}
chk('every hard level solvable by following hints', nSolved, PACKS.hard.length);
chk('hint markup well-formed throughout          ', hintedFine, true);

// --- one hint on a 2-move puzzle leaves the second move to the player ---
T=1000; load(0);
els.hint.onclick();
const before=decode(tok);
tap(nodes().find(n=>n.cls.indexOf('stick')===0&&n.cls.indexOf('hint')>=0));
tap(nodes().find(n=>n.cls.indexOf('slot')===0&&n.cls.indexOf('hint')>=0));
chk('board changed after 1 hinted move', decode(tok)!==before, true);
chk('not solved yet (1 of 2 moves)    ', solved, false);
chk('hint cleared after the move      ', hint, null);
chk('moves used                       ', hist.length, 1);

// --- star penalty ---
delete stars[PACKS.hard[0].p];          // stars are keyed by puzzle text now
T=1000; load(0);
els.hint.onclick();
for(let k=0;k<2;k++){
  const s=nodes().find(n=>n.cls.indexOf('stick')===0&&n.cls.indexOf('hint')>=0);
  const g=nodes().find(n=>n.cls.indexOf('slot')===0&&n.cls.indexOf('hint')>=0);
  if(s&&g){ tap(s); tap(g); } else { els.hint.onclick(); k--; }
}
chk('solved with hint, well under par ', solved, true);
chk('hint caps the award at 2 stars   ', starsFor('hard',0), 2);
console.log('     win banner: '+txt());

// --- drifted board is handled, not silently wrong ---
T=1000; load(1);
const st=nodes().filter(n=>n.cls.indexOf('stick')===0);
tap(st[0]);
const wrongSlot=nodes().filter(n=>n.cls.indexOf('slot')===0)[3];
tap(wrongSlot); tap(st[1]);
const sl2=nodes().filter(n=>n.cls.indexOf('slot')===0);
if(sl2.length) tap(sl2[2]);
els.hint.onclick();
const drifted = txt().indexOf('Too far')>=0 || solved || hint!==null;
chk('drifted board handled gracefully ', drifted, true);
console.log('     message: '+txt());

console.log(bad? bad+' HINT FAILURES' : 'HINT SYSTEM OK');

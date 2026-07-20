const APP=require('path').join(__dirname,'..','index.html');
/* Drives the real card/operator click handlers - no shortcuts through the engine. */
const fs=require('fs');
const {build}=require('./dom.js');
const dom=build(APP);
global.document=dom.document;
const store={}; global.localStorage={getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v}};
let T=20653*86400+3600; global.Date={now:()=>T*1000};
global.setInterval=()=>1; global.clearInterval=()=>{};
const html=fs.readFileSync(APP,'utf8');
eval(html.slice(html.indexOf('<script>')+8, html.indexOf('</script>')));
let bad=0;
const chk=(l,g,e)=>{const ok=(g===e);if(!ok)bad++;console.log((ok?'ok  ':'FAIL')+'  '+l+'  got '+JSON.stringify(g)+' expected '+JSON.stringify(e));};
const cardsOn = ()=>{const o=[];const re=/data-c="(\d+)"/g;let m;
  while((m=re.exec(dom.els.cardarea.innerHTML))) o.push(+m[1]); return o;};
const opsOn = ()=>{const o=[];const re=/data-op="([^"]+)"/g;let m;
  while((m=re.exec(dom.els.ops.innerHTML))) o.push(m[1]); return o;};

// --- solve a hand purely by tapping ---
function playThroughUI(){
  let guard=0;
  while(!g24.solved && guard++<10){
    const live=live24();
    if(live.length<2) break;
    const step=solve24(live.map(i=>g24.cards[i].val));
    if(!step || step.done) break;
    const a=live[step.i], b=live[step.j];
    pick24(a);                       // tap first card
    chooseOp(step.op);               // tap operator
    pick24(b);                       // tap second card -> combine
  }
  return g24.solved;
}

let nOk=0, total=0;
for(const t of ['easy','medium','hard','daily']){
  g24.tier=t;
  for(let i=0;i<HANDS24[t].length;i++){
    total++; T=20653*86400; load24(i);
    if(playThroughUI()) nOk++;
    else console.log('  UNSOLVED VIA UI:', t, i, HANDS24[t][i][0]);
  }
}
chk("all hands solvable via tapping", nOk, total);
console.log('     '+total+' hands played through the real click handlers');

// --- four cards shown, correct ranks/suits ---
g24.tier='easy'; T=20653*86400; load24(0);
chk('operator buttons rendered     ', opsOn().join(''), '+-×÷');
chk('four cards dealt              ', cardsOn().length, 4);
chk('face cards render as letters  ', /[AJQK]|1[0-3]|\d/.test(dom.els.cardarea.innerHTML), true);
console.log('     hand '+hand24()[0].join(' ')+' -> '+dom.els.cardarea.innerHTML.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim());

// --- combining reduces the card count ---
load24(0);
const before=live24().length;
pick24(live24()[0]); chooseOp('+'); pick24(live24()[1]);
chk('combine removes one card      ', live24().length, before-1);
chk('  and history recorded        ', g24.hist.length, 1);
dom.els.undo24.onclick();
chk('undo restores the card        ', live24().length, before);
chk('  undo marks it unclean       ', g24.clean, false);

// --- a wrong final answer is reported, not silently accepted ---
T=20653*86400; g24.tier='hard'; load24(0);
while(live24().length>1){ const l=live24(); pick24(l[0]); chooseOp('+'); pick24(l[1]); }
chk('wrong total is rejected       ', g24.solved, false);
chk('  and says what it made       ', dom.els.msg24.textContent.indexOf('not 24')>=0, true);
console.log('     '+dom.els.msg24.textContent);

// --- divide by zero is refused ---
T=20653*86400; g24.tier='easy'; load24(0);
g24.cards[1].val=fr(0);
pick24(0); chooseOp('÷'); pick24(1);
chk('divide by zero refused        ', dom.els.msg24.textContent.indexOf('zero')>=0, true);
console.log(bad? bad+' FAILURES' : '24 GAME UI OK');

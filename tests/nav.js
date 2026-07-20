const APP=require('path').join(__dirname,'..','index.html');
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
const on = id => dom.els[id].className==='screen on';
const shown = () => ['home','menu','menu24','game','g24'].filter(on);

// --- exactly one screen visible at every step ---
showHome();
chk('starts on the game picker     ', shown().join(), 'home');
dom.els['pick-match'].onclick();
chk('pick matchstick -> its menu   ', shown().join(), 'menu');
dom.els.back && null;
document.querySelectorAll('.tier[data-tier]')[0].onclick();
chk('open a tier -> matchstick board', shown().join(), 'game');
dom.els.back.onclick();
chk('back -> matchstick menu       ', shown().join(), 'menu');

dom.els['pick-g24'] && showHome();
dom.els['pick-g24'].onclick();
chk('pick 24 -> its menu           ', shown().join(), 'menu24');
document.querySelectorAll('.tier[data-t24]')[0].onclick();
chk('open a tier -> card board     ', shown().join(), 'g24');
dom.els.b24.onclick();
chk('back -> 24 menu               ', shown().join(), 'menu24');

// every menu button is wired
for(const id of ['pick-match','pick-g24','dailybtn','daily24btn','b24','back','homebtn','home24btn','hint24','undo24','reset24','go24','next24'])
  chk((id+' wired').padEnd(30), typeof dom.els[id].onclick, 'function');
for(const b of document.querySelectorAll('.tier[data-t24]'))
  chk(('24 '+b.getAttribute('data-t24')+' tier wired').padEnd(30), typeof b.onclick, 'function');

// --- hint gives a usable step and costs the third star ---
g24.tier='hard'; T=20653*86400; load24(0);
dom.els.hint24.onclick();
chk('hint highlights two cards     ', g24.hint.cards.length, 2);
chk('  names an operator           ', ['+','-','×','÷'].indexOf(g24.hint.op)>=0, true);
chk('  marks the hand as aided     ', g24.usedHint, true);
console.log('     '+dom.els.msg24.textContent);
// follow it, then finish
pick24(g24.hint.cards[0]); chooseOp(g24.hint.op); pick24(g24.hint.cards[1]);
let guard=0;
while(!g24.solved && guard++<6){
  const live=live24(); if(live.length<2) break;
  const s=solve24(live.map(i=>g24.cards[i].val)); if(!s||s.done) break;
  pick24(live[s.i]); chooseOp(s.op); pick24(live[s.j]);
}
chk('hand solved after the hint    ', g24.solved, true);
chk('  hint capped it at 2 stars   ', stars[handKey(hand24())], 2);

// --- both dailies feed one streak ---
daily.done={}; daily.done24={}; daily.streak=0; daily.best=0; daily.last=-99;
T=20653*86400; openDaily24();
while(!g24.solved){ const l=live24(); if(l.length<2) break;
  const s=solve24(l.map(i=>g24.cards[i].val)); if(!s||s.done) break;
  pick24(l[s.i]); chooseOp(s.op); pick24(l[s.j]); }
chk('daily 24 solved               ', g24.solved, true);
chk('  streak started              ', daily.streak, 1);
T=20654*86400; openDaily();            // next day, solve the MATCHSTICK daily instead
tok=encode(lev().s[0]); for(let k=0;k<lev().m;k++) hist.push([]); check();
chk('other game continues streak   ', daily.streak, 2);
chk('  one day counted once        ', dailyCount(), 2);
T=20654*86400; openDaily24();          // same day, other game: must not double-count
while(!g24.solved){ const l=live24(); if(l.length<2) break;
  const s=solve24(l.map(i=>g24.cards[i].val)); if(!s||s.done) break;
  pick24(l[s.i]); chooseOp(s.op); pick24(l[s.j]); }
chk('both games same day, no double', daily.streak, 2);
chk('  still two days counted      ', dailyCount(), 2);

showHome();
console.log('     home: matchstick '+dom.els['hs-match'].textContent+' | 24 game '+dom.els['hs-g24'].textContent);
console.log('     stats: '+dom.els.homestats.textContent.replace(/\s+/g,' ').trim());
console.log(bad? bad+' NAV FAILURES' : 'NAVIGATION + SHARED DAILY OK');

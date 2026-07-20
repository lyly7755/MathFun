const APP=require('path').join(__dirname,'..','index.html');
const fs=require('fs');
const {build}=require('./dom.js');
const dom=build(APP);
global.document=dom.document;
const store={}; global.localStorage={getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v}};
global.Date={now:()=>20653*86400000};
global.setInterval=()=>1; global.clearInterval=()=>{};
const html=fs.readFileSync(APP,'utf8');
eval(html.slice(html.indexOf('<script>')+8, html.indexOf('</script>')));
let bad=0;
const chk=(l,g,e)=>{const ok=(g===e);if(!ok)bad++;console.log((ok?'ok  ':'FAIL')+'  '+l+'  got '+JSON.stringify(g)+' expected '+JSON.stringify(e));};

// exact rational arithmetic
chk('1/3 + 1/3 + 1/3 === 1        ', fStr(fAdd(fAdd(fr(1,3),fr(1,3)),fr(1,3))), '1');
chk('8/(3-8/3) === 24             ', fStr(fDiv(fr(8), fSub(fr(3), fDiv(fr(8),fr(3))))), '24');
chk('divide by zero returns null  ', fDiv(fr(5),fr(0)), null);
chk('fractions normalise          ', fStr(fr(6,8)), '3/4');
chk('negatives normalise          ', fStr(fr(3,-6)), '-1/2');

// the classic hard hand
chk('3,3,8,8 is solvable          ', solvable24([3,3,8,8].map(v=>fr(v))), true);
chk('1,1,1,1 is not               ', solvable24([1,1,1,1].map(v=>fr(v))), false);
chk('4,4,4,4 (4*4+4+4)            ', solvable24([4,4,4,4].map(v=>fr(v))), true);

// every shipped hand must be solvable, and the counts must be tiered as advertised
let n=0, unsolvable=0;
const tiers={easy:[20,999],medium:[4,19],hard:[1,3]};
let misTier=0;
for(const t of ['easy','medium','hard','daily']){
  for(const [cards,cnt] of HANDS24[t]){
    n++;
    if(!solvable24(cards.map(v=>fr(v)))){ unsolvable++; console.log('  UNSOLVABLE', cards); }
    if(tiers[t] && (cnt<tiers[t][0]||cnt>tiers[t][1])){ misTier++; console.log('  WRONG TIER',t,cards,cnt); }
    if(cards.length!==4 || cards.some(c=>c<1||c>13)){ console.log('  BAD CARD',cards); bad++; }
  }
}
chk('every shipped hand solvable  ', unsolvable, 0);
chk('every hand in the right tier ', misTier, 0);
chk('total hands                  ', n, 380);
for(const t of ['easy','medium','hard','daily'])
  console.log('     '+t.padEnd(7)+HANDS24[t].length+' hands');

// solve24 returns a usable first step
const step=solve24([3,3,8,8].map(v=>fr(v)));
console.log('     first step for 3,3,8,8: cards['+step.i+'] '+step.op+' cards['+step.j+'] = '+fStr(step.val));
chk('first step is a real move    ', typeof step.i==='number' && typeof step.op==='string', true);
console.log(bad? bad+' FAILURES' : '24 ENGINE OK');

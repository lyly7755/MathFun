const APP=require('path').join(__dirname,'..','index.html');
/* A search that silently gains or drops a stick would "verify" nonsense.
   Check conservation directly, and hand-check one multi-answer result. */
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
const popcount=s=>encode(s).reduce((a,k)=>{let n=0,v=k.v;while(v){n+=v&1;v>>=1;}return a+n;},0);

// every stored answer must use exactly as many sticks as its puzzle
let mismatch=0, worst=null;
for(const pack of ['easy','medium','hard','daily'])
  for(const lv of PACKS[pack]){
    if(popcount(lv.p)!==popcount(lv.s[0])){ mismatch++; worst=lv; }
  }
chk('every answer conserves sticks  ', mismatch, 0);
if(worst) console.log('   e.g.', worst.p, popcount(worst.p), '->', worst.s[0], popcount(worst.s[0]));

// the multi-answer results from reverify must conserve too
const cases=[['7+2=19',['11+2=13','7+6=13','7+3=10']],['10-4=5',['16-11=5','13-4=9']],
             ['8-4=3',['5+4=9','6-3=3','8+1=9']]];
let mm=0;
for(const [p,sols] of cases) for(const s of sols) if(popcount(p)!==popcount(s)){ mm++; console.log('   BAD',p,popcount(p),s,popcount(s)); }
chk('multi-answer results conserve  ', mm, 0);

// spot-check the loose reading actually produces a new answer
chk('16-11=5 reads back             ', decode(encode('16-11=5')), '16-11=5');
chk('  and is true                  ', isTrue('16-11=5'), true);
chk('  same sticks as 10-4=5        ', popcount('10-4=5')===popcount('16-11=5'), true);
console.log('   10-4=5 uses '+popcount('10-4=5')+' sticks; 16-11=5 uses '+popcount('16-11=5'));

// and a one-move sanity: no puzzle's answer differs by more than m sticks moved
let overMoved=0;
for(const pack of ['easy','medium','hard','daily'])
  for(const lv of PACKS[pack]){
    const a=encode(lv.p), b=encode(lv.s[0]);
    let moved=0;
    for(let i=0;i<a.length;i++){ let d=a[i].v & ~b[i].v; while(d){ moved+=d&1; d>>=1; } }
    if(moved>lv.m) overMoved++;
  }
chk('no answer needs more moves than labelled', overMoved, 0);
console.log(bad? bad+' FAILURES' : 'SEARCH INTEGRITY OK');

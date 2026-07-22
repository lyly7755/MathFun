/* Wordle-style share button on a solved daily: spoiler-free (no puzzle/answer/
   hand leaked), scoped to dailies only, and actually calls navigator.share or
   falls back to the clipboard. This drives the real delegated click listener
   on #msg/#msg24 via dom.js's per-element dispatch() - see its header comment
   for why a single shared "listener" var used to make this untestable. */
const APP=require('path').join(__dirname,'..','index.html');
const fs=require('fs');
const {build}=require('./dom.js');
const dom=build(APP);
global.document=dom.document;
global.window=dom.window;
const store={}; global.localStorage={getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v}};
let T=20653*86400+3600; global.Date={now:()=>T*1000};
global.setInterval=()=>1; global.clearInterval=()=>{};
const html=fs.readFileSync(APP,'utf8');
eval(html.slice(html.indexOf('<script>')+8, html.indexOf('</script>')));

let bad=0;
const chk=(l,g,e)=>{const ok=(g===e);if(!ok)bad++;console.log((ok?'ok  ':'FAIL')+'  '+l+'  got '+JSON.stringify(g)+' expected '+JSON.stringify(e));};

function tapShare(msgId, key){
  const fake={_t:'Share', getAttribute:k=>k==='data-share'?key:null};
  Object.defineProperty(fake,'textContent',{get:()=>fake._t,set:v=>{fake._t=v;}});
  dom.els[msgId].dispatch('click', {target:fake});
  return fake;
}

// ---- matchstick daily: solving shows a share button with spoiler-free text ----
openDaily();
tok=encode(lev().s[0]); for(let k=0;k<lev().m;k++) hist.push([]); check();
chk('daily solved                      ', solved, true);
chk('win message includes Share button ', dom.els.msg.innerHTML.indexOf('data-share="match"')>=0, true);
chk('lastShare.match is populated      ', lastShare.match.length>0, true);
chk('  names the game                  ', lastShare.match.indexOf('Matchstick Math Daily')>=0, true);
chk('  shows a star rating             ', lastShare.match.indexOf('★')>=0, true);
chk('  does NOT leak the puzzle text   ', lastShare.match.indexOf(lev().p)<0, true);
chk('  does NOT leak the answer        ', lastShare.match.indexOf(lev().s[0])<0, true);

// ---- headless (no navigator at all): tapping Share must not throw or relabel ----
let btn=tapShare('msg','match');
chk('no navigator: label unchanged     ', btn.textContent, 'Share');

// ---- navigator.share available: called with the exact share text ----
// Node ships a real global `navigator` (a getter-only accessor since v21), so
// a plain `global.navigator = {...}` silently no-ops - defineProperty to
// actually replace it, same as stubbing any other read-only global here.
let shared=null;
Object.defineProperty(global,'navigator',{configurable:true,value:
  {share:(opts)=>{ shared=opts.text; return Promise.resolve(); }}});
btn=tapShare('msg','match');
chk('navigator.share called w/ text    ', shared, lastShare.match);
chk('button label confirms the share   ', btn.textContent, 'Shared!');

// ---- clipboard fallback when navigator.share is unavailable ----
let copied=null;
Object.defineProperty(global,'navigator',{configurable:true,value:
  {clipboard:{writeText:(t)=>{ copied=t; return Promise.resolve(); }}}});
btn=tapShare('msg','match');
chk('clipboard.writeText called        ', copied, lastShare.match);
chk('button label confirms the copy    ', btn.textContent, 'Copied!');

// ---- non-daily solves get no share button - there's no "everyone played
//      this today" hook, so a share button there would just be noise ----
openTier('easy');
tok=encode(lev().s[0]); for(let k=0;k<lev().m;k++) hist.push([]); check();
chk('non-daily solved                  ', solved, true);
chk('no share button on a regular level', dom.els.msg.innerHTML.indexOf('data-share')>=0, false);

// ---- 24 game daily: same shape ----
openDaily24();
while(!g24.solved){
  const live=live24(); if(live.length<2) break;
  const s=solve24(live.map(i=>g24.cards[i].val)); if(!s||s.done) break;
  pick24(live[s.i]); chooseOp(s.op); pick24(live[s.j]);
}
chk('24 daily solved                   ', g24.solved, true);
chk('win message includes Share button ', dom.els.msg24.innerHTML.indexOf('data-share="g24"')>=0, true);
chk('lastShare.g24 is populated        ', lastShare.g24.length>0, true);
chk('  names the game                  ', lastShare.g24.indexOf('24 Game Daily')>=0, true);
chk('  does NOT leak the hand          ', lastShare.g24.indexOf(hand24()[0].join(','))<0, true);

openTier24('easy');
while(!g24.solved){
  const live=live24(); if(live.length<2) break;
  const s=solve24(live.map(i=>g24.cards[i].val)); if(!s||s.done) break;
  pick24(live[s.i]); chooseOp(s.op); pick24(live[s.j]);
}
chk('non-daily 24 solved               ', g24.solved, true);
chk('no share button on a regular hand ', dom.els.msg24.innerHTML.indexOf('data-share')>=0, false);

console.log(bad? bad+' SHARE FAILURES' : 'SHARE FEATURE OK');

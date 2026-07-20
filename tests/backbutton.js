/* Android's hardware back button fires popstate, not our in-app back buttons.
   Without history.pushState per screen + a popstate handler, it exits the app
   mid-puzzle instead of retracing board -> menu -> game picker (CLAUDE.md
   backlog item). This drives the real popstate path via the fake
   window.history in dom.js - see its header comment for why back() firing
   synchronously is a fair stand-in for the real (queued) browser behavior. */
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
const on = id => dom.els[id].className==='screen on';
const shown = () => ['home','menu','menu24','game','g24'].filter(on);
const back = () => window.history.back();

chk('history wiring is active         ', HIST_OK, true);

// ---- matchstick: home -> menu -> board, then Android back retraces it ----
showHome();
chk('start on the game picker         ', shown().join(), 'home');
dom.els['pick-match'].onclick();
chk('pick matchstick -> its menu      ', shown().join(), 'menu');
document.querySelectorAll('.tier[data-tier]')[0].onclick();
chk('open a tier -> board             ', shown().join(), 'game');

back();
chk('Android back: board -> menu      ', shown().join(), 'menu');
back();
chk('Android back: menu -> picker     ', shown().join(), 'home');

// ---- 24 game: same shape ----
dom.els['pick-g24'].onclick();
chk('pick 24 -> its menu              ', shown().join(), 'menu24');
document.querySelectorAll('.tier[data-t24]')[0].onclick();
chk('open a tier -> card board        ', shown().join(), 'g24');
back();
chk('Android back: cards -> menu      ', shown().join(), 'menu24');
back();
chk('Android back: menu -> picker     ', shown().join(), 'home');

// ---- the in-app back arrow must retrace history too, not just show the
//      menu directly - otherwise Android back and the on-screen arrow would
//      leave the history stack out of sync with what's on screen ----
dom.els['pick-match'].onclick();
document.querySelectorAll('.tier[data-tier]')[0].onclick();
chk('(setup) board shown again        ', shown().join(), 'game');
dom.els.back.onclick();
chk('in-app back arrow -> menu        ', shown().join(), 'menu');
back();
chk('  and Android back still works   ', shown().join(), 'home');

// ---- the menu screens' own Home arrow (new: previously they had no back
//      button at all, so the only way out was an invisible browser back) ----
dom.els['pick-match'].onclick();
chk('(setup) matchstick menu shown    ', shown().join(), 'menu');
dom.els.homebtn.onclick();
chk('menu Home arrow -> picker        ', shown().join(), 'home');

dom.els['pick-g24'].onclick();
chk('(setup) 24 menu shown            ', shown().join(), 'menu24');
dom.els.home24btn.onclick();
chk('24 menu Home arrow -> picker     ', shown().join(), 'home');

// ---- finishing a daily also retraces via history (Give up / Done) ----
dom.els['pick-match'].onclick();
dom.els.dailybtn.onclick();
chk('(setup) daily board shown        ', shown().join(), 'game');
tok=encode(lev().s[0]); for(let k=0;k<lev().m;k++) hist.push([]); check();
chk('  daily solved                   ', solved, true);
dom.els.go.onclick();
chk('"Done" retraces to menu          ', shown().join(), 'menu');

console.log(bad? bad+' BACK-BUTTON FAILURES' : 'BACK BUTTON OK');

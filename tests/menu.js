const APP=require('path').join(__dirname,'..','index.html');
const {build}=require('./dom.js');
const fs=require('fs');
const dom=build(APP);
global.document=dom.document;
const store={};
global.localStorage={getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=String(v)}};
let T=20653*86400+3600; global.Date={now:()=>T*1000};
global.setInterval=()=>1; global.clearInterval=()=>{};
const html=fs.readFileSync(APP,'utf8');
eval(html.slice(html.indexOf('<script>')+8, html.indexOf('</script>')));

let bad=0;
const chk=(l,g,e)=>{const ok=(g===e);if(!ok)bad++;console.log((ok?'ok  ':'FAIL')+'  '+l+'  got '+JSON.stringify(g)+' expected '+JSON.stringify(e));};

// what the real selector actually picks up
const asTier = dom.document.querySelectorAll('.tier').map(e=>e.id||e.getAttribute('data-tier'));
console.log('     .tier matches:', asTier.join(', '));
chk('.tier does include the daily button', asTier.indexOf('dailybtn')>=0, true);

// every menu button must have a working handler
chk('daily button has a handler     ', typeof dom.els.dailybtn.onclick, 'function');
for(const t of ['easy','medium','hard']){
  const btn=dom.document.querySelectorAll('.tier[data-tier]').find(e=>e.getAttribute('data-tier')===t);
  chk(t.padEnd(6)+' button has a handler  ', typeof btn.onclick, 'function');
}

// and clicking each one must land in the right place
dom.els.dailybtn.onclick();
chk('clicking Daily opens the daily ', tier, 'daily');
chk('  with a real puzzle loaded    ', typeof lev().p, 'string');
chk('  game screen shown            ', dom.els.game.className, 'screen on');
chk('  menu hidden                  ', dom.els.menu.className, 'screen');
console.log('     board reads: '+decode(tok)+'   ('+lev().m+' move'+(lev().m>1?'s':'')+', par '+parNow()+'s)');

for(const t of ['easy','medium','hard']){
  const btn=dom.document.querySelectorAll('.tier[data-tier]').find(e=>e.getAttribute('data-tier')===t);
  btn.onclick();
  chk('clicking '+t.padEnd(6)+' opens it     ', tier, t);
}

// back to menu, then daily again (the handler must survive a round trip)
dom.els.back.onclick();
chk('back returns to menu           ', dom.els.menu.className, 'screen on');
dom.els.dailybtn.onclick();
chk('daily still works after a round trip', tier, 'daily');
console.log(bad? bad+' MENU FAILURES' : 'MENU WIRING OK');

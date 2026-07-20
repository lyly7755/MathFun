const APP=require('path').join(__dirname,'..','index.html');
/* the exact board from the screenshot must now explain itself */
const {build}=require('./dom.js');
const fs=require('fs');
const dom=build(APP);
global.document=dom.document;
const store={}; global.localStorage={getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v}};
let T=20653*86400+3600; global.Date={now:()=>T*1000};
global.setInterval=()=>1; global.clearInterval=()=>{};
const html=fs.readFileSync(APP,'utf8');
eval(html.slice(html.indexOf('<script>')+8, html.indexOf('</script>')));
let bad=0;
const chk=(l,g,e)=>{const ok=(g===e);if(!ok)bad++;console.log((ok?'ok  ':'FAIL')+'  '+l+'  got '+JSON.stringify(g)+' expected '+JSON.stringify(e));};
const msg=()=>dom.els.msg.textContent.trim();
const nodes=()=>{const o=[];const re=/<g class="([^"]+)" data-i="(\d+)" data-s="([a-z])"/g;let m;
  while((m=re.exec(dom.els.board.innerHTML)))o.push({cls:m[1],i:+m[2],s:m[3]});return o;};

dom.els.dailybtn.onclick();
const A=alphOf('d'), O=alphOf('o');
// NOTE: the screenshot board (16-5=11) is now a legitimate win - see _dev/loosecheck.js.
// Here we need a slot that is genuinely unreadable: verticals plus a stray middle bar.
tok=encode(lev().p);
tok[5].v = maskOf('bcefg',DS);
hist=[[],[]];
check(); draw();
chk('malformed slot detected        ', JSON.stringify(malformed()), '[5]');
chk('message names the problem      ', msg(), "The red slot isn't a readable digit");
chk('  not the useless generic one  ', msg().indexOf('Not quite')<0, true);
const redSticks=nodes().filter(n=>n.cls.indexOf('bad')>=0);
chk('offending slot marked red      ', redSticks.length>0, true);
chk('  and only that slot           ', redSticks.every(n=>n.i===5), true);
chk('digit slots get a panel each   ', (dom.els.board.innerHTML.match(/class="cell"/g)||[]).length,
    tok.filter(t=>t.t==='d').length);

// a well-formed but false board gets a different, equally specific message
tier='easy'; load(0); hist=[[]];
tok=encode('8-3=1'); check(); draw();
chk('valid-but-false says so        ', msg(), "8-3=1 isn't true - undo and retry");
chk('  nothing marked red           ', nodes().filter(n=>n.cls.indexOf('bad')>=0).length, 0);

// broken operator
load(0); hist=[[]];
tok[1].v&=~bit('h',O); check(); draw();
chk('broken operator explained      ', msg(), "The red slot isn't a + or -");

// and the real solution still wins
load(0); hist=[[]];
tok=encode(lev().s[0]); check(); draw();
chk('correct answer still wins      ', solved, true);
chk('  no red marks on a win        ', nodes().filter(n=>n.cls.indexOf('bad')>=0).length, 0);

// marks clear when you undo
load(0);
const seg=A.split('').find(c=>tok[0].v>>A.indexOf(c)&1);   // a segment the digit actually has
tok[0].v&=~bit(seg,A); hist=[[]]; check(); draw();
chk('marked after a bad move        ', badCells.length>0, true);
dom.els.undo.onclick();
chk('marks cleared on undo          ', badCells.length, 0);
console.log(bad? bad+' FEEDBACK FAILURES' : 'ERROR FEEDBACK OK');

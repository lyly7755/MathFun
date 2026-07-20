const APP=require('path').join(__dirname,'..','index.html');
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

// the exact board from the screenshot
dom.els.dailybtn.onclick();
chk('daily puzzle                   ', lev().p, '76+5=1');
const A=alphOf('d'), O=alphOf('o');
tok[0].v&=~bit('a',A); tok[2].v&=~bit('v',O); tok[5].v|=bit('f',A); tok[5].v|=bit('e',A);
hist=[[],[]];
chk('board now reads                ', decode(tok), '16-5=11');
chk('  and it is true               ', isTrue(decode(tok)), true);
check();
chk('YOUR SOLUTION NOW COUNTS       ', solved, true);
chk('  daily recorded               ', daily.done[dayNo()]>0, true);
chk('  streak started               ', daily.streak, 1);
console.log('     banner: '+dom.els.msg.textContent.replace(/\s+/g,' ').trim());

// left-hand pair alone still reads as a 1
tier='easy'; load(0);
tok=encode('4-3=1'); tok[4].v = maskOf('ef',DS);
chk('left-pair vertical reads as 1  ', decode(tok), '4-3=1');
chk('  and still evaluates          ', isTrue(decode(tok)), true);

// genuinely broken slots are still rejected
tok=encode('4-3=1'); tok[0].v |= bit('a',A);           // 4 + top bar = not a digit
chk('still rejects a real non-digit ', decode(tok), null);
tok=encode('4-3=1'); tok[4].v = maskOf('bcefg',DS);    // verticals plus a middle bar
chk('verticals + extra segment bad  ', decode(tok), null);
console.log(bad? bad+' FAILURES' : 'LOOSE DIGIT READING OK');

const APP=require('path').join(__dirname,'..','index.html');
const fs=require('fs');
const h=fs.readFileSync(APP,'utf8');
const src=h.slice(h.indexOf('<script>')+8, h.indexOf('</script>'));
let listener=null, els={}, store={};
const mkcl=()=>{const c=new Set();return{c,add:x=>c.add(x),remove:x=>c.delete(x),contains:x=>c.has(x)};};
function mk(id){ return els[id]={id,textContent:'',innerHTML:'',className:'',disabled:false,onclick:null,
  classList:mkcl(), setAttribute(){}, addEventListener:(t,f)=>{listener=f;} }; }
['board','lvlnum','sub','msg','undo','reset','go','next','back','clock','par','lvlstars',
 'menu','game','total','sc-easy','sc-medium','sc-hard'].forEach(mk);
const TBTNS=['easy','medium','hard'].map(t=>({getAttribute:()=>t,onclick:null}));
global.document={getElementById:id=>els[id]||mk(id), querySelectorAll:()=>TBTNS};
global.localStorage={getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=String(v)}};
// NOTE: real Date, real setInterval - no mocks this time
eval(src);

function nodes(){const o=[];const re=/<g class="([^"]+)" data-i="(\d+)" data-s="([a-z])"/g;let m;
  while((m=re.exec(els.board.innerHTML)))o.push({cls:m[1],i:+m[2],s:m[3]});return o;}
const tap=n=>listener({target:{getAttribute:k=>k==='data-i'?String(n.i):k==='data-s'?n.s:n.cls}});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

(async()=>{
  openTier('easy'); load(0);
  console.log('before any tap   clock='+JSON.stringify(els.clock.textContent)+'  ticking='+ticking+' timerId='+timerId);
  tap(nodes().find(n=>n.cls.startsWith('stick')));
  console.log('after first tap  clock='+JSON.stringify(els.clock.textContent)+'  ticking='+ticking+' timerId='+timerId);
  await sleep(1300);
  console.log('after 1.3s       clock='+JSON.stringify(els.clock.textContent)+'  curTime='+curTime().toFixed(2));
  await sleep(1300);
  console.log('after 2.6s       clock='+JSON.stringify(els.clock.textContent)+'  curTime='+curTime().toFixed(2));
  if(els.clock.textContent==='0:00') console.log('>>> TIMER IS NOT ADVANCING');
  else console.log('>>> timer advancing');
  process.exit(0);
})();

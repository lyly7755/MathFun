const APP=require('path').join(__dirname,'..','index.html');
// Simulates the failing environment: setInterval NEVER invokes its callback.
const fs=require('fs');
const h=fs.readFileSync(APP,'utf8');
const src=h.slice(h.indexOf('<script>')+8, h.indexOf('</script>'));
let listener=null, els={}, store={};
const mkcl=()=>{const c=new Set();return{c,add:x=>c.add(x),remove:x=>c.delete(x),contains:x=>c.has(x)};};
function mk(id){ return els[id]={id,textContent:'',innerHTML:'',className:'',disabled:false,onclick:null,
  style:{}, classList:mkcl(), setAttribute(){}, addEventListener:function(t,f){ this.listener=f; if(this.id==='board') listener=f; } }; }
['board','lvlnum','sub','msg','undo','reset','go','next','back','clock','par','lvlstars','hint','dailybtn','dailysub','sc-daily','stats',
 'menu','game','total','sc-easy','sc-medium','sc-hard'].forEach(mk);
const TBTNS=['easy','medium','hard'].map(t=>({getAttribute:()=>t,onclick:null}));
global.document={getElementById:id=>els[id]||mk(id), querySelectorAll:()=>TBTNS};
global.localStorage={getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=String(v)}};
let T=1000;
global.Date={now:()=>T*1000};
let armed=0;
global.setInterval=()=>{armed++; return 7;};   // never fires
global.clearInterval=()=>{};
eval(src);

function nodes(){const o=[];const re=/<g class="([^"]+)" data-i="(\d+)" data-s="([a-z])"/g;let m;
  while((m=re.exec(els.board.innerHTML)))o.push({cls:m[1],i:+m[2],s:m[3]});return o;}
const tap=n=>listener({target:{getAttribute:k=>k==='data-i'?String(n.i):k==='data-s'?n.s:n.cls}});
let bad=0;
const chk=(l,g,e)=>{const ok=g===e; if(!ok)bad++; console.log((ok?'ok  ':'FAIL')+'  '+l+'  got '+JSON.stringify(g)+' expected '+JSON.stringify(e));};

openTier('easy'); load(0);
chk('clock on load            ', els.clock.textContent, '0:00');
console.log('     (timer armed '+armed+'x, but its callback never runs)');

T += 7;
tap(nodes().find(n=>n.cls.startsWith('stick')));          // select -> triggers draw -> repaint
chk('clock after 7s + a tap   ', els.clock.textContent, '0:07');

T += 65;
tap(nodes().find(n=>n.cls.startsWith('stick')));          // another tap
chk('clock after 72s + a tap  ', els.clock.textContent, '1:12');

// now solve it and confirm the award reflects real elapsed time, not zero
const target=PACKS.easy[0].s[0];
load(0); T=1000;
let seq=null;
(function rec(d,acc){ if(seq) return;
  if(decode(tok)===target){ seq=acc.slice(); return; }
  if(d===1) return;
  for(const st of nodes().filter(n=>n.cls.startsWith('stick'))){
    const q={tok:tok.map(z=>({t:z.t,v:z.v})),hist:hist.slice(),solved};
    sel=null; draw(); tap(st);
    for(const gh of nodes().filter(n=>n.cls.startsWith('slot'))){
      const q2={tok:tok.map(z=>({t:z.t,v:z.v})),hist:hist.slice(),solved};
      tap(gh); rec(d+1,acc.concat([st,gh])); if(seq) return;
      tok=q2.tok;hist=q2.hist;solved=q2.solved;sel={i:st.i,s:st.s};draw();
    }
    tok=q.tok;hist=q.hist;solved=q.solved;sel=null;draw();
  }
})(0,[]);
delete stars[PACKS.easy[0].p];          // stars are keyed by puzzle text now
load(0); T=1000;
tap(seq[0]); T+=48; tap(seq[1]);      // 48s on a 30s par -> 2 stars
chk('clock at win             ', els.clock.textContent, '0:48');
chk('stars for a 48s solve    ', starsFor('easy',0), 2);
console.log('     win banner: '+els.msg.innerHTML.replace(/<[^>]+>/g,' ').replace(/&nbsp;|&middot;/g,' ').replace(/\s+/g,' ').trim());
console.log(bad? bad+' FAILURES' : 'CLOCK + STARS CORRECT EVEN WITH DEAD TIMERS');

const APP=require('path').join(__dirname,'..','index.html');
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
global.setInterval=()=>1; global.clearInterval=()=>{};
eval(src);

function nodes(){const o=[];const re=/<g class="([^"]+)" data-i="(\d+)" data-s="([a-z])"/g;let m;
  while((m=re.exec(els.board.innerHTML)))o.push({cls:m[1],i:+m[2],s:m[3]});return o;}
const tap=n=>listener({target:{getAttribute:k=>k==='data-i'?String(n.i):k==='data-s'?n.s:n.cls}});

// find the tap sequence that solves the current level
function findSeq(){
  const target=lev().s[0], M=lev().m;
  const snap=()=>({tok:tok.map(z=>({t:z.t,v:z.v})),hist:hist.slice(),solved,sel});
  const rest=q=>{tok=q.tok.map(z=>({t:z.t,v:z.v}));hist=q.hist.slice();solved=q.solved;sel=q.sel;draw();};
  let seq=null;
  (function rec(d,acc){
    if(seq) return;
    if(decode(tok)===target){ seq=acc.slice(); return; }
    if(d===M) return;
    for(const st of nodes().filter(n=>n.cls.startsWith('stick'))){
      const q=snap(); sel=null; draw(); tap(st);
      for(const gh of nodes().filter(n=>n.cls.startsWith('slot'))){
        const q2=snap(); tap(gh); rec(d+1,acc.concat([st,gh])); if(seq) return;
        rest(q2);
      }
      rest(q);
    }
  })(0,[]);
  return seq;
}
function play(tier,li,seconds,withUndo){
  openTier(tier); load(li);
  const seq=findSeq();                       // probing taps can award stars - wipe them
  delete stars[PACKS[tier][li].p];      // stars are keyed by puzzle text now
  T=1000; load(li);            // clock now starts on load, so set the fake time first
  if(withUndo){                              // make a WRONG move, take it back, then solve properly
    tap(seq[0]);
    const wrong=nodes().filter(n=>n.cls.startsWith('slot')).find(n=>!(n.i===seq[1].i&&n.s===seq[1].s));
    tap(wrong); els.undo.onclick(); sel=null; draw();
  }
  for(let k=0;k<seq.length;k++){
    if(k===seq.length-1) T += seconds;        // burn the clock just before the winning tap
    tap(seq[k]);
  }
  return {stars:starsFor(tier,li), solved, msg:els.msg.innerHTML};
}
let bad=0;
const T3=(label,got,exp)=>{ const ok=got===exp; if(!ok)bad++; console.log((ok?'ok  ':'FAIL')+'  '+label+'  got '+got+' expected '+exp); };

// easy par = 30
T3('easy, 5s, clean            ', play('easy',0,5,false).stars, 3);
T3('easy, 40s (over par)       ', play('easy',1,40,false).stars, 2);
T3('easy, 200s (way over)      ', play('easy',2,200,false).stars, 1);
T3('easy, 5s but used undo     ', play('easy',3,5,true).stars,  2);
// hard par = 90
T3('hard, 60s, clean           ', play('hard',0,60,false).stars, 3);
T3('hard, 120s                 ', play('hard',1,120,false).stars, 2);

// best score must be kept, never lowered
play('easy',0,5,false);
setStars('easy',0,1);
T3('best score kept, not lowered', starsFor('easy',0), 3);
T3('persisted to localStorage  ', JSON.parse(store['ms_stars2'])[PACKS.easy[0].p], 3);
// menu totals
showMenu();
console.log('menu:', els['sc-easy'].textContent, '|', els.total.textContent);
console.log(bad? bad+' STAR FAILURES' : 'STAR + TIMER LOGIC OK');

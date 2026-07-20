const APP=require('path').join(__dirname,'..','index.html');
const fs=require('fs');
const h=fs.readFileSync(APP,'utf8');
const i=h.indexOf('<script>'), j=h.indexOf('</script>');
if(i<0||j<0||!h.trimEnd().endsWith('</html>')){ console.log('FILE TRUNCATED'); process.exit(1); }
console.log('file intact:', h.length, 'bytes');
const src=h.slice(i+8,j);
if(/\beval\s*\(|new Function|[^a-z]Function\s*\(/.test(src.replace(/\/\*[\s\S]*?\*\//g,''))){ console.log('!! eval/Function present'); }

// ---- fake DOM ----
let listener=null, els={}, store={};
const mkcl=()=>{const c=new Set();return{c,add:x=>c.add(x),remove:x=>c.delete(x),contains:x=>c.has(x)};};
function mk(id){ return els[id]={id,textContent:'',innerHTML:'',className:'',disabled:false,onclick:null,
  style:{}, classList:mkcl(), setAttribute(){}, addEventListener:function(t,f){ this.listener=f; if(this.id==='board') listener=f; } }; }
['board','lvlnum','sub','msg','undo','reset','go','next','prev','back','clock','par','lvlstars','hint','dailybtn','dailysub','sc-daily','stats',
 'menu','game','total','sc-easy','sc-medium','sc-hard'].forEach(mk);
const TBTNS=['easy','medium','hard'].map(t=>({getAttribute:()=>t,onclick:null}));
global.document={getElementById:id=>els[id]||mk(id), querySelectorAll:()=>TBTNS};
global.localStorage={getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=String(v)}};
let FAKE_NOW=1000;
global.Date={now:()=>FAKE_NOW*1000};
global.setInterval=()=>1; global.clearInterval=()=>{};

eval(src);

function nodes(){
  const out=[]; const re=/<g class="([^"]+)" data-i="(\d+)" data-s="([a-z])"/g; let m;
  while((m=re.exec(els.board.innerHTML))) out.push({cls:m[1],i:+m[2],s:m[3]});
  return out;
}
const tap=n=>listener({target:{getAttribute:k=>k==='data-i'?String(n.i):k==='data-s'?n.s:n.cls}});

let fails=0, checked=0;
for(const t of ORDER){
  openTier(t);
  for(let li=0; li<PACKS[t].length; li++){
    load(li);
    const target=PACKS[t][li].s[0], M=PACKS[t][li].m;
    const snapshot=()=>({tok:tok.map(z=>({t:z.t,v:z.v})),hist:hist.slice(),solved});
    const restore=q=>{tok=q.tok.map(z=>({t:z.t,v:z.v}));hist=q.hist.slice();solved=q.solved;};
    let won=false;
    (function rec(depth){
      if(won) return;
      if(decode(tok)===target && solved){ won=true; return; }
      if(depth===M) return;
      for(const st of nodes().filter(n=>n.cls.startsWith('stick'))){
        const q=snapshot(); sel=null; draw(); tap(st);
        for(const gh of nodes().filter(n=>n.cls.startsWith('slot'))){
          const q2=snapshot(); tap(gh); rec(depth+1); if(won) return;
          restore(q2); sel={i:st.i,s:st.s}; draw();
        }
        restore(q); sel=null; draw();
      }
    })(0);
    checked++;
    if(!won){ console.log('FAIL',t,li+1,PACKS[t][li].p,'-> unreachable via taps:',target); fails++; }
  }
}
console.log(fails===0 ? 'ALL '+checked+' LEVELS SOLVABLE VIA UI TAPS + WIN DETECTED' : fails+' LEVEL FAILURES');

// ---- hard mode must hide the guides, but slots must remain tappable ----
function slotProbe(t){
  openTier(t); load(0);
  const st=nodes().find(n=>n.cls.startsWith('stick')); tap(st);
  const sl=nodes().filter(n=>n.cls.startsWith('slot'));
  return {count:sl.length, blind:sl.every(n=>n.cls.indexOf('blind')>=0)};
}
const pe=slotProbe('easy'), pm=slotProbe('medium'), ph=slotProbe('hard');
console.log('easy   slots:',pe.count,'blind:',pe.blind);
console.log('medium slots:',pm.count,'blind:',pm.blind);
console.log('hard   slots:',ph.count,'blind:',ph.blind);
if(pe.blind||pm.blind||!ph.blind||ph.count===0) console.log('!! blind-mode FAIL'); else console.log('blind mode OK (hard hidden, still tappable)');

const APP=require('path').join(__dirname,'..','index.html');
/* difficulty ordering is monotone, and star storage survives a re-order */
const fs=require('fs');
const h=fs.readFileSync(APP,'utf8');
const src=h.slice(h.indexOf('<script>')+8, h.indexOf('</script>'));
let listener=null, els={}, store={};
const mkcl=()=>{const c=new Set();return{c,add:x=>c.add(x),remove:x=>c.delete(x),contains:x=>c.has(x)};};
function mk(id){
  const e={id,_t:'',_h:'',className:'',disabled:false,onclick:null,style:{},
    classList:mkcl(),setAttribute(){},addEventListener:(t,f)=>{listener=f;}};
  Object.defineProperty(e,'textContent',{get:()=>e._t,set:v=>{e._t=v;e._h=v;}});
  Object.defineProperty(e,'innerHTML',{get:()=>e._h,set:v=>{e._h=v;e._t=String(v).replace(/<[^>]+>/g,' ');}});
  return els[id]=e;
}
['board','lvlnum','sub','msg','undo','reset','go','next','prev','back','clock','par','lvlstars','hint',
 'dailybtn','dailysub','sc-daily','stats','menu','game','total','sc-easy','sc-medium','sc-hard'].forEach(mk);
global.document={getElementById:id=>els[id]||mk(id),querySelectorAll:()=>['easy','medium','hard'].map(t=>({getAttribute:()=>t,onclick:null}))};
global.localStorage={getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=String(v)}};
let T=20653*86400; global.Date={now:()=>T*1000};
global.setInterval=()=>1; global.clearInterval=()=>{};
eval(src);
let bad=0;
const chk=(l,g,e)=>{const ok=(g===e);if(!ok)bad++;console.log((ok?'ok  ':'FAIL')+'  '+l+'  got '+JSON.stringify(g)+' expected '+JSON.stringify(e));};

// --- decoy count (the dominant difficulty feature) should trend upward across a tier ---
function decoys(p){
  const t=encode(p); let n=0;
  t.forEach((k,i)=>{ for(let b=0;b<NBITS[k.t];b++){ if(!(k.v>>b&1)) continue;
    t.forEach((k2,j)=>{ for(let c=0;c<NBITS[k2.t];c++){ if(k2.v>>c&1) continue;
      if(i===j&&b===c) continue;
      const ns=t.map(z=>({t:z.t,v:z.v})); ns[i].v&=~(1<<b); ns[j].v|=1<<c;
      const e=decode(ns);
      if(e && e.length===p.length && !isTrue(e)) n++; }});
  }});
  return n;
}
for(const tier of ORDER){
  const pack=PACKS[tier];
  const d=pack.map(l=>decoys(l.p));
  const firstThird=d.slice(0,20).reduce((a,b)=>a+b,0)/20;
  const lastThird =d.slice(-20).reduce((a,b)=>a+b,0)/20;
  // Spearman correlation between position and decoy count
  const rank=a=>{const s=a.map((v,i)=>[v,i]).sort((x,y)=>x[0]-y[0]);const r=[];s.forEach(([v,i],k)=>r[i]=k);return r;};
  const rp=rank(d.map((_,i)=>i)), rd=rank(d), n=d.length;
  let ss=0; for(let i=0;i<n;i++) ss+=(rp[i]-rd[i])**2;
  const rho=1-6*ss/(n*(n*n-1));
  console.log(tier.padEnd(7)+' decoys: first 20 avg '+firstThird.toFixed(1)+
              ' -> last 20 avg '+lastThird.toFixed(1)+'   rho='+rho.toFixed(2));
  chk('  '+tier+' ramps upward       ', lastThird>firstThird, true);
}

// --- stars must follow the puzzle, not the slot it sits in ---
openTier('easy');
const p10=PACKS.easy[10].p, p40=PACKS.easy[40].p;
setStars('easy',10,3); setStars('easy',40,2);
chk('star recorded on level 11      ', starsFor('easy',10), 3);
const saved=JSON.parse(store['ms_stars2']);
chk('stored under the puzzle text   ', saved[p10], 3);
chk('  not under an index           ', saved['10'], undefined);
// simulate a future re-balance: reverse the pack and confirm stars follow
PACKS.easy.reverse();
const newPos=PACKS.easy.findIndex(l=>l.p===p10);
chk('stars follow puzzle after reorder', starsFor('easy',newPos), 3);
chk('  and the other one too        ', starsFor('easy',PACKS.easy.findIndex(l=>l.p===p40)), 2);
PACKS.easy.reverse();
chk('best-score-kept still holds    ', (setStars('easy',10,1), starsFor('easy',10)), 3);
console.log(bad? bad+' ORDER FAILURES' : 'DIFFICULTY ORDER + STAR STORAGE OK');

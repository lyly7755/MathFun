const APP=require('path').join(__dirname,'..','index.html');
/* Exhaustive re-verification of every shipped puzzle under the LOOSENED digit rules.
   Crucially this evaluates the real shipped <script> and uses ITS encode/decode/isTrue
   and ITS digit table - not a reimplementation - so it tests what actually ships. */
const fs=require('fs');
const {build}=require('./dom.js');
const dom=build(APP);
global.document=dom.document;
const store={}; global.localStorage={getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v}};
global.Date={now:()=>20653*86400000};
global.setInterval=()=>1; global.clearInterval=()=>{};
const html=fs.readFileSync(APP,'utf8');
eval(html.slice(html.indexOf('<script>')+8, html.indexOf('</script>')));

const table=Object.keys(MASK2D).map(m=>MASK2D[m]);
console.log('digit table in the shipped file:', table.sort().join(' '), '('+table.length+' readings)');
console.log('loose readings present:', table.filter(x=>x==='1').length===2 && table.indexOf('11')>=0);
console.log();

/* fast exhaustive search over the real rules; states are plain int arrays */
const TYPES=[], NB=[];
function statesFrom(p){
  const t=encode(p);
  return {types:t.map(k=>k.t), v:t.map(k=>k.v)};
}
function search(p, depth){
  const {types,v0}= (()=>{const s=statesFrom(p);return{types:s.types,v0:s.v};})();
  const n=types.length, nb=types.map(t=>NBITS[t]);
  const found=new Set();
  const cur=[v0];
  let frontier=cur;
  const seenByDepth=[];
  for(let d=0; d<depth; d++){
    const next=[];
    for(const v of frontier){
      for(let i=0;i<n;i++){
        for(let b=0;b<nb[i];b++){
          if(!(v[i]>>b&1)) continue;
          for(let j=0;j<n;j++){
            for(let c=0;c<nb[j];c++){
              if(v[j]>>c&1) continue;
              if(i===j&&b===c) continue;
              const w=v.slice();
              w[i]&=~(1<<b); w[j]|=1<<c;
              next.push(w);
            }
          }
        }
      }
    }
    frontier=next;
    seenByDepth[d]=next;
  }
  for(const v of seenByDepth[depth-1]){
    const e=decode(v.map((x,i)=>({t:types[i],v:x})));
    if(e && isTrue(e)) found.add(e);
  }
  return found;
}

let alreadyTrue=0, unreachable=0, easier=0, checked=0;
const multi=[];
const packs=['easy','medium','hard','daily'];
for(const pack of packs){
  let pMulti=0, pEasier=0, pUnreach=0;
  for(const lv of PACKS[pack]){
    checked++;
    if(isTrue(lv.p)){ alreadyTrue++; console.log('  ALREADY TRUE:', lv.p); }
    const atM=search(lv.p, lv.m);
    if(!atM.has(lv.s[0])){ unreachable++; pUnreach++; console.log('  UNREACHABLE:', lv.p, '->', lv.s[0], [...atM].slice(0,4)); }
    if(lv.m===2){
      const at1=search(lv.p,1);
      if(at1.size){ easier++; pEasier++; console.log('  SOLVABLE IN 1 BUT LABELLED 2:', lv.p, [...at1]); }
    }
    if(atM.size>1){ pMulti++; multi.push([lv.p, lv.m, [...atM]]); }
  }
  console.log(`${pack.padEnd(7)} ${String(PACKS[pack].length).padStart(4)} puzzles | unreachable ${pUnreach} | too easy ${pEasier} | multi-answer ${pMulti}`);
}
console.log();
console.log('checked            :', checked);
console.log('already true       :', alreadyTrue, '(want 0)');
console.log('stored answer unreachable in the labelled moves:', unreachable, '(want 0)');
console.log('2-move puzzles solvable in 1                  :', easier, '(want 0)');
console.log('puzzles with more than one valid answer       :', multi.length);
console.log();
console.log('examples of newly multi-answer puzzles:');
for(const [p,m,sols] of multi.slice(0,6)) console.log('  '+p+'  ('+m+' moves) ->', sols.join('  '));
const ok = alreadyTrue===0 && unreachable===0 && easier===0;
console.log();
console.log(ok ? 'ALL '+checked+' PUZZLES RE-VERIFIED UNDER THE LOOSENED RULES'
               : 'RE-VERIFICATION FAILED');

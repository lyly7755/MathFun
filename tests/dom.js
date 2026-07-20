/* A fake DOM that mirrors the REAL markup: elements carry their actual class and
   data-tier attributes, and querySelectorAll genuinely matches against them.
   The previous stub hard-coded the three tier buttons, which is exactly why the
   Daily button being clobbered by querySelectorAll('.tier') slipped through. */
const fs=require('fs');
function build(htmlPath){
  const html=fs.readFileSync(htmlPath,'utf8');
  const els={}; let listener=null;
  const mkcl=()=>{const c=new Set();return{c,add:x=>c.add(x),remove:x=>c.delete(x),contains:x=>c.has(x)};};
  function mk(id, attrs){
    const a=Object.assign({},attrs||{});
    const e={id,_t:'',_h:'',className:a['class']||'',disabled:false,onclick:null,style:{},
      classList:mkcl(), attrs:a,
      getAttribute:k=>(k in a? a[k] : null),
      setAttribute:(k,v)=>{a[k]=v;},
      addEventListener:(t,f)=>{listener=f;}};
    Object.defineProperty(e,'textContent',{get:()=>e._t,set:v=>{e._t=v;e._h=v;}});
    Object.defineProperty(e,'innerHTML',{get:()=>e._h,set:v=>{e._h=v;e._t=String(v).replace(/<[^>]+>/g,' ');}});
    return els[id]=e;
  }
  // register every id'd element exactly as the HTML declares it
  const tagRe=/<(button|div|span|main|svg|footer|header)\b([^>]*)>/g; let m;
  const anon=[];
  while((m=tagRe.exec(html))){
    const attrStr=m[2], attrs={};
    let am, aRe=/([a-zA-Z0-9_-]+)="([^"]*)"/g;   // digits allowed: data-t24
    while((am=aRe.exec(attrStr))) attrs[am[1]]=am[2];
    if(attrs.id) mk(attrs.id, attrs);
    else if(attrs['class']) anon.push(mk('__anon'+anon.length, attrs));
  }
  const all=()=>Object.keys(els).map(k=>els[k]);
  function matches(el, sel){
    // supports ".cls" and ".cls[attr]"
    const m2=/^\.([\w-]+)(?:\[([\w-]+)\])?$/.exec(sel);
    if(!m2) throw new Error('fake DOM: unsupported selector '+sel);
    const cls=(el.getAttribute('class')||'').split(/\s+/);
    if(cls.indexOf(m2[1])<0) return false;
    if(m2[2] && el.getAttribute(m2[2])===null) return false;
    return true;
  }
  const document={
    getElementById:id=>els[id]||mk(id,{}),
    querySelectorAll:sel=>all().filter(e=>matches(e,sel))
  };

  // minimal window.history: enough to drive real popstate-based navigation.
  // back()/forward() dispatch synchronously - real browsers queue popstate as
  // a task, but nothing else runs between a click and that task here, so the
  // end state is identical and tests can assert right after calling back().
  let stack=[{state:null}], at=0; const popListeners=[];
  function firePop(){ const ev={state:stack[at].state}; popListeners.slice().forEach(f=>f(ev)); }
  const history={
    pushState:(state)=>{ stack=stack.slice(0,at+1); stack.push({state}); at=stack.length-1; },
    replaceState:(state)=>{ stack[at]={state}; },
    back:()=>{ if(at>0){ at--; firePop(); } },
    forward:()=>{ if(at<stack.length-1){ at++; firePop(); } },
    get length(){ return stack.length; },
    get state(){ return stack[at].state; }
  };
  const window={
    history,
    addEventListener:(t,f)=>{ if(t==='popstate') popListeners.push(f); },
    removeEventListener:(t,f)=>{ const i=popListeners.indexOf(f); if(i>=0) popListeners.splice(i,1); }
  };

  return {document, window, els, fire:(...a)=>listener(...a), get listener(){return listener;}};
}
module.exports={build};

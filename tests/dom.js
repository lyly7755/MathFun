/* A fake DOM that mirrors the REAL markup: elements carry their actual class and
   data-tier attributes, and querySelectorAll genuinely matches against them.
   The previous stub hard-coded the three tier buttons, which is exactly why the
   Daily button being clobbered by querySelectorAll('.tier') slipped through. */
const fs=require('fs');
function build(htmlPath){
  const html=fs.readFileSync(htmlPath,'utf8');
  const els={};
  const mkcl=()=>{const c=new Set();return{c,add:x=>c.add(x),remove:x=>c.delete(x),contains:x=>c.has(x),
    toggle:x=>{ if(c.has(x)){c.delete(x);return false;} c.add(x); return true; }};};
  function mk(id, attrs){
    const a=Object.assign({},attrs||{});
    const listeners={};   // per-element, per-type - see the CLAUDE.md history on why a
                           // single shared listener silently drops the other elements'
    const e={id,_t:'',_h:'',className:a['class']||'',disabled:false,onclick:null,style:{},
      classList:mkcl(), attrs:a,
      getAttribute:k=>(k in a? a[k] : null),
      setAttribute:(k,v)=>{a[k]=v;},
      addEventListener:(t,f)=>{ (listeners[t]=listeners[t]||[]).push(f); },
      removeEventListener:(t,f)=>{ const l=listeners[t]; if(l){ const i=l.indexOf(f); if(i>=0) l.splice(i,1); } },
      dispatch:(t,ev)=>{ (listeners[t]||[]).slice().forEach(f=>f(ev||{target:e})); }};
    Object.defineProperty(e,'textContent',{get:()=>e._t,set:v=>{e._t=v;e._h=v;}});
    Object.defineProperty(e,'innerHTML',{get:()=>e._h,set:v=>{e._h=v;e._t=String(v).replace(/<[^>]+>/g,' ');}});
    return els[id]=e;
  }
  // register every id'd element exactly as the HTML declares it
  const tagRe=/<(button|div|span|main|svg|footer|header|em)\b([^>]*)>/g; let m;
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

  // generic per-type listener store, so window.addEventListener works for any
  // event (popstate, beforeinstallprompt, appinstalled, ...) - not just the
  // one type a test happened to need first. dispatch() lets a test fire any
  // of them, same shape as the per-element dispatch() above.
  const winListeners={};
  const windowAddEventListener=(t,f)=>{ (winListeners[t]=winListeners[t]||[]).push(f); };
  const windowRemoveEventListener=(t,f)=>{ const l=winListeners[t]; if(l){ const i=l.indexOf(f); if(i>=0) l.splice(i,1); } };
  const windowDispatch=(t,ev)=>{ (winListeners[t]||[]).slice().forEach(f=>f(ev||{})); };

  // minimal window.history: enough to drive real popstate-based navigation.
  // back()/forward() dispatch synchronously - real browsers queue popstate as
  // a task, but nothing else runs between a click and that task here, so the
  // end state is identical and tests can assert right after calling back().
  let stack=[{state:null}], at=0;
  const history={
    pushState:(state)=>{ stack=stack.slice(0,at+1); stack.push({state}); at=stack.length-1; },
    replaceState:(state)=>{ stack[at]={state}; },
    back:()=>{ if(at>0){ at--; windowDispatch('popstate', {state:stack[at].state}); } },
    forward:()=>{ if(at<stack.length-1){ at++; windowDispatch('popstate', {state:stack[at].state}); } },
    get length(){ return stack.length; },
    get state(){ return stack[at].state; }
  };
  const window={
    history,
    addEventListener: windowAddEventListener,
    removeEventListener: windowRemoveEventListener,
    dispatch: windowDispatch
  };

  return {document, window, els};
}
module.exports={build};

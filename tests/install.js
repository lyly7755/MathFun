/* Add-to-home-screen discoverability. Android Chrome gets a real one-tap
   install button via beforeinstallprompt; iOS Safari has no such API at all,
   so it gets on-screen instructions instead. Both funnel into one banner
   that must: stay hidden by default, respect standalone mode, respect a
   permanent dismissal, and never show when there's nothing actionable to
   suggest (desktop Firefox, etc). Drives the real beforeinstallprompt/
   appinstalled path via dom.js's now-generic window.dispatch(). */
const APP=require('path').join(__dirname,'..','index.html');
const fs=require('fs');
const {build}=require('./dom.js');
const html=fs.readFileSync(APP,'utf8');
const SRC=html.slice(html.indexOf('<script>')+8, html.indexOf('</script>'));

let bad=0;
const chk=(l,g,e)=>{const ok=(g===e);if(!ok)bad++;console.log((ok?'ok  ':'FAIL')+'  '+l+'  got '+JSON.stringify(g)+' expected '+JSON.stringify(e));};
const shown=dom=>dom.els.installbar.style.display;

function freshDom(navOverrides){
  const dom=build(APP);
  global.document=dom.document;
  global.window=dom.window;
  const store={}; global.localStorage={getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v}};
  global.Date={now:()=>(20653*86400+3600)*1000};
  global.setInterval=()=>1; global.clearInterval=()=>{};
  Object.defineProperty(global,'navigator',{configurable:true,
    value:Object.assign({userAgent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}, navOverrides||{})});
  return {dom, store};
}

// ---- default desktop browser: nothing actionable, banner stays hidden ----
{
  const {dom}=freshDom();
  eval(SRC);
  chk('desktop, no prompt support: hidden', shown(dom), 'none');
}

// ---- iOS Safari, not yet installed: shows instructions, no install button ----
{
  const {dom}=freshDom({userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit'});
  eval(SRC);
  chk('iOS: banner shown                ', shown(dom), 'flex');
  chk('  shows the Share instructions   ', dom.els.installtext.textContent, tr('installIOSText'));
  chk('  no install button (no API)     ', dom.els.installbtn.style.display, 'none');
}

// ---- iOS already running standalone: never nag an already-installed user ----
{
  const {dom}=freshDom({userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', standalone:true});
  eval(SRC);
  chk('iOS standalone: banner hidden    ', shown(dom), 'none');
}

// ---- generic standalone detection via matchMedia (Android/desktop installed PWAs) ----
{
  const {dom}=freshDom();
  dom.window.matchMedia = () => ({matches:true});
  eval(SRC);
  chk('matchMedia standalone: hidden    ', shown(dom), 'none');
}

// ---- Android Chrome: beforeinstallprompt fires, banner offers a real install button ----
{
  const {dom, store}=freshDom({userAgent:'Mozilla/5.0 (Linux; Android 14) Chrome/125'});
  eval(SRC);
  chk('before the event: still hidden   ', shown(dom), 'none');

  let prevented=false, promptCalled=false, choiceResolved=false;
  const fakeEvent={
    preventDefault:()=>{ prevented=true; },
    prompt:()=>{ promptCalled=true; },
    userChoice:{ then:(f)=>{ choiceResolved=true; f(); return {catch:()=>{}}; } }
  };
  dom.window.dispatch('beforeinstallprompt', fakeEvent);
  chk('event default prevented          ', prevented, true);
  chk('banner now shown                 ', shown(dom), 'flex');
  chk('  shows the Android copy         ', dom.els.installtext.textContent, tr('installAndroidText'));
  chk('  shows a real install button    ', dom.els.installbtn.style.display, '');

  dom.els.installbtn.onclick();
  chk('tapping Install calls prompt()   ', promptCalled, true);
  chk('  and awaits userChoice          ', choiceResolved, true);

  // dismissing persists and hides the banner
  dom.els.installclose.onclick();
  chk('close button hides the banner    ', shown(dom), 'none');
  chk('  dismissal persisted            ', store['ms_install_dismissed'], '1');
}

// ---- a returning visitor who already dismissed it never sees it again ----
{
  const {dom, store}=freshDom({userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'});
  store['ms_install_dismissed']='1';
  eval(SRC);
  chk('previously-dismissed: stays hidden', shown(dom), 'none');
}

// ---- appinstalled fires (e.g. installed via the browser's own menu, not our
//      button): must still clean up and hide the banner ----
{
  const {dom}=freshDom({userAgent:'Mozilla/5.0 (Linux; Android 14) Chrome/125'});
  eval(SRC);
  dom.window.dispatch('beforeinstallprompt', {preventDefault:()=>{}, prompt:()=>{}, userChoice:{then:()=>({catch:()=>{}})}});
  chk('(setup) banner visible before install', shown(dom), 'flex');
  dom.window.dispatch('appinstalled', {});
  chk('appinstalled hides the banner    ', shown(dom), 'none');
}

console.log(bad? bad+' INSTALL-BANNER FAILURES' : 'INSTALL BANNER OK');

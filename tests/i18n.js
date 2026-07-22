/* Multi-language support: dictionaries for en/es/fr/zh, a tr()/{placeholder}
   lookup (named tr(), NOT t() - this file's own header comment on that
   choice explains why: "t" is already a local var/param almost everywhere
   in index.html, and a global t() would get silently shadowed and crash).
   Covers: switching updates visible text, the choice persists, mid-puzzle
   state survives a switch, missing keys fall back to English, and the
   dropdown wiring itself works. */
const APP=require('path').join(__dirname,'..','index.html');
const fs=require('fs');
const {build}=require('./dom.js');
const html=fs.readFileSync(APP,'utf8');
const SRC=html.slice(html.indexOf('<script>')+8, html.indexOf('</script>'));

let bad=0;
const chk=(l,g,e)=>{const ok=(g===e);if(!ok)bad++;console.log((ok?'ok  ':'FAIL')+'  '+l+'  got '+JSON.stringify(g)+' expected '+JSON.stringify(e));};

// ---- fresh instance, default (English, no saved preference) ----
const dom=build(APP);
global.document=dom.document;
global.window=dom.window;
const store={}; global.localStorage={getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v}};
let T=20653*86400+3600; global.Date={now:()=>T*1000};
global.setInterval=()=>1; global.clearInterval=()=>{};
eval(SRC);

chk('defaults to English with no saved pref', lang, 'en');

// find the appName span via the same .i18n query the app itself uses
function i18nText(key){
  const els=document.querySelectorAll('.i18n').filter(e=>e.getAttribute('data-i18n')===key);
  return els.length ? els[0].textContent : undefined;
}
chk('appName renders in English       ', i18nText('appName'), 'Math Fun');
chk('hint button renders in English   ', i18nText('hint'), 'Hint');

// ---- switching language updates visible text immediately ----
setLang('es');
chk('lang switched to es               ', lang, 'es');
chk('appName re-rendered in Spanish    ', i18nText('appName'), 'Math Fun');   // brand name stays constant
chk('hint button re-rendered in Spanish', i18nText('hint'), 'Pista');
chk('easy tier label in Spanish        ', i18nText('easyLabel'), 'Fácil');

// ---- the choice persists to localStorage, and a fresh load picks it up ----
chk('lang persisted to localStorage    ', store['ms_lang'], 'es');

// ---- switching back and forth doesn't corrupt anything ----
setLang('fr'); setLang('zh'); setLang('en');
chk('back to English cleanly           ', i18nText('hint'), 'Hint');

// ---- unknown language code is a no-op, never crashes or blanks the UI ----
setLang('xx');
chk('unknown lang code ignored         ', lang, 'en');
chk('  UI still intact                 ', i18nText('hint'), 'Hint');

// ---- missing key falls back to English, never shows blank/undefined ----
setLang('es');
const savedKey = I18N.es.hint;
delete I18N.es.hint;
chk('missing es key falls back to en   ', tr('hint'), 'Hint');
I18N.es.hint = savedKey;
chk('key restored                      ', tr('hint'), 'Pista');
setLang('en');

// ---- template placeholders substitute correctly, order-independent ----
chk('{tier}/{n}/{max} template         ', tr('levelOf',{tier:'Easy',n:3,max:60}), 'Easy 3 / 60');
chk('placeholder order can differ (es) ', (function(){ setLang('es'); const s=tr('totalLine',{done:5,max:60,grand:10,cap:180}); setLang('en'); return s; })(),
    '5 de 60 puzzles  ·  ★ 10 / 180');

// ---- locale-aware date formatting (month name + day order changes) ----
setLang('en'); const dEn=dayLabel(dayNo());
setLang('es'); const dEs=dayLabel(dayNo());
setLang('fr'); const dFr=dayLabel(dayNo());
setLang('zh'); const dZh=dayLabel(dayNo());
setLang('en');
chk('en date: month before day         ', /^[A-Za-z]+ \d+$/.test(dEn), true);
chk('es date: day before month         ', /^\d+ [a-zé]+\.?$/.test(dEs), true);
chk('fr date: day before month         ', /^\d+ [a-zéû]+\.?$/.test(dFr), true);
chk('zh date: numeric month + 月/日     ', /^\d+月\d+日$/.test(dZh), true);

// ---- mid-puzzle: switching language must NOT reset progress ----
openTier('easy');
const tokBefore = JSON.stringify(tok), histBefore = hist.length;
sel = {i:0, s:Object.keys(GEO[tok[0].t].slots)[0]};   // fake a selection so state is non-trivial
setLang('es');
chk('board state untouched by a switch ', JSON.stringify(tok), tokBefore);
chk('history untouched by a switch     ', hist.length, histBefore);
chk('footer labels updated mid-puzzle  ', i18nText('undo'), 'Deshacer');
setLang('en');

// ---- the dropdown itself: clicking an option calls setLang and relabels the button ----
chk('langbtn starts on EN              ', dom.els.langbtn.textContent.indexOf('EN')>=0, true);
const fakeOption={getAttribute:k=>k==='data-lang'?'fr':null};
dom.els.langlist.dispatch('click', {target:fakeOption});
chk('picking FR from the dropdown      ', lang, 'fr');
chk('  relabels the button itself      ', dom.els.langbtn.textContent.indexOf('FR')>=0, true);
setLang('en');

// ---- browser-locale default: a fresh load with no saved pref honors navigator.language ----
const dom2=build(APP);
global.document=dom2.document;
global.window=dom2.window;
const store2={}; global.localStorage={getItem:k=>store2[k]||null,setItem:(k,v)=>{store2[k]=v}};
Object.defineProperty(global,'navigator',{configurable:true,value:{language:'fr-FR'}});
eval(SRC);
chk('fresh load honors navigator.language', lang, 'fr');

console.log(bad? bad+' I18N FAILURES' : 'I18N OK');

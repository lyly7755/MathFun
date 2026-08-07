/* Win celebration: staggered star pop-in, a confetti burst, and a
   synthesized chime (no shipped audio file - oscillators only, so the
   "single self-contained file" architecture stays intact). Covers the
   pieces in isolation, then confirms a real win via check()/check24()
   actually triggers all three together. */
const APP=require('path').join(__dirname,'..','index.html');
const fs=require('fs');
const {build}=require('./dom.js');
const html=fs.readFileSync(APP,'utf8');
const SRC=html.slice(html.indexOf('<script>')+8, html.indexOf('</script>'));

let bad=0;
const chk=(l,g,e)=>{const ok=(g===e);if(!ok)bad++;console.log((ok?'ok  ':'FAIL')+'  '+l+'  got '+JSON.stringify(g)+' expected '+JSON.stringify(e));};

function FakeAudioContext(){
  this.currentTime=0; this.destination={}; this.state='running'; this.oscCount=0;
}
FakeAudioContext.prototype.createOscillator=function(){
  this.oscCount++;
  return {type:'', frequency:{value:0}, connect:()=>{}, start:()=>{}, stop:()=>{}};
};
FakeAudioContext.prototype.createGain=function(){
  return {gain:{setValueAtTime:()=>{},linearRampToValueAtTime:()=>{},exponentialRampToValueAtTime:()=>{}}, connect:()=>{}};
};
FakeAudioContext.prototype.resume=function(){};

function freshDom(){
  const dom=build(APP);
  global.document=dom.document;
  global.window=dom.window;
  dom.window.AudioContext=FakeAudioContext;
  const store={}; global.localStorage={getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=v}};
  let T=20653*86400+3600; global.Date={now:()=>T*1000};
  global.setInterval=()=>1; global.clearInterval=()=>{};
  Object.defineProperty(global,'navigator',{configurable:true,value:{}});
  return {dom, store};
}

// ---- star pop-in: each star is its own element with a staggered delay ----
{
  const {dom}=freshDom();
  eval(SRC);
  const html3=starPopHTML(3);
  chk('3 stars: three starpop spans   ', (html3.match(/starpop/g)||[]).length, 3);
  chk('  all filled                   ', (html3.match(/★/g)||[]).length, 3);
  chk('  staggered delays present     ', html3.indexOf('0.00s')>=0 && html3.indexOf('0.14s')>=0 && html3.indexOf('0.28s')>=0, true);

  const html1=starPopHTML(1);
  chk('1 star: one filled, two empty  ', (html1.match(/★/g)||[]).length+','+(html1.match(/☆/g)||[]).length, '1,2');
}

// ---- confetti: fills the fixed overlay with randomized pieces ----
{
  const {dom}=freshDom();
  eval(SRC);
  chk('confetti host starts empty     ', dom.els.confetti.innerHTML, '');
  burstConfetti();
  chk('burst fills it with 16 pieces  ', (dom.els.confetti.innerHTML.match(/<span/g)||[]).length, 16);
}

// ---- sound: mute respected, note count scales with stars, no crash without AudioContext ----
{
  const {dom, store}=freshDom();
  eval(SRC);
  chk('sound on by default            ', soundMuted(), false);

  playWinChime(3);
  chk('3 stars: 4-note fanfare        ', audioCtx.oscCount, 4);

  setSoundMuted(true);
  chk('mute persisted                 ', store['ms_sound_muted'], '1');
  chk('  and readable back            ', soundMuted(), true);
  const before=audioCtx.oscCount;
  playWinChime(3);
  chk('muted: chime does not play     ', audioCtx.oscCount, before);

  setSoundMuted(false);
  playWinChime(1);
  chk('1 star: shorter 2-note chime   ', audioCtx.oscCount, before+2);
}
{
  // no AudioContext at all (older browser): must not throw
  const {dom}=freshDom();
  delete dom.window.AudioContext;
  eval(SRC);
  let threw=false;
  try{ playWinChime(3); }catch(err){ threw=true; }
  chk('no AudioContext: silent no-op  ', threw, false);
}

// ---- the sound button reflects and toggles the mute state ----
{
  const {dom}=freshDom();
  eval(SRC);
  chk('button starts unmuted          ', dom.els.soundbtn.textContent, '🔊');
  dom.els.soundbtn.onclick();
  chk('tapping it mutes               ', dom.els.soundbtn.textContent, '🔇');
  dom.els.soundbtn.onclick();
  chk('tapping again unmutes          ', dom.els.soundbtn.textContent, '🔊');
}

// ---- end-to-end: an actual win fires all three together ----
{
  const {dom}=freshDom();
  eval(SRC);
  openTier('easy');
  tok=encode(lev().s[0]); for(let k=0;k<lev().m;k++) hist.push([]); check();
  chk('puzzle solved                  ', solved, true);
  chk('win banner uses animated stars ', dom.els.msg.innerHTML.indexOf('starpop')>=0, true);
  chk('confetti fired                 ', (dom.els.confetti.innerHTML.match(/<span/g)||[]).length, 16);
  chk('chime fired (oscillators > 0)  ', audioCtx.oscCount>0, true);
}
{
  const {dom}=freshDom();
  eval(SRC);
  openDaily24();
  while(!g24.solved){
    const live=live24(); if(live.length<2) break;
    const s=solve24(live.map(i=>g24.cards[i].val)); if(!s||s.done) break;
    pick24(live[s.i]); chooseOp(s.op); pick24(live[s.j]);
  }
  chk('24 game solved                 ', g24.solved, true);
  chk('win banner uses animated stars ', dom.els.msg24.innerHTML.indexOf('starpop')>=0, true);
  chk('confetti fired                 ', (dom.els.confetti.innerHTML.match(/<span/g)||[]).length, 16);
  chk('chime fired (oscillators > 0)  ', audioCtx.oscCount>0, true);
}

console.log(bad? bad+' CELEBRATE FAILURES' : 'CELEBRATE OK');

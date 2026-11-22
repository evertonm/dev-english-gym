// @ts-nocheck
// Dev English Gym engine: plain DOM app mounted by src/App.tsx.
// Talks to the backend only through the `deps` object, so it stays framework-agnostic.
import { UNITS, SCEN, LESSONS } from './data'

export type GymProgress = { xp: number; streak: number; last: string; units: Record<string, number>; lessons: Record<string, number> }
export type AiResult = { ok: true; text: string } | { ok: false; code: string }
export type GymDeps = {
  initial: () => Partial<GymProgress> | null
  save: (p: GymProgress) => void
  isAuthed: () => boolean
  login: () => void
  account: () => void
  accountLabel: () => string
  chat: (scenario: string, history: { role: 'user' | 'assistant'; content: string }[]) => Promise<AiResult>
  correct: (lessonId: string, text: string) => Promise<AiResult>
  addMistake: (wrong: string, better: string, tip: string) => void
  dueMistakes: () => { id: string; wrong: string; better: string; tip: string }[]
  reviewMistake: (id: string, ok: boolean) => void
}
export type GymHandle = { destroy: () => void; setState: (p: Partial<GymProgress>) => void; refresh: () => void }

// Bolha: the mascot, a speech bubble wearing a headset.
export const MASCOT = '<svg class="mascot" viewBox="0 0 120 120" aria-hidden="true"><path d="M14 46a46 40 0 0 1 92 0" fill="none" stroke="#2B1B5A" stroke-width="6" stroke-linecap="round"/><path d="M24 30h72a16 16 0 0 1 16 16v34a16 16 0 0 1-16 16H58l-20 16V96H24A16 16 0 0 1 8 80V46a16 16 0 0 1 16-16z" fill="#FFC93C" stroke="#2B1B5A" stroke-width="5" stroke-linejoin="round"/><rect x="4" y="46" width="14" height="26" rx="7" fill="#7B4DFF" stroke="#2B1B5A" stroke-width="4"/><rect x="102" y="46" width="14" height="26" rx="7" fill="#7B4DFF" stroke="#2B1B5A" stroke-width="4"/><circle cx="45" cy="58" r="7" fill="#2B1B5A"/><circle cx="75" cy="58" r="7" fill="#2B1B5A"/><circle cx="47.5" cy="55.5" r="2.4" fill="#fff"/><circle cx="77.5" cy="55.5" r="2.4" fill="#fff"/><circle cx="34" cy="71" r="5" fill="#FF8FA3" opacity=".8"/><circle cx="86" cy="71" r="5" fill="#FF8FA3" opacity=".8"/><path d="M50 72q10 10 20 0" fill="none" stroke="#2B1B5A" stroke-width="5" stroke-linecap="round"/></svg>';

const MARKUP = `<div class="app">
  <header class="top">
    <div class="brand">${MASCOT}Dev English</div>
    <div class="stats">
      <div class="stat fire" title="Dias seguidos"><b id="streak">0</b>dias</div>
      <div class="stat" title="Pontos"><b id="xp">0</b>xp</div>
      <button class="acct" id="acct">Entrar</button>
    </div>
  </header>

  <main id="v-learn"></main>
  <main id="v-home" class="hidden"></main>

  <main id="v-chat" class="hidden">
    <div class="scen" id="scen"></div>
    <div id="log"></div>
  </main>
  <div class="composer hidden" id="composer">
    <button class="ico hidden" id="mic" aria-label="Falar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg></button>
    <input id="say" type="text" autocomplete="off" autocapitalize="sentences" placeholder="Type in English…" aria-label="Sua resposta em inglês">
    <button class="ico send" id="send" aria-label="Enviar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>
  </div>

  <main id="v-book" class="hidden"></main>

  <nav class="tabs" role="tablist">
    <button role="tab" data-tab="learn" aria-selected="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-5 9 5-9 5zM7 12v5c3 2 7 2 10 0v-5"/></svg>Aulas</button>
    <button role="tab" data-tab="home" aria-selected="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4v16M18 4v16M3 8v8M21 8v8M6 12h12"/></svg>Treino</button>
    <button role="tab" data-tab="chat" aria-selected="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4z"/></svg>Conversa</button>
    <button role="tab" data-tab="book" aria-selected="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h14v16H5zM9 9h6M9 13h6"/></svg>Frases</button>
  </nav>
</div>

<div id="sess" class="hidden" role="dialog" aria-label="Treino">
  <div class="wrap">
    <div class="sbar"><button class="x" id="quit" aria-label="Sair do treino">×</button><div class="prog"><i id="bar" style="width:0"></i></div></div>
    <div class="sbody" id="sbody"></div>
    <div class="fb" id="fb"></div>
  </div>
</div>
`

export function mountGym(root: HTMLElement, deps: GymDeps): GymHandle {
root.innerHTML = MARKUP
const SPK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9zM17 9a4 4 0 0 1 0 6"/></svg>';
const $=s=>root.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const clean=w=>w.replace(/[.,?!]/g,'');
const norm=s=>s.toLowerCase().replace(/[^a-z0-9' ]/g,'').split(/\s+/).filter(Boolean);

/* ---------- saved progress ---------- */
let S=Object.assign({xp:0,streak:0,last:'',units:{},lessons:{}},deps.initial()||{});
const save=()=>{try{deps.save(S)}catch(e){}};
const dayStr=d=>d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
const today=()=>dayStr(new Date());
const yesterday=()=>{const d=new Date();d.setDate(d.getDate()-1);return dayStr(d)};
const bumpDay=()=>{if(S.last!==today()){S.streak=S.last===yesterday()?S.streak+1:1;S.last=today()}};
const liveStreak=()=>(S.last===today()||S.last===yesterday())?S.streak:0;

/* ---------- voice: browser speech synthesis + recognition (free, no server) ---------- */
let voiceMode=false;
let sess=null,les=null,rev=null;
let chat={scen:null,msgs:[],items:[],busy:false,err:''};
const chatSink=text=>{const i=$('#say');i.value=(i.value+' '+text).trim();if(voiceMode&&!les&&!sess&&!rev)sendMsg()};
let dictSink=chatSink;
let listening=false;
function makeDict(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR)return null;
  let rec=null,fin=null,st=null;
  return{onFinal(f){fin=f},onState(f){st=f},
    start(){return new Promise((res,rej)=>{try{rec=new SR();rec.lang='en-US';rec.interimResults=false;rec.continuous=false;
      rec.onresult=e=>{for(let i=e.resultIndex;i<e.results.length;i++){const r=e.results[i];if(r.isFinal&&fin)fin({text:r[0].transcript})}};
      rec.onend=()=>{if(st)st({state:'idle'})};rec.onerror=()=>{if(st)st({state:'idle'})};
      rec.start();if(st)st({state:'listening'});res()}catch(e){rej(e)}})},
    stop(){try{if(rec)rec.stop()}catch(e){}return Promise.resolve()}}
}
let dict=makeDict();
const browserVoice=()=>{try{return 'speechSynthesis' in window&&typeof SpeechSynthesisUtterance!=='undefined'}catch(e){return false}};
const canSpeak=()=>browserVoice();
let enVoice=null;
const pickVoice=()=>{try{const vs=speechSynthesis.getVoices();enVoice=vs.find(v=>/en[-_]US/i.test(v.lang)&&/Google|Samantha|Natural/i.test(v.name))||vs.find(v=>/en[-_]US/i.test(v.lang))||null}catch(e){}};
try{if(browserVoice()){pickVoice();speechSynthesis.onvoiceschanged=pickVoice}}catch(e){}
function speak(text,slow,done){
  try{if(browserVoice()){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='en-US';if(enVoice)u.voice=enVoice;u.rate=slow?0.6:0.92;if(done){u.onend=done;u.onerror=done}speechSynthesis.speak(u);return}}catch(e){}
  if(done)done();
}
const sameText=(a,b)=>norm(a).join(' ')===norm(b).join(' ');
function listenForReply(){
  if(!voiceMode||!dict||listening||!chat.scen||chat.busy||les||sess||rev)return;
  if($('#v-chat').classList.contains('hidden'))return;
  dict.start().catch(()=>{});
}
if(dict){try{
  dict.onFinal(({text})=>dictSink(text));
  dict.onState(({state})=>{listening=state==='listening';$('#mic').classList.toggle('rec',listening);if(les)speakState();else if(voiceMode&&!sess&&!rev)renderChat()});
  $('#mic').classList.remove('hidden');
}catch(e){dict=null}}
const aiErr=c=>c==='LIMIT'?'Você usou o limite diário de mensagens com a IA. Volte amanhã!':c==='UNAUTHENTICATED'?'Entre na sua conta para usar a IA.':'Não consegui responder agora. Tente de novo.';

/* ---------- home + phrasebook ---------- */
const starsHtml=n=>'<span class="stars" aria-label="'+n+' de 3 estrelas">'+[1,2,3].map(i=>i<=n?'<i>★</i>':'★').join('')+'</span>';
function reviewHtml(){
  if(!deps.isAuthed())return '';
  const n=deps.dueMistakes().length;
  if(!n)return '<p class="note">Os erros que a IA corrigir nas conversas e nos textos aparecem aqui para você revisar.</p>';
  return '<section class="review"><span><b>Revisar meus erros</b><span class="s">'+n+(n===1?' frase para revisar hoje':' frases para revisar hoje')+'</span></span><button class="btn" data-review="1">Revisar</button></section>';
}
function renderHome(){
  $('#xp').textContent=S.xp;$('#streak').textContent=liveStreak();
  let nx=UNITS.findIndex(u=>!S.units[u.id]);const all=nx<0;if(all)nx=UNITS.findIndex(u=>S.units[u.id]<3);if(nx<0)nx=0;
  const u=UNITS[nx];
  $('#v-home').innerHTML=reviewHtml()+
   '<section class="today">'+MASCOT+'<small>'+(all?'Revisão, 5 minutos':'Treino de hoje, 5 minutos')+'</small><h1>'+esc(u.t)+'</h1><p>'+esc(u.s)+'. 10 exercícios, quase tudo no toque.</p><button class="go" data-start="'+nx+'">Começar</button></section>'+
   '<h2 class="sec">Todos os treinos</h2><div class="units">'+UNITS.map((x,i)=>
     '<button class="unit" data-start="'+i+'"><span class="n">'+(i+1)+'</span><span><span class="t">'+esc(x.t)+'</span><span class="s">'+esc(x.s)+'</span></span>'+starsHtml(S.units[x.id]||0)+'</button>').join('')+'</div>';
}
function renderBook(){
  $('#v-book').innerHTML='<p class="note">Toque na frase para ouvir.</p>'+UNITS.map((u,ui)=>
   '<details class="pb"'+(ui===0?' open':'')+'><summary>'+esc(u.t)+'</summary>'+u.p.map((p,pi)=>
     '<button class="phrase" data-say="'+ui+'.'+pi+'"><span><span class="en">'+esc(p[0])+'</span><span class="pt">'+esc(p[1])+'</span></span><span class="ico">'+SPK+'</span></button>').join('')+'</details>').join('');
}

/* ---------- training session ---------- */
function startSession(ui){
  const order=shuffle([0,1,2,3,4,5,6,7]),types=['listen','gap','build','reverse'];
  const q=order.map((pi,i)=>({pi,type:types[i%4]}));
  q.push({pi:order[0],type:'build'},{pi:order[1],type:'listen'});
  sess={ui,queue:q,pos:0,right:0,total:q.length};
  $('#sess').classList.remove('hidden');renderEx();
}
function renderEx(){
  const q=sess.queue[sess.pos],u=UNITS[sess.ui],[en,pt,gap]=u.p[q.pi];
  sess.cur={en,pt};sess.done=false;sess.picked=[];
  $('#bar').style.width=(sess.pos/sess.queue.length*100)+'%';
  const others=shuffle(u.p.filter((_,i)=>i!==q.pi));
  let h='';
  if(q.type==='listen'){
    const voice=canSpeak();
    sess.opts=shuffle([pt,others[0][1],others[1][1]]);sess.answer=sess.opts.indexOf(pt);
    h='<p class="ask">'+(voice?'Escute. O que significa?':'O que significa?')+'</p>'+
      (voice?'<div class="listen"><button class="play" data-act="say" aria-label="Ouvir">'+SPK+'</button><button class="pill" data-act="slow">Mais devagar</button></div><button class="link" data-act="reveal">Mostrar o texto</button>':'')+
      '<div class="card'+(voice?' hidden':'')+'" id="rev"><span class="en">'+esc(en)+'</span></div>'+
      '<div class="opts">'+sess.opts.map((o,i)=>'<button class="opt" data-opt="'+i+'">'+esc(o)+'</button>').join('')+'</div>';
    if(voice)speak(en);
  }else if(q.type==='reverse'){
    sess.opts=shuffle([en,others[0][0],others[1][0]]);sess.answer=sess.opts.indexOf(en);
    h='<p class="ask">Como se diz em inglês?</p><div class="card">'+esc(pt)+'</div>'+
      '<div class="opts">'+sess.opts.map((o,i)=>'<button class="opt en" data-opt="'+i+'">'+esc(o)+'</button>').join('')+'</div>';
  }else if(q.type==='gap'){
    const g=clean(gap);
    sess.opts=shuffle([g,...others.slice(0,3).map(o=>clean(o[2]))]);sess.answer=sess.opts.indexOf(g);
    const parts=en.split(' ').map(w=>clean(w)===g?'<span class="gap" id="gapslot">&nbsp;</span>'+esc(w.replace(g,'')):esc(w)).join(' ');
    h='<p class="ask">Complete a frase</p><div class="card"><span class="en">'+parts+'</span><span class="pt">'+esc(pt)+'</span></div>'+
      '<div class="opts grid">'+sess.opts.map((o,i)=>'<button class="opt" data-opt="'+i+'">'+esc(o)+'</button>').join('')+'</div>';
  }else{
    sess.tokens=en.replace(/[.?!]$/,'').split(' ');
    sess.pool=shuffle(sess.tokens.map((w,i)=>({w,i})));
    h='<p class="ask">Monte em inglês</p><div class="card">'+esc(pt)+'</div><div class="slot" id="slot"></div><div class="pool" id="pool"></div>';
  }
  $('#sbody').innerHTML=h;$('#sbody').scrollTop=0;
  const fb=$('#fb');fb.className='fb';
  fb.innerHTML=q.type==='build'?'<button class="btn" id="check" disabled>Verificar</button>':'';
  if(q.type!=='build')fb.classList.add('hidden');else drawBuild();
}
function drawBuild(){
  $('#slot').innerHTML=sess.picked.map((k,n)=>'<button class="chip" data-un="'+n+'">'+esc(sess.pool[k].w)+'</button>').join('');
  $('#pool').innerHTML=sess.pool.map((t,k)=>'<button class="chip'+(sess.picked.includes(k)?' used':'')+'" data-pick="'+k+'">'+esc(t.w)+'</button>').join('');
  const c=$('#check');if(c)c.disabled=sess.picked.length!==sess.pool.length;
}
function grade(ok){
  const q=sess.queue[sess.pos];sess.done=true;
  if(ok&&!q.retry)sess.right++;
  if(!ok&&!q.retry)sess.queue.push({pi:q.pi,type:q.type,retry:true});
  const fb=$('#fb');fb.className='fb '+(ok?'ok':'no');
  fb.innerHTML='<div class="v">'+(ok?'Isso aí!':'Quase. O certo é:')+'</div><div class="row"><span><span class="en">'+esc(sess.cur.en)+'</span><span class="pt">'+esc(sess.cur.pt)+'</span></span>'+(canSpeak()?'<button class="ico" data-act="say" aria-label="Ouvir">'+SPK+'</button>':'')+'</div><button class="btn" id="next">Continuar</button>';
  speak(sess.cur.en);
}
function finish(){
  const acc=sess.right/sess.total,st=acc>=.9?3:acc>=.7?2:1,gain=sess.right*10,u=UNITS[sess.ui];
  S.xp+=gain;S.units[u.id]=Math.max(S.units[u.id]||0,st);
  bumpDay();save();
  $('#bar').style.width='100%';
  $('#sbody').innerHTML='<div class="end">'+MASCOT+'<div class="stars">'+[1,2,3].map(i=>i<=st?'<i>★</i>':'★').join('')+'</div><p class="big">'+esc(u.t)+' feito!</p><div class="kv"><div><b>'+sess.right+'/'+sess.total+'</b>de primeira</div><div><b>+'+gain+'</b>xp</div></div><p class="note">Agora use essas frases numa conversa de verdade com a IA.</p></div>';
  const fb=$('#fb');fb.className='fb';
  fb.innerHTML='<button class="btn" id="tochat">Praticar conversa</button><button class="btn alt" id="back">Voltar pra trilha</button>';
  sess.over=true;
}

/* ---------- review of saved mistakes ---------- */
function startReview(){
  const list=deps.dueMistakes().slice(0,10);if(!list.length)return;
  rev={list,pos:0,right:0};$('#sess').classList.remove('hidden');renderRev();
}
function renderRev(){
  const it=rev.list[rev.pos];rev.done=false;rev.picked=[];
  $('#bar').style.width=(rev.pos/rev.list.length*100)+'%';
  rev.tokens=it.better.replace(/[.?!]$/,'').split(/\s+/);
  rev.build=rev.tokens.length<=14;
  let h='<p class="ask">'+(rev.build?'Monte a frase do jeito certo':'Como fica do jeito certo?')+'</p><div class="card"><span class="pt">Você escreveu</span><span class="en">'+esc(it.wrong)+'</span></div>';
  if(it.tip)h+='<p class="note">Dica: '+esc(it.tip)+'</p>';
  const fb=$('#fb');fb.className='fb';
  if(rev.build){
    rev.pool=shuffle(rev.tokens.map((w,i)=>({w,i})));
    h+='<div class="slot" id="slot"></div><div class="pool" id="pool"></div>';
    fb.innerHTML='<button class="btn" id="rcheck" disabled>Verificar</button>';
  }else{
    h+='<p class="note">Pense na frase certa em voz alta e depois confira.</p>';
    fb.innerHTML='<button class="btn" id="rshow">Mostrar a forma certa</button>';
  }
  $('#sbody').innerHTML=h;$('#sbody').scrollTop=0;
  if(rev.build)drawRevBuild();
}
function drawRevBuild(){
  $('#slot').innerHTML=rev.picked.map((k,n)=>'<button class="chip" data-un="'+n+'">'+esc(rev.pool[k].w)+'</button>').join('');
  $('#pool').innerHTML=rev.pool.map((t,k)=>'<button class="chip'+(rev.picked.includes(k)?' used':'')+'" data-pick="'+k+'">'+esc(t.w)+'</button>').join('');
  const c=$('#rcheck');if(c)c.disabled=rev.picked.length!==rev.pool.length;
}
function gradeRev(ok){
  const it=rev.list[rev.pos];rev.done=true;if(ok)rev.right++;
  deps.reviewMistake(it.id,ok);
  const fb=$('#fb');fb.className='fb '+(ok?'ok':'no');
  fb.innerHTML='<div class="v">'+(ok?'Isso aí!':'Quase. O certo é:')+'</div><div class="row"><span class="en">'+esc(it.better)+'</span>'+(canSpeak()?'<button class="ico" data-act="say" aria-label="Ouvir">'+SPK+'</button>':'')+'</div><button class="btn" id="rnext">Continuar</button>';
  speak(it.better);
}
function finishRev(){
  const gain=rev.right*5+(rev.list.length-rev.right)*2;S.xp+=gain;bumpDay();save();rev.over=true;
  $('#bar').style.width='100%';
  $('#sbody').innerHTML='<div class="end">'+MASCOT+'<p class="big">Revisão feita!</p><div class="kv"><div><b>'+rev.right+'/'+rev.list.length+'</b>certas</div><div><b>+'+gain+'</b>xp</div></div><p class="note">As que você acertou voltam daqui a alguns dias. As que errou voltam amanhã.</p></div>';
  const fb=$('#fb');fb.className='fb';fb.innerHTML='<button class="btn" id="back">Voltar</button>';
}
function revClick(b){
  if(b.id==='quit'||b.id==='back'){closeSession();return}
  const it=rev.list[rev.pos];
  if(b.dataset.act==='say'){speak(it.better);return}
  if(b.id==='rnext'){rev.pos++;if(rev.pos>=rev.list.length)finishRev();else renderRev();return}
  if(rev.over||rev.done)return;
  if(b.dataset.pick!==undefined){const k=+b.dataset.pick;if(!rev.picked.includes(k)){rev.picked.push(k);drawRevBuild()}return}
  if(b.dataset.un!==undefined){rev.picked.splice(+b.dataset.un,1);drawRevBuild();return}
  if(b.id==='rcheck'){gradeRev(rev.picked.map(k=>rev.pool[k].w).join(' ')===rev.tokens.join(' '));return}
  if(b.id==='rshow'){
    $('#sbody').insertAdjacentHTML('beforeend','<div class="card"><span class="pt">Forma certa</span><span class="en">'+esc(it.better)+'</span></div>');speak(it.better);
    $('#fb').innerHTML='<div class="row2"><button class="btn alt" id="rno">Errei</button><button class="btn" id="ryes">Acertei</button></div>';return;
  }
  if(b.id==='ryes'||b.id==='rno'){gradeRev(b.id==='ryes');return}
}

function closeSession(){$('#sess').classList.add('hidden');sess=null;les=null;rev=null;dictSink=chatSink;if(listening&&dict){try{dict.stop().catch(()=>{})}catch(e){}}try{if(browserVoice())speechSynthesis.cancel()}catch(e){}renderHome();renderLearn()}

$('#sess').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;if(b.dataset.login){deps.login();return}if(rev){revClick(b);return}if(les){lessonClick(b);return}if(!sess)return;
  if(b.id==='quit'||b.id==='back'){closeSession();return}
  if(b.id==='tochat'){closeSession();showTab('chat');return}
  if(b.dataset.act==='say'){speak(sess.cur.en);return}
  if(b.dataset.act==='slow'){speak(sess.cur.en,true);return}
  if(b.dataset.act==='reveal'){$('#rev').classList.remove('hidden');b.classList.add('hidden');return}
  if(b.id==='next'){sess.pos++;if(sess.pos>=sess.queue.length)finish();else renderEx();return}
  if(sess.done||sess.over)return;
  if(b.dataset.opt!==undefined){
    const i=+b.dataset.opt,ok=i===sess.answer;
    root.querySelectorAll('#sbody .opt').forEach((o,k)=>{if(k===sess.answer)o.classList.add('ok');else if(k===i)o.classList.add('no')});
    const g=$('#gapslot');if(g)g.textContent=sess.opts[sess.answer];
    const r=$('#rev');if(r)r.classList.remove('hidden');
    grade(ok);return;
  }
  if(b.dataset.pick!==undefined){const k=+b.dataset.pick;if(!sess.picked.includes(k)){sess.picked.push(k);drawBuild()}return}
  if(b.dataset.un!==undefined){sess.picked.splice(+b.dataset.un,1);drawBuild();return}
  if(b.id==='check'){grade(sess.picked.map(k=>sess.pool[k].w).join(' ')===sess.tokens.join(' '))}
});

/* ---------- lessons: teach, quiz, write, speak ---------- */
const sayable=t=>t.split(' = ')[0].replace('→',',');
function renderLearn(){
  $('#xp').textContent=S.xp;$('#streak').textContent=liveStreak();
  let nx=LESSONS.findIndex(l=>!S.lessons[l.id]);const all=nx<0;if(all)nx=0;
  const L=LESSONS[nx];
  $('#v-learn').innerHTML=
   '<section class="today">'+MASCOT+'<small>'+(all?'Revisar, 6 minutos':'Próxima aula, 6 minutos')+'</small><h1>'+esc(L.t)+'</h1><p>'+esc(L.s)+'. Explicação curta, exercícios, depois você escreve e fala.</p><button class="go" data-lesson="'+nx+'">Começar aula</button></section>'+
   '<h2 class="sec">Todas as aulas</h2><div class="units">'+LESSONS.map((x,i)=>
     '<button class="unit" data-lesson="'+i+'"><span class="n">'+(i+1)+'</span><span><span class="t">'+esc(x.t)+'</span><span class="s">'+esc(x.s)+'</span></span>'+starsHtml(S.lessons[x.id]||0)+'</button>').join('')+'</div>';
}
function startLesson(li){
  const L=LESSONS[li];
  const steps=[...L.c.map(c=>({k:'card',c})),...L.q.map(q=>({k:'quiz',q})),...(L.w?[{k:'write'}]:[]),...L.sp.map(t=>({k:'speak',t}))];
  les={li,L,steps,pos:0,right:0,wrote:false,spoke:0,busy:false,say:'',heard:''};
  $('#sess').classList.remove('hidden');renderStep();
}
const listenRow=()=>canSpeak()?'<div class="listen"><button class="play" data-act="say" aria-label="Ouvir">'+SPK+'</button><button class="pill" data-act="slow">Mais devagar</button></div>':'';
function renderStep(){
  const st=les.steps[les.pos],L=les.L;les.done=false;les.busy=false;les.heard='';les.say='';dictSink=chatSink;
  $('#bar').style.width=(les.pos/les.steps.length*100)+'%';
  const fb=$('#fb');fb.className='fb';let h='';
  if(st.k==='card'){
    h='<p class="ask">'+esc(st.c.h)+'</p><p class="rule">'+esc(st.c.pt)+'</p><div class="exs">'+st.c.ex.map((e,i)=>
      '<button class="phrase ex" data-ex="'+i+'"><span><span class="en">'+esc(e[0])+'</span><span class="pt">'+esc(e[1])+'</span></span>'+(canSpeak()?'<span class="ico">'+SPK+'</span>':'')+'</button>').join('')+'</div>'+
      (canSpeak()?'<p class="note">Toque num exemplo para ouvir.</p>':'');
    fb.innerHTML='<button class="btn" id="lnext">Entendi</button>';
  }else if(st.k==='quiz'){
    const [q,o]=st.q,gap=q.includes('___');
    les.opts=shuffle(o);les.answer=les.opts.indexOf(o[0]);
    h=gap?'<p class="ask">Complete a frase</p><div class="card"><span class="en">'+esc(q).replace('___','<span class="gap" id="gapslot">&nbsp;</span>')+'</span></div>':'<p class="ask">'+esc(q)+'</p>';
    h+='<div class="opts">'+les.opts.map((x,i)=>'<button class="opt en" data-opt="'+i+'">'+esc(x)+'</button>').join('')+'</div>';
    fb.classList.add('hidden');
  }else if(st.k==='write'){
    h='<p class="ask">Agora escreva em inglês</p><div class="card">'+esc(L.w[0])+'</div><textarea id="wr" rows="4" placeholder="Type here…" aria-label="Sua resposta em inglês"></textarea><div id="wres"></div>';
    fb.innerHTML='<button class="btn" id="wcheck">Corrigir</button><button class="btn alt" id="wskip">Ver um exemplo</button>';
  }else{
    les.say=st.t;
    h='<p class="ask">Fale em voz alta</p><div class="card"><span class="en">'+esc(st.t)+'</span></div>'+listenRow()+
      (dict?'<button class="pill" id="rec">Gravar minha fala</button><div id="heard" class="note"></div>':'<p class="note">Ouça e repita 2 vezes em voz alta, imitando o ritmo.</p>');
    fb.innerHTML='<button class="btn" id="spoke">Falei</button>';
    if(dict)dictSink=t=>{if(!les)return;les.heard=(les.heard+' '+t).trim();showHeard()};
    speak(st.t);
  }
  $('#sbody').innerHTML=h;$('#sbody').scrollTop=0;
}
function showHeard(){
  const st=les.steps[les.pos],el=$('#heard');if(st.k!=='speak'||!el||!les.heard)return;
  const want=norm(st.t),got=norm(les.heard),hit=want.filter(w=>got.includes(w)).length,pc=Math.round(hit/want.length*100);
  el.innerHTML='O microfone entendeu: <span class="en">'+esc(les.heard)+'</span><br>'+pc+'% igual à frase.'+(pc<70?' Ouça de novo e tente outra vez.':' Boa.');
}
function speakState(){const r=$('#rec');if(r)r.textContent=listening?'Parar':(les.heard?'Gravar de novo':'Gravar minha fala');if(!listening)showHeard()}
function gradeQuiz(i){
  const st=les.steps[les.pos],[q,o,sayIt]=st.q,ok=i===les.answer,gap=q.includes('___');les.done=true;
  if(ok)les.right++;
  root.querySelectorAll('#sbody .opt').forEach((x,k)=>{if(k===les.answer)x.classList.add('ok');else if(k===i)x.classList.add('no')});
  const g=$('#gapslot');if(g)g.textContent=o[0];
  const full=gap?q.replace('___',o[0]):o[0];
  les.say=sayIt||(gap||/[.?!]$/.test(o[0])?full.replace(/\s*\(.*?\)/,''):'');
  const fb=$('#fb');fb.className='fb '+(ok?'ok':'no');
  fb.innerHTML='<div class="v">'+(ok?'Isso aí!':'Quase. O certo é:')+'</div><div class="row"><span class="en">'+esc(full)+'</span>'+(les.say&&canSpeak()?'<button class="ico" data-act="say" aria-label="Ouvir">'+SPK+'</button>':'')+'</div><button class="btn" id="lnext">Continuar</button>';
  if(les.say)speak(les.say);
}
function showWriting(better,tip){
  $('#wres').innerHTML=(better?'<div class="fix wide"><small>Mais natural</small><span class="en">'+esc(better)+'</span>'+(tip?'<span>'+esc(tip)+'</span>':'')+'</div>':(tip?'<p class="note">'+esc(tip)+'</p>':''))+
    '<div class="card"><span class="pt">Exemplo de resposta</span><span class="en">'+esc(les.L.w[1])+'</span></div>';
  $('#fb').innerHTML='<button class="btn" id="lnext">Continuar</button>';
  const b=$('#sbody');b.scrollTop=b.scrollHeight;
}
async function checkWriting(){
  const cur=les,pos=les.pos,t=$('#wr').value.trim();if(!t||les.busy)return;
  les.wrote=true;
  if(!deps.isAuthed()){showWriting('','');$('#wres').insertAdjacentHTML('afterbegin','<div class="banner"><span>Entre para a IA corrigir seu texto.</span><button data-login="1">Entrar</button></div>');return}
  les.busy=true;const btn=$('#wcheck');btn.disabled=true;btn.textContent='Corrigindo…';
  let o=null,err='';
  try{
    const r=await deps.correct(cur.L.id,t);
    if(r&&r.ok){const x=r.text||'',a=x.indexOf('{'),b=x.lastIndexOf('}');if(a>=0&&b>a)o=JSON.parse(x.slice(a,b+1))}else err=aiErr(r&&r.code);
  }catch(e){err=aiErr('')}
  if(o&&typeof o.better==='string'&&o.better&&!sameText(o.better,t)){try{deps.addMistake(t,o.better,typeof o.tip==='string'?o.tip:'')}catch(e){}}
  if(les!==cur||les.pos!==pos)return;
  les.busy=false;showWriting(o&&typeof o.better==='string'?o.better:'',o&&typeof o.tip==='string'?o.tip:(err||''));
}
function finishLesson(){
  const L=les.L,st=les.right>=L.q.length?3:les.right>=L.q.length*.6?2:1,gain=les.right*10+(les.wrote?20:0)+les.spoke*5;
  S.xp+=gain;S.lessons[L.id]=Math.max(S.lessons[L.id]||0,st);bumpDay();save();
  dictSink=chatSink;les.over=true;
  $('#bar').style.width='100%';
  $('#sbody').innerHTML='<div class="end">'+MASCOT+'<div class="stars">'+[1,2,3].map(i=>i<=st?'<i>★</i>':'★').join('')+'</div><p class="big">Aula feita: '+esc(L.t)+'!</p><div class="kv"><div><b>'+les.right+'/'+L.q.length+'</b>exercícios certos</div><div><b>+'+gain+'</b>xp</div></div></div>';
  const fb=$('#fb');fb.className='fb';
  fb.innerHTML=(les.li<LESSONS.length-1?'<button class="btn" id="nextlesson">Próxima aula</button>':'<button class="btn" id="tochat">Praticar conversa</button>')+'<button class="btn alt" id="back">Voltar</button>';
}
function lessonClick(b){
  if(b.id==='quit'||b.id==='back'){closeSession();return}
  if(b.id==='tochat'){closeSession();showTab('chat');return}
  if(b.id==='nextlesson'){const n=les.li+1;startLesson(n);return}
  if(les.over)return;
  const st=les.steps[les.pos];
  if(b.dataset.act==='say'){if(les.say)speak(les.say);return}
  if(b.dataset.act==='slow'){if(les.say)speak(les.say,true);return}
  if(b.dataset.ex!==undefined&&st.k==='card'){speak(sayable(st.c.ex[+b.dataset.ex][0]));return}
  if(b.id==='rec'&&dict){
    if(listening){dict.stop().catch(()=>{});return}
    les.heard='';const h=$('#heard');if(h)h.textContent='';
    dict.start().catch(()=>{dict=null;b.classList.add('hidden')});return;
  }
  if(b.id==='spoke'){les.spoke++;if(listening&&dict){try{dict.stop().catch(()=>{})}catch(e){}}}
  if(b.id==='lnext'||b.id==='spoke'){les.pos++;if(les.pos>=les.steps.length)finishLesson();else renderStep();return}
  if(b.id==='wcheck'){checkWriting();return}
  if(b.id==='wskip'){if(!les.busy)showWriting('','');return}
  if(b.dataset.opt!==undefined&&st.k==='quiz'&&!les.done)gradeQuiz(+b.dataset.opt);
}

/* ---------- AI conversation ---------- */
function parseAI(t){
  try{const a=t.indexOf('{'),b=t.lastIndexOf('}');if(a>=0&&b>a){const o=JSON.parse(t.slice(a,b+1));if(o&&typeof o.reply==='string')return o}}catch(e){}
  return {reply:t.trim(),pt:'',better:'',tip:'',hint:''};
}
async function turn(){
  chat.busy=true;chat.err='';renderChat();
  let r=null;
  try{r=await deps.chat(chat.scen,chat.msgs)}catch(e){r={ok:false,code:'ERROR'}}
  if(r&&r.ok){
    const o=parseAI(r.text||'');
    chat.msgs.push({role:'assistant',content:(r.text||o.reply).slice(0,3000)});
    const last=chat.items[chat.items.length-1];
    if(last&&last.who==='me'){
      last.better=o.better||'';last.tip=o.tip||'';
      if(typeof o.better==='string'&&o.better&&!sameText(o.better,last.text)){try{deps.addMistake(last.text,o.better,typeof o.tip==='string'?o.tip:'')}catch(e){}}
    }
    chat.items.push({who:'ai',reply:o.reply,pt:o.pt||'',hint:o.hint||''});
    if(voiceMode&&o.reply){chat.busy=false;renderChat();speak(o.reply,false,()=>setTimeout(listenForReply,250));return}
  }else{
    chat.err=aiErr(r&&r.code);
    if(chat.msgs.length&&chat.msgs[chat.msgs.length-1].role==='user'&&chat.items.length){const it=chat.items.pop();chat.msgs.pop();if(it.who==='me')$('#say').value=it.text}
    if(!chat.items.length){chat.scen=null;chat.msgs=[]}
  }
  chat.busy=false;renderChat();
}
function startScen(id){
  if(!deps.isAuthed()){deps.login();return}
  if(chat.busy)return;
  chat={scen:id,msgs:[],items:[],busy:false,err:''};turn();
}
function sendMsg(){
  const i=$('#say'),t=i.value.trim();if(!t||chat.busy||!chat.scen||!deps.isAuthed())return;
  if(chat.msgs.length>=40){chat.err='Conversa longa demais. Escolha uma situação para recomeçar.';renderChat();return}
  if(listening&&dict){try{dict.stop().catch(()=>{})}catch(e){}}
  i.value='';chat.items.push({who:'me',text:t.slice(0,600)});chat.msgs.push({role:'user',content:t.slice(0,600)});turn();
}
function renderChat(){
  const on=!$('#v-chat').classList.contains('hidden');
  $('#scen').innerHTML=(deps.isAuthed()?'<button class="pill vm" data-voice="1" aria-pressed="'+voiceMode+'">'+(voiceMode?'Voz ligada':'Modo voz')+'</button>':'')+SCEN.map(s=>'<button class="pill" data-scen="'+s.id+'" aria-pressed="'+(chat.scen===s.id)+'">'+esc(s.t)+'</button>').join('');
  let h='';
  if(!deps.isAuthed())h='<div class="empty">'+MASCOT+'<p>Converse em inglês com a IA em situações reais: recrutador, daily, code review e entrevista. Ela responde em inglês simples e corrige o que você escrever. Entre com seu e-mail para começar, é grátis.</p><button class="btn" data-login="1">Entrar com e-mail</button></div>';
  else if(!chat.scen)h='<div class="empty">'+MASCOT+'<p>Escolha uma situação acima. A IA faz o papel da outra pessoa, fala inglês simples e corrige o que você escrever.</p><button class="btn" data-scen="recruiter">Começar com o recrutador</button></div>';
  h+=chat.items.map((m,k)=>{
    if(m.who==='me')return '<div class="msg me"><span class="en">'+esc(m.text)+'</span></div>'+
      ((m.better||m.tip)?'<div class="fix">'+(m.better?'<small>Mais natural</small><span class="en">'+esc(m.better)+'</span>':'')+(m.tip?'<span>'+esc(m.tip)+'</span>':'')+'</div>':'');
    const lastAi=k===chat.items.length-1;
    return '<div class="msg ai"><span class="en">'+esc(m.reply)+'</span>'+(m.showPt&&m.pt?'<span class="pt">'+esc(m.pt)+'</span>':'')+(m.showHint&&m.hint?'<span class="pt">Você pode dizer:</span><span class="en">'+esc(m.hint)+'</span>':'')+
      '<div class="tools">'+(canSpeak()?'<button data-m="say" data-k="'+k+'">Ouvir</button>':'')+(m.pt&&!m.showPt?'<button data-m="pt" data-k="'+k+'">Traduzir</button>':'')+(lastAi&&m.hint&&!m.showHint?'<button data-m="hint" data-k="'+k+'">Não sei o que dizer</button>':'')+'</div></div>';
  }).join('');
  if(chat.busy)h+='<div class="typing">digitando…</div>';
  else if(voiceMode&&listening)h+='<div class="typing">ouvindo… fale em inglês</div>';
  else if(voiceMode&&chat.scen)h+='<p class="note">Modo voz: a IA fala a resposta e o microfone abre sozinho. Toque no microfone se ele não abrir.</p>';
  if(chat.err)h+='<p class="note">'+esc(chat.err)+'</p>';
  $('#log').innerHTML=h;
  $('#composer').classList.toggle('hidden',!(on&&deps.isAuthed()&&chat.scen));
  if(on){const m=$('#v-chat');m.scrollTop=m.scrollHeight}
}
$('#v-chat').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.login){deps.login();return}
  if(b.dataset.voice){
    if(!dict){chat.err='Seu navegador não reconhece voz. No celular, use o Chrome.';renderChat();return}
    voiceMode=!voiceMode;
    if(!voiceMode){try{speechSynthesis.cancel()}catch(e){}if(listening)dict.stop()}
    renderChat();
    if(voiceMode){const last=chat.items[chat.items.length-1];if(last&&last.who==='ai')speak(last.reply,false,()=>setTimeout(listenForReply,250));else if(!chat.scen)startScen('recruiter')}
    return;
  }
  if(b.dataset.scen){startScen(b.dataset.scen);return}
  if(b.dataset.m){const m=chat.items[+b.dataset.k];if(!m)return;
    if(b.dataset.m==='say'){speak(m.reply);return}
    if(b.dataset.m==='pt')m.showPt=true;if(b.dataset.m==='hint')m.showHint=true;renderChat()}
});
$('#send').addEventListener('click',sendMsg);
$('#say').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();sendMsg()}});
$('#mic').addEventListener('click',()=>{
  if(!dict)return;
  if(listening){dict.stop().catch(()=>{});return}
  dict.start().catch(()=>{dict=null;$('#mic').classList.add('hidden')});
});

/* ---------- tabs ---------- */
function showTab(t){
  ['learn','home','chat','book'].forEach(n=>$('#v-'+n).classList.toggle('hidden',n!==t));
  root.querySelectorAll('nav.tabs button').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===t)));
  if(t==='home')renderHome();if(t==='learn')renderLearn();
  renderChat();
}
root.querySelector('nav.tabs').addEventListener('click',e=>{const b=e.target.closest('button');if(b)showTab(b.dataset.tab)});
$('#v-home').addEventListener('click',e=>{if(e.target.closest('[data-review]')){startReview();return}const b=e.target.closest('[data-start]');if(b)startSession(+b.dataset.start)});
$('#v-learn').addEventListener('click',e=>{const b=e.target.closest('[data-lesson]');if(b)startLesson(+b.dataset.lesson)});
$('#v-book').addEventListener('click',e=>{const b=e.target.closest('[data-say]');if(b){const [u,p]=b.dataset.say.split('.');speak(UNITS[+u].p[+p][0])}});

renderLearn();renderHome();renderBook();renderChat();

const acctLabel=()=>{const a=$('#acct');if(a)a.textContent=deps.accountLabel()};
$('#acct').addEventListener('click',()=>deps.account());
acctLabel();
return {
  destroy(){try{if(browserVoice())speechSynthesis.cancel()}catch(e){}try{if(dict)dict.stop()}catch(e){}root.innerHTML=''},
  setState(p){S=Object.assign({xp:0,streak:0,last:'',units:{},lessons:{}},p||{});renderLearn();renderHome()},
  refresh(){acctLabel();renderChat();renderHome()},
}
}

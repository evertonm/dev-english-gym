// @ts-nocheck
// Dev English Gym engine: plain DOM app mounted by src/App.tsx.
// Talks to the backend only through the `deps` object, so it stays framework-agnostic.
import { UNITS, SCEN, LESSONS, LEVELS } from './data'
import { pronOf } from './pron'
import { WHY } from './why'
// Attach each question's explanation to it, so it travels with the question into board quizzes too.
for (const l of LESSONS) (l.q as any[]).forEach((q: any, i: number) => { q.why = (WHY[l.id] || [])[i] || '' })
import { AI_TIERS, aiLimitFor } from '@convex/perks'

export type GymProgress = {
  xp: number; streak: number; last: string; units: Record<string, number>; lessons: Record<string, number>
  // Gamification (optional so older saves still load)
  goal?: number; dayXp?: number; dayKey?: string; freezes?: number; days?: string[]; badges?: string[]
  lvl?: number; chats?: number; reviews?: number; goals?: number
  board?: Record<string, number>; diceDay?: string; diceVal?: number
}
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
  quota: () => AiQuota | null
  transcribe: (audio: ArrayBuffer, mime: string) => Promise<{ ok: boolean; text?: string; code?: string }>
  track: (name: string, props?: string) => void
}
export type AiQuota = { used: number; limit: number; rank: string; next: { xp: number; limit: number; rank: string } | null }
export type GymHandle = { destroy: () => void; setState: (p: Partial<GymProgress>) => void; refresh: () => void }

// Bolha: the mascot, a speech bubble wearing a headset.
export const MASCOT = '<svg class="mascot" viewBox="0 0 120 120" aria-hidden="true"><path d="M14 46a46 40 0 0 1 92 0" fill="none" stroke="#2B1B5A" stroke-width="6" stroke-linecap="round"/><path d="M24 30h72a16 16 0 0 1 16 16v34a16 16 0 0 1-16 16H58l-20 16V96H24A16 16 0 0 1 8 80V46a16 16 0 0 1 16-16z" fill="#FFC93C" stroke="#2B1B5A" stroke-width="5" stroke-linejoin="round"/><rect x="4" y="46" width="14" height="26" rx="7" fill="#7B4DFF" stroke="#2B1B5A" stroke-width="4"/><rect x="102" y="46" width="14" height="26" rx="7" fill="#7B4DFF" stroke="#2B1B5A" stroke-width="4"/><circle cx="45" cy="58" r="7" fill="#2B1B5A"/><circle cx="75" cy="58" r="7" fill="#2B1B5A"/><circle cx="47.5" cy="55.5" r="2.4" fill="#fff"/><circle cx="77.5" cy="55.5" r="2.4" fill="#fff"/><circle cx="34" cy="71" r="5" fill="#FF8FA3" opacity=".8"/><circle cx="86" cy="71" r="5" fill="#FF8FA3" opacity=".8"/><path d="M50 72q10 10 20 0" fill="none" stroke="#2B1B5A" stroke-width="5" stroke-linecap="round"/></svg>';

const MARKUP = `<div class="app">
  <header class="top">
    <div class="brand">${MASCOT}Dev English</div>
    <div class="stats">
      <div class="stat fire" title="Dias seguidos"><svg viewBox="0 0 24 28" aria-hidden="true"><path class="flame" d="M13 1c2 7 9 9 9 17a10 10 0 1 1-20 0c0-5 3-7 5-11 0 4 2 6 3 6-1-6 2-10 3-12Z"/><path class="ember" d="M13 13c.8 4 4.6 5.6 4.6 9.1a5.6 5.6 0 0 1-11.2 0c0-2.7 2-4.7 3.1-6.3.1 2.3 1 3.1 1.6 3.4-.1-2.4 1-4.2 1.9-6.2Z"/></svg><b id="streak">0</b><span class="sr-only"> dias seguidos</span></div>
      <div class="stat" title="Pontos"><b id="xp">0</b>xp</div>
      <button class="stat rank" id="rankchip" title="Sua patente"><b id="rankname">Estagiário</b></button>
      <button class="themebtn" id="sndbtn" aria-label="Ligar ou desligar sons"></button>
      <button class="themebtn" id="themebtn" aria-label="Trocar tema claro/escuro"></button>
      <button class="acct" id="acct">Entrar</button>
    </div>
  </header>

  <main id="v-board"></main>
  <main id="v-learn" class="hidden"></main>
  <main id="v-home" class="hidden"></main>

  <main id="v-chat" class="hidden">
    <div class="scen" id="scen"></div>
    <div id="log"></div>
  </main>
  <div class="composer hidden" id="composer">
    <button class="ico hidden" id="mic" aria-label="Falar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg></button>
    <input id="say" type="text" lang="en" autocomplete="off" autocorrect="off" autocapitalize="sentences" spellcheck="false" enterkeyhint="send" data-gramm="false" placeholder="Type in English…" aria-label="Sua resposta em inglês">
    <button class="ico send" id="send" aria-label="Enviar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>
  </div>

  <main id="v-book" class="hidden"></main>
  <main id="v-me" class="hidden"></main>

  <nav class="tabs" role="tablist">
    <div class="navbrand">${MASCOT}<span>Dev<br>English</span></div>
    <button role="tab" data-tab="board" aria-selected="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18M9 3v18"/></svg>Tabuleiro</button>
    <button role="tab" data-tab="learn" aria-selected="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/></svg>Mundos</button>
    <button role="tab" data-tab="chat" aria-selected="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4z"/></svg>Conversa</button>
    <button role="tab" data-tab="book" aria-selected="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="M8 9h8M8 14h6"/></svg>Frases</button>
    <button role="tab" data-tab="me" aria-selected="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="4"/><path d="M4 22v-2a8 8 0 0 1 16 0v2Z"/></svg>Perfil</button>
  </nav>
</div>

<div id="sess" class="hidden" role="dialog" aria-label="Treino">
  <div class="wrap">
    <div class="sbar"><button class="x" id="quit" aria-label="Sair do treino">×</button><div class="prog"><i id="bar" style="width:0"></i></div></div>
    <div class="sbody" id="sbody"></div>
    <div class="fb" id="fb"></div>
  </div>
</div>
<div class="toast hidden" id="toast" role="status" aria-live="polite"></div>
`

export function mountGym(root: HTMLElement, deps: GymDeps): GymHandle {
root.innerHTML = MARKUP
// "How it sounds" line under an English sentence (US English, spelled for Brazilians).
const pronHtml=t=>{const p=pronOf(t);return p?'<span class="pron" title="Como soa no inglês americano. MAIÚSCULA = sílaba forte; dh/th = th com a língua entre os dentes; â = som neutro.">🗣 '+esc(p)+'</span>':''};
const SPK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9zM17 9a4 4 0 0 1 0 6"/></svg>';
const $=s=>root.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const clean=w=>w.replace(/[.,?!]/g,'');
const norm=s=>s.toLowerCase().replace(/[^a-z0-9' ]/g,'').split(/\s+/).filter(Boolean);

/* ---------- saved progress ---------- */
const DEF=()=>({xp:0,streak:0,last:'',units:{},lessons:{},goal:50,dayXp:0,dayKey:'',freezes:0,days:[],badges:[],lvl:0,chats:0,reviews:0,goals:0,board:{},diceDay:'',diceVal:0});
let S=Object.assign(DEF(),deps.initial()||{});
const save=()=>{try{deps.save(S)}catch(e){}};
const dayStr=d=>d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
const today=()=>dayStr(new Date());
const parseDay=t=>{const [y,m,d]=String(t).split('-').map(Number);return new Date(y,(m||1)-1,d||1)};
const daysBetween=(a,b)=>Math.round((parseDay(b)-parseDay(a))/864e5);

/* ---------- gamification: ranks, daily goal, streak rewards, badges, levels ---------- */
// Dev career ladder: your rank grows with total XP.
const RANKS=[[0,'Estagiário'],[100,'Júnior I'],[250,'Júnior II'],[500,'Pleno I'],[900,'Pleno II'],[1500,'Sênior I'],[2400,'Sênior II'],[3600,'Tech Lead'],[5200,'Staff'],[7500,'Principal']];
function rankOf(xp){let i=0;RANKS.forEach((r,k)=>{if(xp>=r[0])i=k});const c=RANKS[i],n=RANKS[i+1];return{i,name:c[1],min:c[0],next:n?n[0]:null,nextName:n?n[1]:null,pct:n?(xp-c[0])/(n[0]-c[0]):1}}
// The streak is worth XP: the longer it is, the bigger the multiplier on everything you earn.
const mult=st=>st>=30?2:st>=14?1.5:st>=7?1.25:st>=3?1.1:1;
const nextMult=st=>st<3?[3,1.1]:st<7?[7,1.25]:st<14?[14,1.5]:st<30?[30,2]:null;
const pct=m=>'+'+Math.round((m-1)*100)+'%';
const MILESTONES=[3,7,14,30,50,100,200,365];
const MAX_FREEZES=2;
const GOALS=[[30,'Leve'],[50,'Regular'],[100,'Intenso']];
const missedDays=()=>S.last?daysBetween(S.last,today())-1:Infinity;
const liveStreak=()=>{const m=missedDays();return m<=0||m<=S.freezes?S.streak:0};
const shielded=()=>{const m=missedDays();return m>0&&m<=S.freezes&&m!==Infinity};
const dayXpNow=()=>S.dayKey===today()?S.dayXp:0;
const addDayXp=n=>{if(S.dayKey!==today()){S.dayKey=today();S.dayXp=0}S.dayXp+=n};
const levelDone=lv=>LESSONS.filter(l=>l.lv===lv).every(l=>S.lessons[l.id]);
const openLv=()=>{let o=0;while(o<LEVELS.length-1&&(o<(S.lvl||0)||levelDone(o)))o++;return o};
const count3=()=>Object.values(S.units).filter(n=>n>=3).length+Object.values(S.lessons).filter(n=>n>=3).length;
const BADGES=[
 {id:'first_lesson',e:'🎓',t:'Primeira aula',d:'Termine uma aula',ok:()=>Object.keys(S.lessons).length>0},
 {id:'first_train',e:'🏋️',t:'Primeiro treino',d:'Termine um treino',ok:()=>Object.keys(S.units).length>0},
 {id:'stars3',e:'⭐',t:'Gabaritou',d:'Tire 3 estrelas em uma atividade',ok:()=>count3()>=1},
 {id:'stars10',e:'💎',t:'Perfeccionista',d:'3 estrelas em 10 atividades',ok:()=>count3()>=10},
 {id:'streak3',e:'🔥',t:'Esquentando',d:'3 dias seguidos',ok:()=>S.streak>=3},
 {id:'streak7',e:'📅',t:'Uma semana',d:'7 dias seguidos',ok:()=>S.streak>=7},
 {id:'streak30',e:'☄️',t:'Imparável',d:'30 dias seguidos',ok:()=>S.streak>=30},
 {id:'goal1',e:'🎯',t:'Meta batida',d:'Bata a meta diária',ok:()=>S.goals>=1},
 {id:'goal10',e:'🏹',t:'Constância',d:'Bata a meta 10 vezes',ok:()=>S.goals>=10},
 {id:'lv0',e:'🥉',t:'Básico concluído',d:'Todas as aulas do Básico',ok:()=>levelDone(0)},
 {id:'lv1',e:'🥈',t:'Intermediário concluído',d:'Todas as aulas do Intermediário',ok:()=>levelDone(1)},
 {id:'lv2',e:'🥇',t:'Avançado concluído',d:'Todas as aulas do Avançado',ok:()=>levelDone(2)},
 {id:'skip',e:'🚀',t:'Já sabia',d:'Passe num teste de nivelamento',ok:()=>(S.lvl||0)>0},
 {id:'chat10',e:'💬',t:'Desenrolado',d:'Mande 10 mensagens pra IA',ok:()=>S.chats>=10},
 {id:'review10',e:'🧠',t:'Aprende com o erro',d:'Revise 10 erros',ok:()=>S.reviews>=10},
 {id:'xp1000',e:'⚡',t:'Mil XP',d:'Junte 1.000 XP',ok:()=>S.xp>=1000},
 {id:'senior',e:'👑',t:'Sênior',d:'Chegue à patente Sênior',ok:()=>S.xp>=1500},
];
// Counts today's activity for the streak. A missed day is covered by a shield if you have one.
function bumpDay(ev){
  const t=today();if(S.last===t)return;
  const m=missedDays();
  if(m<=0)S.streak++;
  else if(m<=S.freezes){S.freezes-=m;S.streak++;ev.push({k:'freeze',n:m})}
  else S.streak=1;
  S.last=t;S.days=[...S.days.filter(d=>d!==t),t].slice(-60);
  if(S.streak%7===0&&S.freezes<MAX_FREEZES){S.freezes++;ev.push({k:'shield'})}
  if(MILESTONES.includes(S.streak)){const b=S.streak*5;S.xp+=b;addDayXp(b);ev.push({k:'milestone',n:S.streak,xp:b})}
}
// Every activity pays XP through here, so the streak bonus, daily goal, ranks, levels and badges stay consistent.
function award(base){
  const ev=[],rank0=rankOf(S.xp).i,lv0=openLv(),day0=dayXpNow();
  bumpDay(ev);
  const mu=mult(S.streak),bonus=Math.round(base*(mu-1)),gain=base+bonus;
  S.xp+=gain;addDayXp(gain);
  let goalBonus=0;
  if(day0<S.goal&&S.dayXp>=S.goal){goalBonus=10;S.xp+=10;S.dayXp+=10;S.goals++;ev.push({k:'goal',xp:10})}
  const r=rankOf(S.xp);if(r.i>rank0){const xp0=RANKS[rank0][0],more=aiLimitFor(S.xp)>aiLimitFor(xp0),sc=SCEN.filter(x=>x.xp&&x.xp>xp0&&x.xp<=S.xp).map(x=>x.t);ev.push({k:'rank',name:r.name,ai:more?aiLimitFor(S.xp):0,sc})}
  const lv1=openLv();if(lv1>lv0)ev.push({k:'level',lv:lv1});
  checkBadges(ev);save();
  const extra=ev.filter(e=>e.k==='milestone').reduce((a,e)=>a+e.xp,0);
  return{base,bonus,mu,goalBonus,total:gain+goalBonus+extra,ev};
}
function checkBadges(ev){BADGES.forEach(b=>{if(!S.badges.includes(b.id)&&b.ok()){S.badges.push(b.id);ev.push({k:'badge',b})}})}
const LVNAME=lv=>'Nível '+(lv+1)+' · '+LEVELS[lv].t;
function evText(e){
  if(e.k==='goal')return '🎯 Meta diária batida! +'+e.xp+' xp';
  if(e.k==='milestone')return '🔥 Ofensiva de '+e.n+' dias! +'+e.xp+' xp';
  if(e.k==='shield')return '🛡️ Ganhou uma proteção de ofensiva';
  if(e.k==='freeze')return '🛡️ Proteção usada: sua ofensiva foi salva';
  if(e.k==='rank')return '📈 Promovido a '+e.name+'!'+(e.ai?' Agora '+e.ai+' mensagens/dia com a IA.':'')+(e.sc&&e.sc.length?' Nova conversa: '+e.sc.join(', ')+'.':'');
  if(e.k==='level')return '🔓 '+LVNAME(e.lv)+' liberado!';
  if(e.k==='badge')return e.b.e+' Conquista: '+e.b.t;
  return '';
}
function rewardsHtml(r,fail){
  if(fail)sfx('no');
  else{const big=r.ev.some(e=>e.k==='rank'||e.k==='level');sfx(big?'fanfare':'win');if(!big&&r.ev.some(e=>e.k==='goal'||e.k==='badge'||e.k==='milestone'))setTimeout(()=>sfx('ding'),650)}
  const rows=[];
  if(r.bonus)rows.push('<li><span>🔥 Bônus de ofensiva '+pct(r.mu)+'</span><b>+'+r.bonus+'</b></li>');
  r.ev.forEach(e=>rows.push('<li class="ev ev-'+e.k+'"><span>'+esc(evText(e))+'</span></li>'));
  const g=Math.min(1,dayXpNow()/S.goal);
  return (rows.length?'<ul class="rewards">'+rows.join('')+'</ul>':'')+
    '<div class="goalbar"><div class="gl"><span>Meta de hoje</span><b>'+Math.min(dayXpNow(),S.goal)+'/'+S.goal+' xp</b></div><div class="prog"><i style="width:'+(g*100)+'%"></i></div></div>';
}
let toastT=null;
function toast(msg){const t=$('#toast');if(!t)return;t.innerHTML=msg;t.classList.remove('hidden');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.add('hidden'),3200)}
function updateHeader(){
  $('#xp').textContent=S.xp;$('#streak').textContent=liveStreak();
  $('#rankname').textContent=rankOf(S.xp).name;
}
// Compact "today" strip: daily goal, streak bonus and shields.
function todayHtml(){
  const d=dayXpNow(),g=Math.min(1,d/S.goal),st=liveStreak(),mu=mult(st);
  return '<section class="daily"><div class="dg"><div class="gl"><span>'+(d>=S.goal?'🎯 Meta de hoje batida!':'Meta de hoje')+'</span><b>'+Math.min(d,S.goal)+'/'+S.goal+' xp</b></div><div class="prog"><i style="width:'+(g*100)+'%"></i></div></div>'+
   '<div class="dchips"><span class="dchip fire">🔥 '+st+(st===1?' dia':' dias')+(mu>1?' · '+pct(mu)+' xp':'')+'</span><span class="dchip">🛡️ '+S.freezes+'/'+MAX_FREEZES+(shielded()?' · protegendo':'')+'</span></div></section>';
}

/* ---------- voice: browser speech synthesis + recognition (free, no server) ---------- */
let voiceMode=false;
let sess=null,les=null,rev=null;
let chat={scen:null,msgs:[],items:[],busy:false,err:''};
// What the mic heard goes into the box; the learner checks it (and fixes it) before sending.
const chatSink=text=>{const i=$('#say');i.value=(i.value+' '+text).trim();i.classList.add('heard');setTimeout(()=>i.classList.remove('heard'),1800);try{i.focus()}catch(e){}if(voiceMode)toast('Confira o texto e toque em enviar ➜')};
let dictSink=chatSink;
let listening=false;
function makeDict(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR)return null;
  let rec=null,fin=null,st=null;
  return{onFinal(f){fin=f},onState(f){st=f},
    start(){return new Promise((res,rej)=>{try{rec=new SR();rec.lang='en-US';rec.interimResults=true;rec.continuous=false;rec.maxAlternatives=5;
      rec.onresult=e=>{for(let i=e.resultIndex;i<e.results.length;i++){const r=e.results[i];
        if(r.isFinal){const alts=Array.from(r).map(a=>a.transcript).filter(Boolean);if(fin)fin({text:alts[0]||'',alts});livePreview('')}
        else livePreview(r[0].transcript)}};
      rec.onend=()=>{if(st)st({state:'idle'})};rec.onerror=()=>{if(st)st({state:'idle'})};
      rec.start();if(st)st({state:'listening'});res()}catch(e){rej(e)}})},
    stop(){try{if(rec)rec.stop()}catch(e){}return Promise.resolve()}}
}
// Shows what the mic is hearing while the learner talks.
function livePreview(t){
  const label=t==='ouvindo'?'🎙 Ouvindo… pode falar':t==='transcrevendo'?'⏳ Transcrevendo…':t?'🎙 '+t+'…':'';
  const i=$('#say');if(i&&!les)i.placeholder=label||'Type in English...';
  const h=$('#heard');if(h&&les&&label)h.innerHTML='<span class="note">'+esc(label)+'</span>';
}
// Server transcription (OpenAI): records until the learner stops talking, then turns the audio into text.
// Much better with a Brazilian accent and dev words than the browser's own recognizer.
function makeCloudDict(){
  const MR=window.MediaRecorder;if(!MR||!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)return null;
  let fin=null,st=null,rec=null,stream=null,ac=null,raf=0,stopTimer=0,maxTimer=0;
  const pickMime=()=>['audio/webm;codecs=opus','audio/webm','audio/mp4','audio/ogg;codecs=opus'].find(m=>{try{return MR.isTypeSupported(m)}catch(e){return false}})||'';
  function cleanup(){cancelAnimationFrame(raf);clearTimeout(stopTimer);clearTimeout(maxTimer);try{stream&&stream.getTracks().forEach(t=>t.stop())}catch(e){}try{ac&&ac.close()}catch(e){}stream=null;ac=null}
  return{onFinal(f){fin=f},onState(f){st=f},
    async start(){
      stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
      const mime=pickMime(),chunks=[];rec=new MR(stream,mime?{mimeType:mime}:undefined);
      rec.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};
      rec.onstop=async()=>{
        cleanup();const blob=new Blob(chunks,{type:rec.mimeType||mime||'audio/webm'});
        if(blob.size<1500){livePreview('');if(st)st({state:'idle'});return}
        livePreview('transcrevendo');
        try{const r=await deps.transcribe(await blob.arrayBuffer(),blob.type);
          livePreview('');if(st)st({state:'idle'});
          if(r&&r.ok&&r.text){if(fin)fin({text:r.text,alts:[r.text]})}
          else if(r&&r.code==='LIMIT')toast('Limite diário de voz atingido. Digite a resposta.');
          else if(!(r&&r.ok))toast('Não consegui entender o áudio. Tente de novo.');
        }catch(e){livePreview('');if(st)st({state:'idle'});toast('Não consegui entender o áudio. Tente de novo.')}
      };
      // Stop on its own after ~1.3s of silence once the learner has spoken (or 8s with no speech, 30s max).
      try{const C=window.AudioContext||window.webkitAudioContext;ac=new C();const an=ac.createAnalyser();an.fftSize=1024;ac.createMediaStreamSource(stream).connect(an);
        const buf=new Uint8Array(an.fftSize);let spoke=false,quietSince=0;const t0=performance.now();
        const tick=()=>{an.getByteTimeDomainData(buf);let sum=0;for(let i=0;i<buf.length;i++){const x=(buf[i]-128)/128;sum+=x*x}const rms=Math.sqrt(sum/buf.length),now=performance.now();
          if(rms>0.035){spoke=true;quietSince=0}else if(spoke){if(!quietSince)quietSince=now;else if(now-quietSince>1300){this.stop();return}}
          else if(now-t0>8000){this.stop();return}
          raf=requestAnimationFrame(tick)};raf=requestAnimationFrame(tick)}catch(e){}
      maxTimer=setTimeout(()=>this.stop(),30000);
      rec.start();if(st)st({state:'listening'});livePreview('ouvindo');
    },
    stop(){try{if(rec&&rec.state!=='inactive')rec.stop()}catch(e){}return Promise.resolve()}}
}
// One mic for the whole app: the server transcription when signed in, the browser's recognizer otherwise.
function makeMic(){
  const browser=makeDict(),cloud=makeCloudDict();if(!browser&&!cloud)return null;
  let fin=null,st=null,cur=null;
  [browser,cloud].forEach(d=>{if(d){d.onFinal(x=>fin&&fin(x));d.onState(x=>st&&st(x))}});
  return{onFinal(f){fin=f},onState(f){st=f},
    async start(){cur=(cloud&&deps.isAuthed())?cloud:browser;if(!cur)return;try{await cur.start()}catch(e){if(cur===cloud&&browser){cur=browser;await browser.start()}else throw e}},
    stop(){return cur?cur.stop():Promise.resolve()}}
}
let dict=makeMic();
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
  dict.onFinal(({text,alts})=>dictSink(text,alts||[text]));
  dict.onState(({state})=>{listening=state==='listening';$('#mic').classList.toggle('rec',listening);if(les)speakState();else if(voiceMode&&!sess&&!rev)renderChat()});
  $('#mic').classList.remove('hidden');
}catch(e){dict=null}}
const aiErr=c=>{
  if(c==='LIMIT'){const q=deps.quota();return 'Você usou suas '+(q?q.limit:'')+' mensagens de hoje com a IA. Volte amanhã!'+(q&&q.next?' Chegando a '+q.next.rank+', o limite sobe para '+q.next.limit+'.':'')}
  if(c==='BUSY')return 'A IA atingiu o limite do app por hoje. Volte amanhã!';
  if(c==='LOCKED')return 'Essa situação é liberada por patente. Junte mais XP para conversar nela.';
  if(c==='UNAUTHENTICATED')return 'Entre na sua conta para usar a IA.';
  return 'A IA está sobrecarregada agora. Tente de novo em alguns segundos (essa mensagem não foi descontada).';
};
const rankForXp=xp=>{let n=RANKS[0][1];RANKS.forEach(r=>{if(xp>=r[0])n=r[1]});return n};
function quotaHtml(){
  const q=deps.quota();if(!q||!deps.isAuthed())return '';
  const left=Math.max(0,q.limit-q.used);
  return '<p class="quota'+(left===0?' out':'')+'"><span>💬 <b>'+left+'</b> de '+q.limit+' mensagens hoje</span>'+(q.next?'<span class="s">'+esc(q.next.rank)+' libera '+q.next.limit+'</span>':'')+'</p>';
}

/* ---------- home + phrasebook ---------- */
const starsHtml=n=>'<span class="stars" aria-label="'+n+' de 3 estrelas">'+[1,2,3].map(i=>i<=n?'<i>★</i>':'★').join('')+'</span>';
function reviewHtml(){
  if(!deps.isAuthed())return '';
  const n=deps.dueMistakes().length;
  if(!n)return '<p class="note">Os erros que a IA corrigir nas conversas e nos textos aparecem aqui para você revisar.</p>';
  return '<section class="review"><span><b>Revisar meus erros</b><span class="s">'+n+(n===1?' frase para revisar hoje':' frases para revisar hoje')+'</span></span><button class="btn" data-review="1">Revisar</button></section>';
}
function levelHead(lv,done,total,what){
  const open=lv<=openLv();
  return '<div class="lvhead'+(open?'':' locked')+'"><span class="lvtag">'+LEVELS[lv].tag+'</span><span class="lvt"><b>'+esc(LVNAME(lv))+'</b><span class="s">'+esc(LEVELS[lv].s)+' · '+done+'/'+total+' '+what+'</span></span>'+(open?'':'<span class="lock" aria-label="Bloqueado">🔒</span>')+'</div>';
}
function lockedHtml(lv){
  return '<div class="lockbox"><span>Vença o chefão de '+esc(WORLD[lv-1])+' para entrar. Já sabe o conteúdo? Enfrente agora.</span><button class="btn alt" data-test="'+lv+'">Enfrentar o chefão</button></div>';
}
function renderHome(){
  updateHeader();
  const ol=openLv(),open=UNITS.map((u,i)=>i).filter(i=>UNITS[i].lv<=ol);
  let nx=open.find(i=>!S.units[UNITS[i].id]);const all=nx===undefined;if(all)nx=open.find(i=>S.units[UNITS[i].id]<3);if(nx===undefined)nx=open[0];
  const u=UNITS[nx];
  $('#v-home').innerHTML=todayHtml()+reviewHtml()+
   '<section class="today">'+MASCOT+'<small>'+(all?'Revisão, 5 minutos':'Treino de hoje, 5 minutos')+'</small><h1>'+esc(u.t)+'</h1><p>'+esc(u.s)+'. 10 exercícios, quase tudo no toque.</p><button class="go" data-start="'+nx+'">Começar</button></section>'+
   LEVELS.map((L,lv)=>{
     const list=UNITS.map((x,i)=>[x,i]).filter(([x])=>x.lv===lv),done=list.filter(([x])=>S.units[x.id]).length,isOpen=lv<=ol;
     return levelHead(lv,done,list.length,'treinos')+(isOpen?'':lockedHtml(lv))+'<div class="units'+(isOpen?'':' locked')+'">'+list.map(([x,i])=>
       '<button class="unit" '+(isOpen?'data-start="'+i+'"':'disabled')+'><span class="n">'+(i+1)+'</span><span><span class="t">'+esc(x.t)+'</span><span class="s">'+esc(x.s)+'</span></span>'+starsHtml(S.units[x.id]||0)+'</button>').join('')+'</div>';
   }).join('');
}
function renderBook(){
  $('#v-book').innerHTML='<p class="note">Toque na frase para ouvir.</p>'+UNITS.map((u,ui)=>
   '<details class="pb"'+(ui===0?' open':'')+'><summary><span>'+esc(u.t)+' <span class="lvmini">'+LEVELS[u.lv].tag+'</span></span></summary>'+u.p.map((p,pi)=>
     '<button class="phrase" data-say="'+ui+'.'+pi+'"><span><span class="en">'+esc(p[0])+'</span>'+pronHtml(p[0])+'<span class="pt">'+esc(p[1])+'</span></span><span class="ico">'+SPK+'</span></button>').join('')+'</details>').join('');
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
  const fb=$('#fb');fb.className='fb '+(ok?'ok':'no');sfx(ok?'ok':'no');
  fb.innerHTML='<div class="v">'+(ok?'Isso aí!':'Quase. O certo é:')+'</div><div class="row"><span><span class="en">'+esc(sess.cur.en)+'</span>'+pronHtml(sess.cur.en)+'<span class="pt">'+esc(sess.cur.pt)+'</span></span>'+(canSpeak()?'<button class="ico" data-act="say" aria-label="Ouvir">'+SPK+'</button>':'')+'</div><button class="btn" id="next">Continuar</button>';
  speak(sess.cur.en);
}
function finish(){
  const acc=sess.right/sess.total,st=acc>=.9?3:acc>=.7?2:1,u=UNITS[sess.ui];
  S.units[u.id]=Math.max(S.units[u.id]||0,st);try{deps.track('unit_done',u.id)}catch(e){}
  const r=award(sess.right*10),gain=r.total;
  $('#bar').style.width='100%';
  $('#sbody').innerHTML='<div class="end">'+MASCOT+'<div class="stars">'+[1,2,3].map(i=>i<=st?'<i>★</i>':'★').join('')+'</div><p class="big">'+esc(u.t)+' feito!</p><div class="kv"><div><b>'+sess.right+'/'+sess.total+'</b>de primeira</div><div><b>+'+gain+'</b>xp</div></div>'+rewardsHtml(r)+'<p class="note">Agora use essas frases numa conversa de verdade com a IA.</p></div>';
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
  const fb=$('#fb');fb.className='fb '+(ok?'ok':'no');sfx(ok?'ok':'no');
  fb.innerHTML='<div class="v">'+(ok?'Isso aí!':'Quase. O certo é:')+'</div><div class="row"><span class="en">'+esc(it.better)+'</span>'+(canSpeak()?'<button class="ico" data-act="say" aria-label="Ouvir">'+SPK+'</button>':'')+'</div><button class="btn" id="rnext">Continuar</button>';
  speak(it.better);
}
function finishRev(){
  S.reviews+=rev.list.length;const r=award(rev.right*5+(rev.list.length-rev.right)*2),gain=r.total;rev.over=true;
  $('#bar').style.width='100%';
  $('#sbody').innerHTML='<div class="end">'+MASCOT+'<p class="big">Revisão feita!</p><div class="kv"><div><b>'+rev.right+'/'+rev.list.length+'</b>certas</div><div><b>+'+gain+'</b>xp</div></div>'+rewardsHtml(r)+'<p class="note">As que você acertou voltam daqui a alguns dias. As que errou voltam amanhã.</p></div>';
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

function closeSession(){$('#sess').classList.add('hidden');sess=null;les=null;rev=null;dictSink=chatSink;if(listening&&dict){try{dict.stop().catch(()=>{})}catch(e){}}try{if(browserVoice())speechSynthesis.cancel()}catch(e){}renderHome();renderLearn();boardSel=null;renderBoard()}

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
  updateHeader();
  const ol=openLv();
  $('#v-learn').innerHTML=todayHtml()+reviewHtml()+
   LEVELS.map((V,lv)=>{
     const ls=LESSONS.map((x,i)=>[x,i]).filter(([x])=>x.lv===lv),us=UNITS.map((x,i)=>[x,i]).filter(([x])=>x.lv===lv),isOpen=lv<=ol;
     const tiles=worldTiles(lv),dn=tiles.filter(t=>tileDone(t)).length;
     const row=(x,attr,n,stars)=>'<button class="unit" '+(isOpen?attr:'disabled')+'><span class="n">'+n+'</span><span><span class="t">'+esc(x.t)+'</span><span class="s">'+esc(x.s)+'</span></span>'+starsHtml(stars)+'</button>';
     return '<div class="lvhead'+(isOpen?'':' locked')+'"><span class="lvtag">'+V.tag+'</span><span class="lvt"><b>'+esc(WORLD[lv])+'</b><span class="s">'+esc(LVNAME(lv))+' · '+dn+'/16 casas</span></span>'+(isOpen?'<button class="btn alt mini" data-world="'+lv+'">Tabuleiro</button>':'<span class="lock" aria-label="Bloqueado">🔒</span>')+'</div>'+
       (isOpen?'':lockedHtml(lv))+
       '<div class="units'+(isOpen?'':' locked')+'">'+ls.map(([x,i])=>row(x,'data-lesson="'+i+'"','A',S.lessons[x.id]||0)).join('')+us.map(([x,i])=>row(x,'data-start="'+i+'"','T',S.units[x.id]||0)).join('')+'</div>';
   }).join('');
}
// Skipping a world = beating the previous world's boss.
function startTest(lv){startBoardQuiz(lv-1,worldTiles(lv-1)[15])}
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
      '<button class="phrase ex" data-ex="'+i+'"><span><span class="en">'+esc(e[0])+'</span>'+pronHtml(e[0])+'<span class="pt">'+esc(e[1])+'</span></span>'+(canSpeak()?'<span class="ico">'+SPK+'</span>':'')+'</button>').join('')+'</div>'+
      (canSpeak()?'<p class="note">Toque num exemplo para ouvir.</p>':'');
    fb.innerHTML='<button class="btn" id="lnext">Entendi</button>';
  }else if(st.k==='quiz'){
    const [q,o]=st.q,gap=q.includes('___');
    les.opts=shuffle(o);les.answer=les.opts.indexOf(o[0]);
    h=gap?'<p class="ask">Complete a frase</p><div class="card"><span class="en">'+esc(q).replace('___','<span class="gap" id="gapslot">&nbsp;</span>')+'</span></div>':'<p class="ask">'+esc(q)+'</p>';
    h+='<div class="opts">'+les.opts.map((x,i)=>'<button class="opt en" data-opt="'+i+'">'+esc(x)+'</button>').join('')+'</div>';
    fb.classList.add('hidden');
  }else if(st.k==='write'){
    h='<p class="ask">Agora escreva em inglês</p><div class="card">'+esc(L.w[0])+'</div><textarea id="wr" rows="4" lang="en" autocomplete="off" autocorrect="off" autocapitalize="sentences" spellcheck="false" data-gramm="false" placeholder="Type here…" aria-label="Sua resposta em inglês"></textarea><div id="wres"></div>';
    fb.innerHTML='<button class="btn" id="wcheck">Corrigir</button><button class="btn alt" id="wskip">Ver um exemplo</button>';
  }else{
    les.say=st.t;
    h='<p class="ask">Fale em voz alta</p><div class="card"><span class="en">'+esc(st.t)+'</span>'+pronHtml(st.t)+'</div>'+listenRow()+
      (dict?'<button class="pill" id="rec">Gravar minha fala</button><div id="heard" class="note"></div>':'<p class="note">Ouça e repita 2 vezes em voz alta, imitando o ritmo.</p>');
    fb.innerHTML='<button class="btn" id="spoke">Falei</button>';
    if(dict)dictSink=(t,alts)=>{if(!les)return;const want=norm(st.t);let best=t,bs=-1;(alts||[t]).forEach(a=>{const g=norm(a),sc=want.filter(w=>g.includes(w)).length;if(sc>bs){bs=sc;best=a}});les.heard=(les.heard+' '+best).trim();showHeard()};
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
  const fb=$('#fb');fb.className='fb '+(ok?'ok':'no');sfx(ok?'ok':'no');
  fb.innerHTML='<div class="v">'+(ok?'Isso aí!':'Quase. O certo é:')+'</div><div class="row"><span><span class="en">'+esc(full)+'</span>'+pronHtml(les.say||full)+'</span>'+(les.say&&canSpeak()?'<button class="ico" data-act="say" aria-label="Ouvir">'+SPK+'</button>':'')+'</div>'+(st.q.why?'<p class="why">💡 '+esc(st.q.why)+'</p>':'')+'<button class="btn" id="lnext">Continuar</button>';
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
function finishTest(){
  const lv=les.test,need=Math.ceil(les.L.q.length*.8),pass=les.right>=need;
  if(pass)S.lvl=Math.max(S.lvl||0,lv);
  const r=award(les.right*5),gain=r.total;
  dictSink=chatSink;les.over=true;$('#bar').style.width='100%';
  $('#sbody').innerHTML='<div class="end">'+MASCOT+'<p class="big">'+(pass?esc(LEVELS[lv].t)+' liberado!':'Quase lá!')+'</p><div class="kv"><div><b>'+les.right+'/'+les.L.q.length+'</b>certas (precisa '+need+')</div><div><b>+'+gain+'</b>xp</div></div>'+rewardsHtml(r,!pass)+
    '<p class="note">'+(pass?'Você pulou direto para o '+esc(LVNAME(lv))+'.':'Faça as aulas do '+esc(LEVELS[lv-1].t)+' ou tente o teste de novo mais tarde.')+'</p></div>';
  const fb=$('#fb');fb.className='fb';fb.innerHTML='<button class="btn" id="back">Voltar</button>';
}
function finishBoard(){
  const b=les.board,n=les.L.q.length,pass=les.right>=b.need,first=!S.board[b.key];try{deps.track('board_done',b.kind+(pass?':ok':':fail'))}catch(e){}
  if(pass)S.board[b.key]=1;
  if(pass&&b.kind==='chefe')setTimeout(()=>sfx('fanfare'),700);
  if(pass&&b.kind==='chefe')S.lvl=Math.min(LEVELS.length-1,Math.max(S.lvl||0,b.w+1));
  const bonus=pass&&first?{quiz:10,sprint:15,rev:15,chefe:50}[b.kind]||0:0;
  const r=award(les.right*5+bonus),gain=r.total;
  dictSink=chatSink;les.over=true;$('#bar').style.width='100%';
  const nextW=b.w+1<LEVELS.length?WORLD[b.w+1]:'';
  const title=pass?(b.kind==='chefe'?'Chefão derrotado!':'Casa concluída!'):'Quase lá!';
  const note=pass?(b.kind==='chefe'?(nextW?nextW+' liberada! Seu peão já pode entrar no próximo mundo.':'Você zerou o jogo. Respeito!'):'Seu peão avança no tabuleiro.'):'Precisava de '+b.need+' acertos. Revise e tente de novo.';
  $('#sbody').innerHTML='<div class="end">'+MASCOT+'<p class="big">'+title+'</p><div class="kv"><div><b>'+les.right+'/'+n+'</b>certas (precisa '+b.need+')</div><div><b>+'+gain+'</b>xp</div></div>'+rewardsHtml(r,!pass)+'<p class="note">'+esc(note)+'</p></div>';
  const fb=$('#fb');fb.className='fb';fb.innerHTML='<button class="btn" id="back">Voltar ao tabuleiro</button>';
}
function finishLesson(){
  if(les.board){finishBoard();return}
  if(les.test){finishTest();return}
  const L=les.L,st=les.right>=L.q.length?3:les.right>=L.q.length*.6?2:1;
  S.lessons[L.id]=Math.max(S.lessons[L.id]||0,st);try{deps.track('lesson_done',L.id)}catch(e){}
  const r=award(les.right*10+(les.wrote?20:0)+les.spoke*5),gain=r.total;
  dictSink=chatSink;les.over=true;
  $('#bar').style.width='100%';
  $('#sbody').innerHTML='<div class="end">'+MASCOT+'<div class="stars">'+[1,2,3].map(i=>i<=st?'<i>★</i>':'★').join('')+'</div><p class="big">Aula feita: '+esc(L.t)+'!</p><div class="kv"><div><b>'+les.right+'/'+L.q.length+'</b>exercícios certos</div><div><b>+'+gain+'</b>xp</div></div>'+rewardsHtml(r)+'</div>';
  const fb=$('#fb');fb.className='fb';
  const nl=les.li+1;
  fb.innerHTML='<button class="btn" id="back">Voltar ao tabuleiro</button><button class="btn alt" id="tochat">Praticar conversa</button>';
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
    chat.msgs.push({role:'assistant',content:(o.reply||r.text).slice(0,1000)});
    const last=chat.items[chat.items.length-1];
    if(last&&last.who==='me'){
      last.better=o.better||'';last.tip=o.tip||'';
      S.chats++;const g=award(5);updateHeader();sfx('coin');sfxEvents(g.ev,300);
      toast('<b>+'+g.total+' xp</b>'+(g.ev.length?' · '+esc(evText(g.ev[0])):''));
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
  if(chat.msgs.length>=60){chat.err='Essa conversa chegou ao fim. Escolha uma situação para começar outra.';renderChat();return}
  if(listening&&dict){try{dict.stop().catch(()=>{})}catch(e){}}
  i.value='';chat.items.push({who:'me',text:t.slice(0,600)});chat.msgs.push({role:'user',content:t.slice(0,600)});turn();
}
function renderChat(){
  const on=!$('#v-chat').classList.contains('hidden');
  $('#scen').innerHTML=(deps.isAuthed()?'<button class="pill vm" data-voice="1" aria-pressed="'+voiceMode+'">'+(voiceMode?'Voz ligada':'Modo voz')+'</button>':'')+SCEN.map(s=>(s.xp&&S.xp<s.xp)?'<button class="pill lockd" data-lockscen="'+s.id+'" title="Libera em '+esc(rankForXp(s.xp))+'">🔒 '+esc(s.t)+'</button>':'<button class="pill" data-scen="'+s.id+'" aria-pressed="'+(chat.scen===s.id)+'">'+esc(s.t)+'</button>').join('')+quotaHtml();
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
  if(b.dataset.lockscen){const sc=SCEN.find(x=>x.id===b.dataset.lockscen);if(sc)toast('🔒 <b>'+esc(sc.t)+'</b> libera na patente '+esc(rankForXp(sc.xp))+' ('+sc.xp+' xp)');return}
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
  ['board','learn','home','chat','book','me'].forEach(n=>$('#v-'+n).classList.toggle('hidden',n!==t));
  root.querySelectorAll('nav.tabs button').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===t)));
  if(t==='home')renderHome();if(t==='learn')renderLearn();if(t==='me')renderMe();if(t==='board')renderBoard();
  renderChat();
}
root.querySelector('nav.tabs').addEventListener('click',e=>{const b=e.target.closest('button');if(b)showTab(b.dataset.tab)});
$('#v-home').addEventListener('click',e=>{if(e.target.closest('[data-review]')){startReview();return}const tb=e.target.closest('[data-test]');if(tb){startTest(+tb.dataset.test);return}const b=e.target.closest('[data-start]');if(b)startSession(+b.dataset.start)});
$('#v-learn').addEventListener('click',e=>{if(e.target.closest('[data-review]')){startReview();return}const tb=e.target.closest('[data-test]');if(tb){startTest(+tb.dataset.test);return}const w=e.target.closest('[data-world]');if(w){boardW=+w.dataset.world;boardSel=null;showTab('board');return}const b=e.target.closest('[data-lesson]');if(b){startLesson(+b.dataset.lesson);return}const u=e.target.closest('[data-start]');if(u)startSession(+u.dataset.start)});
$('#v-book').addEventListener('click',e=>{const b=e.target.closest('[data-say]');if(b){const [u,p]=b.dataset.say.split('.');speak(UNITS[+u].p[+p][0])}});

/* ---------- board game: each level is a world with 16 squares around a ring ---------- */
const WORLD=['Vila Júnior','Cidade Pleno','Torre Sênior'];
const SHORT={past:'Passado',present:'Presente',future:'Futuro',polite:'Educado',questions:'Perguntas',perfect:'Experiência',brmistakes:'Erros BR',stories:'Histórias',writing:'Escrita',sounds:'Pronúncia',conditionals:'Hipóteses',modals:'Modais',passive:'Passiva',phrasal:'Phrasal',tradeoffs:'Trade-offs',standup:'Daily',help:'Ajuda',review:'Review',meet:'Reuniões',bugs:'Bugs',intro:'Sobre você',story:'Casos',offer:'Proposta',pushback:'Negociar',design:'Design'};
const IC=d=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+d+'</svg>';
const ICONS={
  flag:'<path class="f" d="M6 4h12l-2.5 4L18 12H6z"/><path d="M6 21V4"/>',
  book:'<path class="f" d="M3 5.5C6 4 9 4 12 6c3-2 6-2 9-.5V19c-3-1.5-6-1.5-9 .5-3-2-6-2-9-.5z"/><path d="M12 6v13.5"/>',
  chat:'<path class="f" d="M3 7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v5a4 4 0 0 1-4 4h-6l-5 4v-4a4 4 0 0 1-3-4z"/><path d="M8.5 10.5h.01M12 10.5h.01M15.5 10.5h.01" stroke-width="3"/>',
  mic:'<rect class="f" x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  headphones:'<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect class="f" x="3" y="14" width="5" height="7" rx="2"/><rect class="f" x="16" y="14" width="5" height="7" rx="2"/>',
  code:'<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>',
  refresh:'<path d="M20 11a8 8 0 0 0-14.3-4.9L4 8"/><path d="M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14.3 4.9L20 16"/><path d="M20 20v-4h-4"/>',
  bug:'<rect class="f" x="7" y="7" width="10" height="13" rx="5"/><path d="M9 7a3 3 0 0 1 6 0M3 13h4M17 13h4M4 8l3 2M20 8l-3 2M4 19l3-2M20 19l-3-2M12 11v8"/>',
  terminal:'<rect class="f" x="3" y="4" width="18" height="16" rx="3"/><path d="M7 9l3 3-3 3M12 15h5"/>',
  question:'<rect class="f" x="4" y="4" width="16" height="16" rx="3"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.4v.3M12 16.5h.01"/>',
  chest:'<rect class="chest-base" x="3" y="10" width="18" height="10" rx="2.5"/><path class="chest-lid" d="M2 10l2-4a3 3 0 0 1 2.5-1.5h11A3 3 0 0 1 20 6l2 4v2H2Z"/><rect class="chest-latch" x="10" y="10" width="4" height="5.5" rx="1.4"/><path d="M12 13v.4"/>',
  crown:'<path class="f" d="m2 7 5.5 5L12 4l4.5 8L22 7l-3 13H5Z"/>',
  rocket:'<path class="f" d="M12 3c3 2 5 6 4 11H8C7 9 9 5 12 3z"/><path d="M8 14l-3 3 1 3 3-2M16 14l3 3-1 3-3-2M10 18h4"/><circle cx="12" cy="9" r="1.5"/>',
  smile:'<circle class="f" cx="12" cy="12" r="9"/><path d="M8.5 14a4 4 0 0 0 7 0M9 9.5h.01M15 9.5h.01"/>',
  users:'<circle class="f" cx="9" cy="8" r="3.5"/><path d="M3 20a6 6 0 0 1 12 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a5 5 0 0 1 3 6"/>',
  user:'<circle class="f" cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  briefcase:'<rect class="f" x="3" y="7" width="18" height="13" rx="2.5"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
  pencil:'<path class="f" d="M4 20l1-5L16 4l4 4L9 19z"/><path d="M14 6l4 4"/>',
  branch:'<circle class="f" cx="6" cy="5" r="2.5"/><circle class="f" cx="6" cy="19" r="2.5"/><circle class="f" cx="18" cy="8" r="2.5"/><path d="M6 7.5v9M18 10.5c0 4-6 3-11 6.5"/>',
  bulb:'<path class="f" d="M9 17h6v-2.5c2-1.3 3-3 3-5a6 6 0 0 0-12 0c0 2 1 3.7 3 5z"/><path d="M10 21h4"/>',
  puzzle:'<path class="f" d="M5 8h3a2 2 0 1 1 4 0h3v3a2 2 0 1 1 0 4v4H5v-4a2 2 0 1 0 0-4z"/>',
  scale:'<path d="M12 4v16M7 20h10M5 7h14"/><path class="f" d="M5 7l-3 6a3 3 0 0 0 6 0zM19 7l-3 6a3 3 0 0 0 6 0z"/>',
  layers:'<path class="f" d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
  speaker:'<path class="f" d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9a4 4 0 0 1 0 6M19.5 6.5a8 8 0 0 1 0 11"/>',
};
const ICON_ID={past:'book',present:'chat',future:'rocket',polite:'smile',questions:'chat',perfect:'briefcase',brmistakes:'bug',stories:'book',writing:'pencil',sounds:'speaker',conditionals:'branch',modals:'bulb',passive:'terminal',phrasal:'puzzle',tradeoffs:'scale',standup:'mic',help:'headphones',review:'code',meet:'users',bugs:'bug',intro:'user',story:'book',offer:'briefcase',pushback:'scale',design:'layers'};
const ICON_KIND={start:'flag',bau:'chest',quiz:'question',sprint:'terminal',rev:'refresh',chefe:'crown',aula:'book',treino:'mic'};
const TIC=t=>IC(ICONS[(t.id&&ICON_ID[t.id])||ICON_KIND[t.k]]);
const CHECK=IC('<path d="M5 12.5l4.5 4.5L19 7.5"/>');
const DICE=IC('<path d="m12 1.5 9 5.1a2 2 0 0 1 1 1.7v7.4a2 2 0 0 1-1 1.7l-8 4.7a2 2 0 0 1-2 0l-8-4.7a2 2 0 0 1-1-1.7V8.3a2 2 0 0 1 1-1.7zM2.5 7.4l9.5 5.5 9.5-5.5M12 13v8.7"/><path d="M12 7h.01M6.6 13.7h.01M17 13.1h.01M18.8 16h.01" stroke-width="2.5"/>');
const CHEVRON=IC('<path d="m9 5 7 7-7 7"/>');
const ARROW=IC('<path d="M3 12h17m-8-8 8 8-8 8"/>');
const PAWN='<span class="tico pawn">'+MASCOT+'</span>';
// The three worlds share a small diorama, with a palette that follows the app theme.
const artGradient=(id,a,b,radial=false)=>radial
  ? '<radialGradient id="map-'+id+'" cx="35%" cy="24%" r="78%"><stop stop-color="hsl(var(--art-'+a+'))"/><stop offset="1" stop-color="hsl(var(--art-'+b+'))"/></radialGradient>'
  : '<linearGradient id="map-'+id+'" x2=".2" y2="1"><stop stop-color="hsl(var(--art-'+a+'))"/><stop offset="1" stop-color="hsl(var(--art-'+b+'))"/></linearGradient>';
const artDefs='<defs>'+
  artGradient('grass','grass-hi','grass-lo',true)+artGradient('leaf','leaf-hi','leaf-lo',true)+
  artGradient('wall','stone-hi','stone-lo')+artGradient('side','stone-lo','stone-edge')+
  artGradient('roof','roof-hi','roof-lo')+artGradient('gable','roof-lo','roof-edge')+
  artGradient('pane','light-hi','light-lo',true)+artGradient('trail','sand-hi','sand-lo')+
  artGradient('wood','wood-hi','wood-lo')+artGradient('glass','glass-hi','glass-lo')+
  '<radialGradient id="map-glow"><stop stop-color="hsl(var(--art-light-lo))" stop-opacity=".6"/><stop offset="1" stop-color="hsl(var(--art-light-lo))" stop-opacity="0"/></radialGradient></defs>';
const artAt=(x,y,s,body)=>'<g transform="translate('+x+' '+y+') scale('+s+')">'+body+'</g>';
const oval=(x,y,rx,ry,fill)=>'<ellipse cx="'+x+'" cy="'+y+'" rx="'+rx+'" ry="'+ry+'" fill="'+fill+'"/>';
const stone=(x,y,s)=>artAt(x,y,s,'<path d="M-7 1q2-7 8-6 5 0 7 6-2 3-9 3t-6-3" fill="url(#map-side)"/><path d="M-4 0q3-4 8-2" class="stone-glint"/>');
const shrub=(x,y,s)=>artAt(x,y,s,'<path d="M-13 1q-2-8 6-10 5-9 12-3 8-2 10 9 4 8-12 9Q-10 7-13 1Z" fill="url(#map-leaf)"/>');
const tree=(x,y,s)=>artAt(x,y,s,
  oval(4,2,19,5,'hsl(var(--art-shadow) / .25)')+
  '<path d="M-4 1v-17l-8-9 2-4 8 7 4-12 4 2-2 13 9-6 2 4-11 10L5 1Z" fill="url(#map-wood)"/>'+
  '<g fill="url(#map-leaf)"><circle cx="-14" cy="-30" r="16"/><circle cx="13" cy="-31" r="15"/><circle cx="0" cy="-42" r="19"/><circle cx="-16" cy="-42" r="12"/><circle cx="12" cy="-44" r="14"/><circle cx="-6" cy="-51" r="13"/><circle cx="5" cy="-32" r="14"/></g>');
const windowArt=(x,y,s)=>artAt(x,y,s,
  '<circle class="art-glow" cx="0" cy="-4" r="20" fill="url(#map-glow)"/>'+
  '<path d="M-6 3v-9a6 6 0 0 1 12 0v9Z" fill="url(#map-pane)" stroke="hsl(var(--art-wood-lo))" stroke-width="1.7"/><path class="art-frame" d="M0-11V3M-6-4H6"/><path d="M-7 4H7" class="art-frame"/>');
const door='<path d="M-10 0v-17a10 10 0 0 1 20 0V0" fill="url(#map-wood)" stroke="hsl(var(--art-stone-lo))" stroke-width="2.6"/><path d="M-6-5v-12m5-7v22m6-17v13" class="art-frame"/><circle cx="5" cy="-10" r="1.25" fill="hsl(var(--art-light-hi))"/>';
const roof='<path d="m-34-35 23-29 40-10 30 27-38 11-32-25-20 30Z" fill="url(#map-roof)"/><path d="M-34-35l23-29 32 28 38-11v4L21-31-11-57l-21 27Z" fill="url(#map-gable)"/>'+
  '<path class="art-shingles" d="m-4-58 40-11m-33 17 39-11m-31 17 39-11m-31 17 38-11M8-69l6 6m2 8 7 6m3 6 6 5m-7-35 7 7m0 7 7 6m5 4 6 5M-27-44l20-14m-15 6 14 1"/>';
const cottage=(x,y,s,chimney=false)=>artAt(x,y,s,
  oval(10,0,49,12,'hsl(var(--art-shadow) / .23)')+
  '<path d="M-28-33-11-56 21-30V1L-28 5Z" fill="url(#map-wall)"/><path d="M21-31 51-42v34L21 1Z" fill="url(#map-side)"/>'+
  '<path class="art-masonry" d="M-28-23l48-3m-48 12 49-4m-49 14 48-5m-38-35v7m6 13v8m-9 1v9m35-25v9m-7 7v8m14-16 30-10m-29 20 29-10m-14-12v9m6 0v10"/>'+
  artAt(-3,2,.86,door)+windowArt(-12,-36,.83)+windowArt(38,-18,.78)+roof+
  (chimney?'<path d="m23-78 12-2v23l-8 2-4-4Z" fill="url(#map-side)"/><path d="m23-78 7 2v21l-7-4Z" fill="url(#map-wall)"/><path d="m20-81 12-4 7 3v4l-11 3-8-3Z" fill="url(#map-wall)"/><path d="m23-81 9-2 4 1-8 3Z" fill="hsl(var(--art-wood-lo))"/>':''));
const lamp=(x,y,s)=>artAt(x,y,s,
  '<circle class="art-glow" cy="-31" r="23" fill="url(#map-glow)"/><path d="M-5 1Q0-4 5 1M0 0v-25" fill="none" stroke="hsl(var(--art-wood-lo))" stroke-width="2.5"/><path d="M-6-34h12l-3 10h-6Z" fill="url(#map-pane)" stroke="hsl(var(--art-wood-lo))" stroke-width="1.2"/><path d="M-8-34 0-41l8 7Z" fill="url(#map-wood)"/><path class="art-frame" d="m0-33 0 8"/>');
const bench=artAt(158,153,.78,
  '<path d="M-16 0v11m27-11v8m-29-21v14m28-14v13" stroke="hsl(var(--art-wood-lo))" stroke-width="3"/><path d="m-19-14 33-3v9l-33 3Zm2 13 30-3 5 4-32 4Z" fill="url(#map-wood)"/><path class="stone-glint" d="m-17-11 29-3m-27 13 27-3"/>');
const island=
  oval(120,151,109,26,'hsl(var(--art-shadow) / .19)')+
  '<path d="M10 140c0-23 46-39 111-39s111 17 111 39v5c-2 21-48 36-112 36S10 167 10 145Z" fill="hsl(var(--art-grass-lo))"/>'+
  '<path d="M10 139c0-22 44-41 110-41s112 19 112 41-47 38-112 38S10 162 10 139Z" fill="url(#map-grass)"/>'+
  '<path d="M17 144c9 15 52 29 102 29 52 0 94-12 106-29" fill="none" stroke="hsl(var(--art-grass-hi) / .55)" stroke-width="1.2"/>'+
  '<path d="M76 164c-4-9 15-15 20-20 12-11-4-15 1-24 2-6 13-10 22-16l12 1c-9 9-23 13-21 18 1 4 13 11 11 17-3 8 17 13 25 20 14 13-62 19-70 4Z" fill="url(#map-trail)"/>'+
  '<path class="art-pavers" d="M77 161q33 12 70 1m-68-5q33 10 61 0m-50-6q27 6 42 0m-36-5q15 2 28-1m-23-5 20-1m-23-5 23-3m-23-4 14-2m-15-5 13 1m-8-7 12 2m-4-6 12 2M83 160l2-4m7 8 3-9m5-3 2-6m5 22 2-13m9 13 1-12m11 11-2-10m10 8-3-5m-25-11-1-6m4-5-5-7m-1-5-3-5m5-7 4-5"/>'+
  stone(28,151,.68)+stone(65,161,.85)+stone(182,152,.75)+stone(205,156,.82)+stone(145,139,.53)+stone(71,124,.5)+stone(155,124,.48);
const village=tree(58,112,1.02)+tree(188,115,.85)+shrub(77,120,.85)+shrub(161,117,.9)+
  cottage(115,106,.99,true)+shrub(89,112,.5)+cottage(49,150,.78)+cottage(171,144,.72)+
  shrub(32,150,.65)+shrub(204,145,.65)+shrub(195,150,.55)+lamp(154,114,.89)+lamp(89,163,.93)+bench;
const building=(x,y,s,rows)=>artAt(x,y,s,
  oval(9,1,31,8,'hsl(var(--art-shadow) / .25)')+
  '<path d="M-18-15H14V0h-32Z" fill="url(#map-wall)"/><path d="m14-15 17-8v15L14 0Z" fill="url(#map-side)"/>'+
  '<path d="M-20-22v-'+(rows*13)+'h35v'+(rows*13+12)+'h-35Z" fill="url(#map-glass)"/>'+
  '<path d="m15-10 17-8v-'+(rows*13+12)+'l-17 8Z" fill="url(#map-gable)"/>'+
  '<path d="M-20 '+(-22-rows*13)+'l17-8h35l-17 8Z" fill="url(#map-roof)"/>'+
  Array.from({length:rows},(_,i)=>[-13,0].map((wx,j)=>'<rect x="'+wx+'" y="'+(-27-i*13)+'" width="8" height="8" rx="1.4" fill="'+((i+j)%3?'url(#map-pane)':'url(#map-side)')+'"/>').join('')+
    '<path class="art-shingles" d="M-19 '+(-17-i*13)+'h34l16-8"/>').join('')+
  '<path d="M-7 0v-11h12V0" fill="url(#map-pane)" stroke="hsl(var(--art-wood-lo))" stroke-width="1.4"/>');
const turret=(x,y,s)=>artAt(x,y,s,
  oval(5,0,33,9,'hsl(var(--art-shadow) / .25)')+
  '<path d="M-23-59h34V2h-34Z" fill="url(#map-wall)"/><path d="m11-59 16-8v61L11 2Z" fill="url(#map-side)"/>'+
  '<path class="art-masonry" d="M-22-46h33l16-8M-22-34h33l16-8M-22-22h33l16-8M-22-10h33l16-8m-39-43v15m11 0v12m-13 0v12m13 0v12"/>'+
  '<path d="m-28-56 22-42 36 31-19 13Z" fill="url(#map-roof)"/><path d="m-6-98 17 44 19-13Z" fill="url(#map-gable)"/><path class="art-shingles" d="m-23-65 37 3 13-8m-44-5 27 3 9-5m-31-7 20 5"/>'+
  windowArt(-7,-39,.81)+artAt(-6,2,.88,door));
const city=tree(34,133,.62)+tree(198,126,.69)+building(114,115,1.12,6)+building(63,143,.98,3)+building(168,139,1,4)+
  shrub(43,148,.73)+shrub(185,147,.66)+lamp(91,161,.9)+lamp(145,149,.73)+bench;
const tower=tree(54,134,.82)+tree(185,133,.72)+turret(122,131,1.26)+
  '<path d="M114 8v20" stroke="hsl(var(--art-wood-lo))" stroke-width="2"/><path d="m114 8 26 5-8 4 6 4-24-3Z" fill="url(#map-pane)"/>'+
  turret(78,144,.66)+turret(160,142,.69)+shrub(51,145,.75)+shrub(187,142,.8)+lamp(83,162,.86)+lamp(145,154,.82)+bench;
const ART=[village,city,tower].map(scene=>'<svg viewBox="0 12 240 175" aria-hidden="true" focusable="false">'+artDefs+island+scene+'</svg>');


let boardW=null,boardSel=null;
function worldTiles(w){
  const L=LESSONS.map((l,i)=>[l,i]).filter(([l])=>l.lv===w),U=UNITS.map((u,i)=>[u,i]).filter(([u])=>u.lv===w);
  const A=k=>L[k]?{k:'aula',li:L[k][1],id:L[k][0].id,label:SHORT[L[k][0].id]||L[k][0].t}:{k:'quiz'};
  const T=k=>U[k]?{k:'treino',ui:U[k][1],id:U[k][0].id,label:SHORT[U[k][0].id]||U[k][0].t}:{k:'quiz'};
  const S4=U[3]?T(3):{k:'sprint'};
  const seq=[{k:'start'},A(0),T(0),{k:'bau'},A(1),A(2),{k:'quiz'},T(1),T(2),{k:'bau'},{k:'rev'},A(4),A(3),S4,{k:'bau',big:1},{k:'chefe'}];
  const LBL={start:'Início',bau:'Baú',quiz:'Quiz',sprint:'Sprint',rev:'Revisão',chefe:'Chefão'};
  return seq.map((t,i)=>Object.assign({w,i,key:'w'+w+'t'+i,label:t.big?'Tesouro':LBL[t.k]},t));
}
function tileDone(t){
  if(t.k==='start')return true;
  if(t.k==='aula')return !!S.lessons[t.id];
  if(t.k==='treino')return !!S.units[t.id];
  return !!S.board[t.key];
}
const FAMILY={start:'v',aula:'v',sprint:'v',chefe:'v',treino:'b',quiz:'b',rev:'b',bau:'g'};
const curIndex=tiles=>{const i=tiles.findIndex(t=>!tileDone(t));return i<0?tiles.length:i};
// 5x5 ring: top row left to right, right column down, bottom row right to left, left column up.
function ringPos(i){if(i<=4)return[1,i+1];if(i<=7)return[i-3,5];if(i<=12)return[5,13-i];return[17-i,1]}
function tileInfo(t){
  const XP={aula:'5 min · +50 XP',treino:'4 min · +100 XP',bau:'+10 a 30 XP',quiz:'1 min · +25 XP',rev:'2 min · +45 XP',chefe:'4 min · +100 XP',start:''};
  if(t.k==='aula'){const L=LESSONS[t.li];return{title:L.t,sub:L.s,ex:L.c[0].ex[0][0],desc:'',xp:XP.aula,go:'Continuar aula',again:'Refazer aula'}}
  if(t.k==='treino'){const U=UNITS[t.ui];return{title:U.t,sub:U.s,ex:U.p[0][0],desc:'',xp:XP.treino,go:'Começar treino',again:'Treinar de novo'}}
  if(t.k==='bau')return{title:t.big?'Tesouro do mundo':'Baú de bônus',ex:'',desc:'Abra e ganhe XP extra na hora.',xp:t.big?'+20 a 40 XP':XP.bau,go:'Abrir baú',again:''};
  if(t.k==='sprint')return{title:'Sprint',ex:'',desc:'5 perguntas rápidas, como uma sprint. Acerte 4.',xp:'2 min · +35 XP',go:'Começar sprint',again:'Correr de novo'};
  if(t.k==='quiz')return{title:'Quiz relâmpago',ex:'',desc:'3 perguntas do que você já viu neste mundo. Acerte 2.',xp:XP.quiz,go:'Jogar quiz',again:'Jogar de novo'};
  if(t.k==='rev')return{title:'Revisão do mundo',ex:'',desc:'6 perguntas para fixar o conteúdo. Acerte 4.',xp:XP.rev,go:'Fazer revisão',again:'Revisar de novo'};
  if(t.k==='chefe'){const nx=WORLD[t.w+1];return{title:'Chefão: prova final',ex:'',desc:'10 perguntas de todo o mundo. Acerte 8'+(nx?' e libere '+nx+'.':' e zere o jogo.'),xp:XP.chefe,go:'Enfrentar chefão',again:'Lutar de novo'}}
  return{title:'Início',ex:'',desc:'Sua jornada neste mundo começa aqui.',xp:'',go:'',again:''};
}
function startBoardQuiz(w,t){
  const n={quiz:3,sprint:5,rev:6,chefe:10}[t.k],need={quiz:2,sprint:4,rev:4,chefe:8}[t.k];
  const pool=shuffle(LESSONS.filter(l=>l.lv===w).flatMap(l=>l.q)).slice(0,n);
  const title={quiz:'Quiz relâmpago',sprint:'Sprint',rev:'Revisão: '+WORLD[w],chefe:'Chefão: '+WORLD[w]}[t.k];
  les={li:-1,L:{id:t.key,t:title,q:pool,c:[],w:null,sp:[]},board:{w,key:t.key,kind:t.k,need},steps:pool.map(q=>({k:'quiz',q})),pos:0,right:0,wrote:false,spoke:0,busy:false,say:'',heard:''};
  $('#sess').classList.remove('hidden');renderStep();
}
function rankHud(){
  const r=rankOf(S.xp);
  return '<div class="bhud"><div class="gl"><span>'+esc(r.name)+'</span><b>'+S.xp+(r.next?' / '+r.next:'')+' XP</b></div><div class="prog"><i style="width:'+(r.pct*100)+'%"></i></div></div>';
}
function renderBoard(){
  updateHeader();
  const ol=openLv();if(boardW===null||boardW>LEVELS.length-1)boardW=ol;
  const w=boardW,open=w<=ol,tiles=worldTiles(w),cur=open?curIndex(tiles):-1,done=tiles.filter(tileDone).length;
  if(boardSel===null||boardSel>=tiles.length)boardSel=Math.min(Math.max(cur,0),tiles.length-1);
  const sel=tiles[boardSel],selDone=tileDone(sel),selLocked=!open||(!selDone&&boardSel>cur);
  const diceToday=S.diceDay===today();
  const cells=tiles.map((t,i)=>{
    const [r,c]=ringPos(i),dn=tileDone(t),isCur=i===cur,lock=!open||(!dn&&i>cur);
    const cls='tile f-'+FAMILY[t.k]+' k-'+t.k+(dn?' done':'')+(isCur?' cur':'')+(lock?' locked':'')+(i===boardSel?' sel':'');
    return '<button class="'+cls+'" style="grid-row:'+r+';grid-column:'+c+'" data-tile="'+i+'" aria-pressed="'+(i===boardSel)+'" aria-label="Casa '+(i+1)+': '+esc(t.label)+(dn?', concluída':lock?', bloqueada':isCur?', sua vez':'')+'"><span class="tn">'+(i+1)+'</span>'+(isCur?PAWN:'<span class="tico">'+TIC(t)+'</span>')+'<span class="tl">'+esc(t.label)+'</span>'+(dn&&t.k!=='start'||t.k==='start'?'<span class="tok">'+CHECK+'</span>':'')+'</button>';
  }).join('');
  const center=open
    ?'<div class="bcenter"><div class="art">'+ART[w]+'</div><button class="dice'+(diceToday?' used':'')+'" data-dice'+(diceToday?' disabled':'')+'>'+DICE+'<span>'+(diceToday?'Tirou '+S.diceVal+' hoje':'Rolar dado')+'</span></button><span class="dsub">'+(diceToday?'Volte amanhã':'1 vez por dia')+'</span></div>'
    :'<div class="bcenter"><div class="art dim">'+ART[w]+'</div><p class="lockmsg">🔒 Vença o chefão de '+esc(WORLD[w-1])+' para entrar.</p><button class="btn alt mini" data-test="'+w+'">Enfrentar o chefão</button></div>';
  const info=tileInfo(sel);
  const kicker='CASA '+(boardSel+1)+' · '+(selLocked?'BLOQUEADA':boardSel===cur?'SUA VEZ':selDone?'CONCLUÍDA':'');
  let btn='';
  if(selLocked)btn='<button class="btn" disabled>Bloqueada</button>';
  else if(sel.k==='start')btn='';
  else if(sel.k==='bau')btn=selDone?'<button class="btn" disabled>Baú aberto</button>':'<button class="btn" data-play>'+info.go+'</button>';
  else btn='<button class="btn" data-play>'+(selDone?info.again:info.go)+' '+ARROW+'</button>';
  const card='<section class="turn"><span class="kick">'+kicker+'</span><h2>'+esc(info.title)+'</h2>'+(info.sub?'<p class="sub">'+esc(info.sub)+'</p>':'')+(info.ex?'<p class="ex">'+esc(info.ex)+'</p>':'')+(info.desc?'<p class="desc">'+esc(info.desc)+'</p>':'')+(info.xp?'<span class="meta">'+info.xp+'</span>':'')+btn+'</section>';
  $('#v-board').innerHTML=
   '<div class="bhead"><div class="btitle"><h1>'+esc(WORLD[w])+'</h1><p>Mundo '+(w+1)+' · '+LEVELS[w].tag+' · '+(open?done+' de 16 casas concluídas':'bloqueado')+'</p></div>'+
   '<div class="wnav"><button class="wbtn" data-wprev aria-label="Mundo anterior"'+(w===0?' disabled':'')+'>'+CHEVRON+'</button><button class="wbtn" data-wnext aria-label="Próximo mundo"'+(w===LEVELS.length-1?' disabled':'')+'>'+CHEVRON+'</button></div>'+rankHud()+'</div>'+
   '<div class="bwrap"><div class="boardbox"><div class="ring">'+cells+center+'</div></div><aside class="bside">'+card+'</aside></div>';
}
// On phones the tile card sits below the board: bring it (and its button) into view.
function showTurn(){
  const c=document.querySelector('#v-board .turn');if(!c)return;
  let sc=c.parentElement;while(sc&&sc!==document.body){const o=getComputedStyle(sc).overflowY;if(/(auto|scroll)/.test(o)&&sc.scrollHeight>sc.clientHeight)break;sc=sc.parentElement}
  if(!sc||sc===document.body)sc=document.scrollingElement||document.documentElement;
  const box=sc===document.scrollingElement||sc===document.documentElement?{top:0,bottom:innerHeight}:sc.getBoundingClientRect();
  const r=c.getBoundingClientRect();
  if(r.top>=box.top&&r.bottom<=box.bottom-8)return;
  const room=box.bottom-box.top;
  const delta=r.height<room-40?(r.bottom-box.bottom)+16:(r.top-box.top)-12;
  sc.scrollBy({top:delta,behavior:'smooth'});
  c.classList.remove('pulse');void c.offsetWidth;c.classList.add('pulse');
}
function playTile(t){
  if(t.k==='aula'){startLesson(t.li);return}
  if(t.k==='treino'){startSession(t.ui);return}
  if(t.k==='bau'){
    if(S.board[t.key])return;
    S.board[t.key]=1;const v=t.big?20+Math.floor(Math.random()*21):10+Math.floor(Math.random()*21);
    sfx('chest');try{deps.track('chest')}catch(e){}const r=award(v);sfxEvents(r.ev,500);renderBoard();
    toast('<b>Baú aberto: +'+r.total+' xp!</b>'+(r.ev.length?' · '+esc(evText(r.ev[0])):''));return;
  }
  if(t.k==='quiz'||t.k==='sprint'||t.k==='rev'||t.k==='chefe')startBoardQuiz(t.w,t);
}
$('#v-board').addEventListener('click',e=>{
  const tb=e.target.closest('[data-test]');if(tb){startTest(+tb.dataset.test);return}
  if(e.target.closest('[data-wprev]')){boardW=Math.max(0,boardW-1);boardSel=null;renderBoard();return}
  if(e.target.closest('[data-wnext]')){boardW=Math.min(LEVELS.length-1,boardW+1);boardSel=null;renderBoard();return}
  if(e.target.closest('[data-review]')){startReview();return}
  const tile=e.target.closest('[data-tile]');if(tile){boardSel=+tile.dataset.tile;renderBoard();showTurn();return}
  if(e.target.closest('[data-play]')){playTile(worldTiles(boardW)[boardSel]);return}
  if(e.target.closest('[data-dice]')){
    if(S.diceDay===today())return;
    const v=1+Math.floor(Math.random()*6);S.diceDay=today();S.diceVal=v;
    sfx('dice');try{deps.track('dice',String(v))}catch(e){}const r=award(v*5);sfxEvents(r.ev,450);renderBoard();const d=$('#v-board .dice');if(d)d.classList.add('rolled');
    toast('<b>Dado: '+v+' → +'+r.total+' xp</b>'+(r.ev.length?' · '+esc(evText(r.ev[0])):''));
  }
});

/* ---------- sound effects: synthesized with Web Audio (no files); muted while English audio plays ---------- */
const SND_KEY='devenglish-sound';
let actx=null;
const sndOn=()=>{try{return localStorage.getItem(SND_KEY)!=='off'}catch(e){return true}};
function audio(){
  if(!actx){const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;
    try{if(navigator.audioSession)navigator.audioSession.type='ambient'}catch(e){} // iPhone: respect the silent switch
    try{actx=new C()}catch(e){return null}}
  if(actx.state==='suspended')actx.resume();return actx;
}
function tone(f,t0,d,type,g,f2){
  const a=audio();if(!a)return;const t=a.currentTime+t0,o=a.createOscillator(),v=a.createGain();
  o.type=type||'sine';o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);
  v.gain.setValueAtTime(0.0001,t);v.gain.exponentialRampToValueAtTime(g||.1,t+.008);v.gain.exponentialRampToValueAtTime(0.0001,t+d);
  o.connect(v).connect(a.destination);o.start(t);o.stop(t+d+.02);
}
function rattle(t0,d,g){
  const a=audio();if(!a)return;const t=a.currentTime+t0,n=Math.floor(a.sampleRate*d),buf=a.createBuffer(1,n,a.sampleRate),c=buf.getChannelData(0);
  for(let i=0;i<n;i++)c[i]=(Math.random()*2-1)*(1-i/n);
  const src=a.createBufferSource(),bp=a.createBiquadFilter(),v=a.createGain();src.buffer=buf;bp.type='bandpass';bp.frequency.value=2200+Math.random()*1200;bp.Q.value=4;v.gain.value=g;
  src.connect(bp).connect(v).connect(a.destination);src.start(t);
}
const SFX={
  tap:()=>tone(700,0,.045,'triangle',.035),
  ok:()=>{tone(880,0,.12,'sine',.11);tone(1320,.08,.2,'sine',.09)},
  no:()=>{tone(260,0,.22,'triangle',.1,170)},
  coin:()=>{tone(988,0,.07,'square',.03);tone(1319,.06,.16,'square',.03)},
  ding:()=>{tone(1175,0,.3,'sine',.09);tone(1568,.12,.45,'sine',.07)},
  dice:()=>{for(let i=0;i<6;i++)rattle(i*.065,.045,.5);tone(1046,.42,.18,'triangle',.08)},
  chest:()=>{[523,659,784,1047].forEach((f,i)=>tone(f,i*.07,.18,'triangle',.08));tone(2093,.32,.12,'sine',.035);tone(2637,.4,.16,'sine',.03)},
  win:()=>{[523,659,784,1047].forEach((f,i)=>tone(f,i*.09,.22,'triangle',.08))},
  fanfare:()=>{[[392,0,.14],[523,.13,.14],[659,.26,.14],[784,.39,.55]].forEach(([f,t,d])=>{tone(f,t,d,'square',.035);tone(f*2,t,d,'triangle',.05)});tone(1047,.39,.55,'sine',.05)},
};
function sfx(n){
  if(!sndOn())return;
  try{if(window.speechSynthesis&&speechSynthesis.speaking)return}catch(e){}
  try{SFX[n]&&SFX[n]()}catch(e){}
}
function sfxEvents(ev,delay){
  if(!ev||!ev.length)return;const big=ev.some(e=>e.k==='rank'||e.k==='level');
  setTimeout(()=>sfx(big?'fanfare':'ding'),delay||0);
}
const SND_ON=IC('<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9a4 4 0 0 1 0 6M19.5 6.5a8 8 0 0 1 0 11"/>');
const SND_OFF=IC('<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l5 6M22 9l-5 6"/>');
function paintSnd(){const b=$('#sndbtn');if(b){b.innerHTML=sndOn()?SND_ON:SND_OFF;b.title=sndOn()?'Desligar sons':'Ligar sons';b.setAttribute('aria-pressed',String(sndOn()))}}
paintSnd();
$('#sndbtn').addEventListener('click',()=>{try{localStorage.setItem(SND_KEY,sndOn()?'off':'on')}catch(e){}paintSnd();sfx('ding')});
// A soft tick on any button press; answers, dice and chests add their own sound on top.
root.addEventListener('pointerdown',e=>{const b=e.target.closest('button');if(b&&!b.disabled&&b.id!=='sndbtn')sfx('tap')});

/* ---------- theme: auto (device), light or dark; saved on this device ---------- */
const THEME_KEY='devenglish-theme';
const SUN_IC=IC('<circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>');
const MOON_IC=IC('<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z"/>');
const getTheme=()=>{try{const t=localStorage.getItem(THEME_KEY);return t==='light'||t==='dark'?t:'auto'}catch(e){return 'auto'}};
const isDark=()=>{const t=getTheme();return t==='dark'||(t==='auto'&&window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches)};
function applyTheme(t){
  try{if(t==='auto')localStorage.removeItem(THEME_KEY);else localStorage.setItem(THEME_KEY,t)}catch(e){}
  const g=root.closest('.gym');if(g){if(t==='auto')g.removeAttribute('data-theme');else g.setAttribute('data-theme',t)}
  const b=$('#themebtn');if(b){b.innerHTML=isDark()?SUN_IC:MOON_IC;b.title=isDark()?'Usar tema claro':'Usar tema escuro'}
}
applyTheme(getTheme());
$('#themebtn').addEventListener('click',()=>{applyTheme(isDark()?'light':'dark');if(!$('#v-me').classList.contains('hidden'))renderMe()});
try{matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>applyTheme(getTheme()))}catch(e){}

/* ---------- profile: rank, streak, goal, levels, badges ---------- */
function renderMe(){
  updateHeader();
  const r=rankOf(S.xp),st=liveStreak(),mu=mult(st),nm=nextMult(st),d=dayXpNow(),ms=MILESTONES.find(m=>m>st);
  // Calendar week, Sunday to Saturday: today is outlined, days still to come are faded.
  const week=[],td=new Date(),wd=td.getDay();for(let k=0;k<7;k++){const x=new Date(td.getFullYear(),td.getMonth(),td.getDate()-wd+k),ds=dayStr(x);week.push('<span class="wd'+(S.days.includes(ds)?' on':'')+(k===wd?' now':'')+(k>wd?' future':'')+'" title="'+x.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'numeric'})+'"><i>'+'DSTQQSS'[k]+'</i></span>')}
  $('#v-me').innerHTML=
   '<section class="rankcard"><small>Sua patente</small><h1>'+esc(r.name)+'</h1><div class="prog"><i style="width:'+(r.pct*100)+'%"></i></div><p>'+(r.next?'<b>'+S.xp+'</b> xp · faltam <b>'+(r.next-S.xp)+'</b> para '+esc(r.nextName):'<b>'+S.xp+'</b> xp · topo da carreira!')+'</p></section>'+
   '<div class="mecols">'+
   '<section class="mecard"><h3>🔥 Ofensiva</h3><p class="bign">'+st+'<span> '+(st===1?'dia':'dias')+'</span></p><div class="week">'+week.join('')+'</div>'+
     '<ul class="perks"><li><span>Bônus de XP agora</span><b>'+(mu>1?pct(mu):'nenhum')+'</b></li>'+(nm?'<li><span>Com '+nm[0]+' dias</span><b>'+pct(nm[1])+'</b></li>':'')+
     '<li><span>Proteções 🛡️</span><b>'+S.freezes+'/'+MAX_FREEZES+'</b></li>'+(ms?'<li><span>Próximo marco: '+ms+' dias</span><b>+'+ms*5+' xp</b></li>':'')+'</ul>'+
     '<p class="note">Cada 7 dias seguidos dão uma proteção. Se você faltar um dia, ela é usada sozinha e a ofensiva continua.</p></section>'+
   '<section class="mecard"><h3>🎯 Meta diária</h3><div class="goalbar"><div class="gl"><span>Hoje</span><b>'+Math.min(d,S.goal)+'/'+S.goal+' xp</b></div><div class="prog"><i style="width:'+Math.min(100,d/S.goal*100)+'%"></i></div></div>'+
     '<div class="goalpick">'+GOALS.map(([g,n])=>'<button class="pill" data-goal="'+g+'" aria-pressed="'+(S.goal===g)+'">'+n+'<small>'+g+' xp</small></button>').join('')+'</div>'+
     '<p class="note">Bater a meta dá +10 xp. Você já bateu '+S.goals+(S.goals===1?' vez':' vezes')+'.</p></section>'+
   '</div>'+
   '<h2 class="sec">Tema</h2><div class="themepick">'+[['auto','Automático'],['light','Claro'],['dark','Escuro']].map(([k,n])=>'<button class="pill" data-theme-pick="'+k+'" aria-pressed="'+(getTheme()===k)+'">'+n+'</button>').join('')+'</div>'+
   '<h2 class="sec">O que sua patente libera</h2><div class="perktable">'+AI_TIERS.map((t,k)=>{const nx=AI_TIERS[k+1],cur=S.xp>=t.xp&&(!nx||S.xp<nx.xp),got=S.xp>=t.xp;
     const sc=SCEN.filter(x=>x.xp&&x.xp>=t.xp&&(!nx||x.xp<nx.xp)).map(x=>x.t);
     return '<div class="ptier'+(cur?' cur':'')+(got?' got':'')+'"><span class="pr">'+(got?'':'🔒 ')+esc(rankForXp(t.xp))+'<small>'+t.xp+' xp</small></span><span class="pv"><b>'+t.limit+'</b> mensagens/dia com a IA'+(sc.length?'<small>+ conversa: '+esc(sc.join(', '))+'</small>':'')+'</span>'+(cur?'<span class="you">você</span>':'')+'</div>'}).join('')+'</div>'+
   '<h2 class="sec">Níveis</h2><div class="lvlist">'+LEVELS.map((V,lv)=>{const ls=LESSONS.filter(l=>l.lv===lv),dn=ls.filter(l=>S.lessons[l.id]).length,op=lv<=openLv();
     return '<div class="lvrow'+(op?'':' locked')+'"><span class="lvtag">'+V.tag+'</span><span class="lvt"><b>'+esc(V.t)+'</b><span class="s">'+(op?dn+'/'+ls.length+' aulas':'Bloqueado')+'</span></span><div class="prog"><i style="width:'+(dn/ls.length*100)+'%"></i></div></div>'}).join('')+'</div>'+
   '<h2 class="sec">Conquistas <span class="cnt">'+S.badges.length+'/'+BADGES.length+'</span></h2><div class="badges">'+BADGES.map(b=>{const on=S.badges.includes(b.id);
     return '<div class="badge'+(on?' on':'')+'"><span class="be">'+b.e+'</span><b>'+esc(b.t)+'</b><span class="s">'+esc(b.d)+'</span></div>'}).join('')+'</div>';
}
$('#v-me').addEventListener('click',e=>{const tp=e.target.closest('[data-theme-pick]');if(tp){applyTheme(tp.dataset.themePick);renderMe();return}const b=e.target.closest('[data-goal]');if(b){S.goal=+b.dataset.goal;save();renderMe()}});
$('#rankchip').addEventListener('click',()=>showTab('me'));

// Badges earned by older saves (before gamification existed) are granted silently on load.
{const ev=[];checkBadges(ev);if(ev.length)save()}
renderBoard();renderLearn();renderHome();renderBook();renderChat();

const acctLabel=()=>{const a=$('#acct');if(!a)return;const l=deps.accountLabel();a.textContent=l;a.classList.toggle('av',deps.isAuthed()&&l.length<=2);a.setAttribute('aria-label',deps.isAuthed()?'Sua conta':'Entrar')};
$('#acct').addEventListener('click',()=>deps.account());
acctLabel();
return {
  destroy(){try{if(browserVoice())speechSynthesis.cancel()}catch(e){}try{if(dict)dict.stop()}catch(e){}root.innerHTML=''},
  setState(p){S=Object.assign(DEF(),p||{});checkBadges([]);renderBoard();renderLearn();renderHome();if(!$('#v-me').classList.contains('hidden'))renderMe()},
  refresh(){acctLabel();renderChat();renderHome();renderLearn();renderBoard()},
}
}

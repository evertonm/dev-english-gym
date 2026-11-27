// @ts-nocheck
// Dev English Gym engine: plain DOM app mounted by src/App.tsx.
// Talks to the backend only through the `deps` object, so it stays framework-agnostic.
import { WORLD_NAMES } from './worlds'
import { ic } from './icons'
import { placementLevel } from '../../shared/week'
import { APP_TABS, normalizedPath } from '../../shared/routes'
import { UNITS, LESSONS, LEVELS } from './data'
import { CONVERSATION_SCENARIOS as SCEN, conversationSuggestion } from '../../shared/conversation'
import { createSpeechPlayer } from './speech'
import { pronOf } from './pron'
import { WHY } from './why'
import { EXPLAIN } from './explain'
import { BOSSES } from './bosses'
import { BANK, seeded } from './bank'
import { XWORDS } from './xwords'
import { XWORDS2 } from './xwords2'
const XALL=[...XWORDS,...XWORDS2];
import { makeCrossword } from './xgen'
import { TERMO_ANSWERS, TERMO_EXTRA } from './termo-words'
import { EMOJI_IDIOMS } from './emoji-idioms'
import { brasiliaDay, isWorkoutId, WORKOUT_EVENTS, WORKOUT_IDS, workoutForDay } from '../../shared/workout'
import { WORKOUTS } from './workout'
import { addGuestCompletion, GUEST_PRACTICE_KEY, GUEST_PRACTICE_LIMIT, guestActivitiesFromProgress, guestRemaining, readGuestCompletions } from './guest-practice'
import type { LoginTarget, PracticeTarget } from './guest-practice'
import { bossAchievement, completedTopics, lessonShareTopic, practiceTechnique, quizTechniqueId, unitShareTopic } from './achievement'
import type { Achievement } from './achievement'
import { mountAchievementShare } from './achievement-share'
import { rememberBossTopics, savedBossTopicIds } from '../../shared/boss-topics'
import { highestUnlockedWorld, worldUnlocked } from './world-progression'
import { ADV_SHORT } from './data-advanced'
import { USA_SHORT } from './data-usa'
// Attach each question's explanation to it, so it travels with the question into board quizzes too.
const bossTopicLabels = new Map<string, string>();
for (const l of LESSONS) (l.q as any[]).forEach((q: any, i: number) => {
  q.why = (WHY[l.id] || [])[i] || '';
  const correct = q[0].includes('___') ? q[0].replace('___', q[1][0]) : q[1][0];
  const techniqueId = quizTechniqueId(l.id, correct);
  q.practiceTopicId = techniqueId ? 'technique-' + techniqueId : 'lesson-' + l.id;
  bossTopicLabels.set(q.practiceTopicId, lessonShareTopic(l));
})
for (const bank of BANK) for (const q of bank) {
  if (!q.why) continue;
  q.practiceTopicId = 'bank-' + Math.floor(seeded(q[0] + '\n' + q.why)() * 2 ** 32).toString(36);
  bossTopicLabels.set(q.practiceTopicId, q.why);
}
import { AI_TIERS, aiLimitFor } from '@convex/perks'

export type GymProgress = {
  xp: number; streak: number; last: string; units: Record<string, number>; lessons: Record<string, number>
  // Gamification (optional so older saves still load)
  goal?: number; dayXp?: number; dayKey?: string; freezes?: number; days?: string[]; badges?: string[]
  lvl?: number; chats?: number; reviews?: number; goals?: number
  board?: Record<string, number>; diceDay?: string; diceVal?: number
  termo?: { day: string; guesses: string[] }
}
export type AiResult = { ok: true; text: string } | { ok: false; code: string }
export type GymDeps = {
  initial: () => Partial<GymProgress> | null
  initialGuestProgress?: () => Partial<GymProgress> | null
  save: (p: GymProgress) => void
  isAuthed: () => boolean
  practiceAccess?: () => 'member' | 'guest' | 'restoring'
  login: (next?: LoginTarget, limited?: boolean) => void
  account: () => void
  accountLabel: () => string
  chat: (scenario: string, history: { role: 'user' | 'assistant'; content: string }[], level: number) => Promise<AiResult>
  conversationAccount?: () => string | null
  correct: (lessonId: string, text: string) => Promise<AiResult>
  addMistake: (wrong: string, better: string, tip: string) => void
  dueMistakes: () => { id: string; wrong: string; better: string; tip: string }[]
  reviewMistake: (id: string, ok: boolean) => void
  quota: () => AiQuota | null
  transcribe: (audio: ArrayBuffer, mime: string) => Promise<{ ok: boolean; text?: string; code?: string }>
  tts?: (text: string, lang: 'pt' | 'en') => Promise<{ ok: boolean; url?: string; code?: string }>
  push?: () => { status: string; hour: number }
  pushEnable?: (hour: number) => Promise<{ status: string; hour: number }>
  pushDisable?: () => Promise<{ status: string; hour: number }>
  track: (name: string, props?: string) => void
  open?: (panel: string) => void
}
export type AiQuota = { used: number; limit: number; rank: string; admin?: boolean; next: { xp: number; limit: number; rank: string } | null }
export type GymHandle = { destroy: () => void; setState: (p: Partial<GymProgress>) => void; refresh: () => void; reset: () => void; resumePractice: (target: LoginTarget) => void; startPlacement: () => void; getState: () => GymProgress; patch: (p: Partial<GymProgress>) => void }

// Bolha: the mascot, a speech bubble wearing a headset.
export const MASCOT = '<svg class="mascot" viewBox="0 0 120 120" aria-hidden="true"><path d="M14 46a46 40 0 0 1 92 0" fill="none" stroke="#1B2A5A" stroke-width="6" stroke-linecap="round"/><path d="M24 30h72a16 16 0 0 1 16 16v34a16 16 0 0 1-16 16H58l-20 16V96H24A16 16 0 0 1 8 80V46a16 16 0 0 1 16-16z" fill="#FFC93C" stroke="#1B2A5A" stroke-width="5" stroke-linejoin="round"/><rect x="4" y="46" width="14" height="26" rx="7" fill="#6684E6" stroke="#1B2A5A" stroke-width="4"/><rect x="102" y="46" width="14" height="26" rx="7" fill="#6684E6" stroke="#1B2A5A" stroke-width="4"/><circle cx="45" cy="58" r="7" fill="#1B2A5A"/><circle cx="75" cy="58" r="7" fill="#1B2A5A"/><circle cx="47.5" cy="55.5" r="2.4" fill="#fff"/><circle cx="77.5" cy="55.5" r="2.4" fill="#fff"/><circle cx="34" cy="71" r="5" fill="#FF8FA3" opacity=".8"/><circle cx="86" cy="71" r="5" fill="#FF8FA3" opacity=".8"/><path d="M50 72q10 10 20 0" fill="none" stroke="#1B2A5A" stroke-width="5" stroke-linecap="round"/></svg>';

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
    <h1 class="chat-title" tabindex="-1">Conversa com IA</h1>
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
const achievementShare = mountAchievementShare(root);
let sessionAchievement: Achievement | null = null;
// "How it sounds" line under an English sentence (US English, spelled for Brazilians).
const pronHtml=t=>{const p=pronOf(t);return p?'<span class="pron" title="Como soa no inglês americano. MAIÚSCULA = sílaba forte; dh/th = th com a língua entre os dentes; â = som neutro.">'+ic('speakerphone')+' '+esc(p)+'</span>':''};
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
let guestCompletions: PracticeTarget[] | null = null;

function readGuestPractice() {
  let stored = null;
  try { stored = localStorage.getItem(GUEST_PRACTICE_KEY) } catch {}
  if (guestCompletions === null) {
    if (stored !== null) guestCompletions = readGuestCompletions(stored);
    else {
      const quizKeys = LEVELS.flatMap((_, w) => worldTiles(w)
        .filter(t => ['quiz', 'sprint', 'rev', 'chefe'].includes(t.k))
        .map(t => t.key));
      const progress = deps.initialGuestProgress ? deps.initialGuestProgress() : S;
      writeGuestPractice(guestActivitiesFromProgress(progress ?? {}, quizKeys, WORKOUT_IDS));
    }
  } else if (stored !== null) {
    guestCompletions = readGuestCompletions(stored).reduce(addGuestCompletion, guestCompletions);
  }
  return guestCompletions;
}

function writeGuestPractice(completions: PracticeTarget[]) {
  guestCompletions = completions;
  try { localStorage.setItem(GUEST_PRACTICE_KEY, JSON.stringify(completions)) } catch {}
}

function allowPractice(target: LoginTarget) {
  const access = practiceAccess();
  if (access === 'member') return true;
  if (access === 'restoring') {
    toast('Estamos verificando sua sessão. Tente de novo em instantes.');
    return false;
  }
  if (guestRemaining(readGuestPractice()) > 0) return true;
  if (!$('#sess').classList.contains('hidden')) closeSession();
  deps.login(target, true);
  return false;
}

function completeGuestPractice(target: PracticeTarget) {
  if (practiceAccess() !== 'guest') return;
  const previous = readGuestPractice();
  const next = addGuestCompletion(previous, target);
  if (next !== previous) writeGuestPractice(next);
}

function practiceAccess() {
  return deps.practiceAccess?.() ?? (deps.isAuthed() ? 'member' : 'guest');
}
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
// Progression levels exclude "free" worlds (always open, e.g. the US intensive).
const PROG=LEVELS.filter(l=>!l.free).length;
const openLv=()=>highestUnlockedWorld(S.board, PROG);
const lvOpen=lv=>Boolean(LEVELS[lv] && (LEVELS[lv].free || worldUnlocked(S.board, lv)));
const count3=()=>Object.values(S.units).filter(n=>n>=3).length+Object.values(S.lessons).filter(n=>n>=3).length;
const BADGES=[
 {id:'first_lesson',e:'school',t:'Primeira aula',d:'Termine uma aula',ok:()=>Object.keys(S.lessons).length>0},
 {id:'first_train',e:'barbell',t:'Primeiro treino',d:'Termine um treino',ok:()=>Object.keys(S.units).length>0},
 {id:'stars3',e:'star',t:'Gabaritou',d:'Tire 3 estrelas em uma atividade',ok:()=>count3()>=1},
 {id:'stars10',e:'diamond',t:'Perfeccionista',d:'3 estrelas em 10 atividades',ok:()=>count3()>=10},
 {id:'streak3',e:'flame',t:'Esquentando',d:'3 dias seguidos',ok:()=>S.streak>=3},
 {id:'streak7',e:'calendar-week',t:'Uma semana',d:'7 dias seguidos',ok:()=>S.streak>=7},
 {id:'streak30',e:'comet',t:'Imparável',d:'30 dias seguidos',ok:()=>S.streak>=30},
 {id:'goal1',e:'target-arrow',t:'Meta batida',d:'Bata a meta diária',ok:()=>S.goals>=1},
 {id:'goal10',e:'target',t:'Constância',d:'Bata a meta 10 vezes',ok:()=>S.goals>=10},
 {id:'lv0',e:'medal-2',t:'Básico concluído',d:'Todas as aulas do Básico',ok:()=>levelDone(0)},
 {id:'lv1',e:'medal-2',t:'Intermediário concluído',d:'Todas as aulas do Intermediário',ok:()=>levelDone(1)},
 {id:'lv2',e:'medal',t:'Avançado concluído',d:'Todas as aulas do Avançado',ok:()=>levelDone(2)},
 {id:'lv3',e:'award',t:'Fluente',d:'Todas as aulas do Fluente (C1)',ok:()=>levelDone(3)},
 {id:'lv4',e:'trophy',t:'Proficiente',d:'Todas as aulas do Proficiente (C2)',ok:()=>levelDone(4)},
 {id:'skip',e:'rocket',t:'Já sabia',d:'Passe num teste de nivelamento',ok:()=>(S.lvl||0)>0},
 {id:'chat10',e:'message-circle',t:'Desenrolado',d:'Mande 10 mensagens pra IA',ok:()=>S.chats>=10},
 {id:'review10',e:'brain',t:'Aprende com o erro',d:'Revise 10 erros',ok:()=>S.reviews>=10},
 {id:'xp1000',e:'bolt',t:'Mil XP',d:'Junte 1.000 XP',ok:()=>S.xp>=1000},
 {id:'senior',e:'crown',t:'Sênior',d:'Chegue à patente Sênior',ok:()=>S.xp>=1500},
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
  if(e.k==='goal')return ic('target-arrow')+' Meta diária batida! +'+e.xp+' xp';
  if(e.k==='milestone')return ic('flame:f')+' Ofensiva de '+e.n+' dias! +'+e.xp+' xp';
  if(e.k==='shield')return ic('shield-check')+' Ganhou uma proteção de ofensiva';
  if(e.k==='freeze')return ic('shield-check')+' Proteção usada: sua ofensiva foi salva';
  if(e.k==='rank')return ic('trending-up')+' Promovido a '+e.name+'!'+(e.ai?' Agora '+e.ai+' mensagens/dia com a IA.':'')+(e.sc&&e.sc.length?' Nova conversa: '+e.sc.join(', ')+'.':'');
  if(e.k==='level')return ic('lock-open')+' '+LVNAME(e.lv)+' liberado!';
  if(e.k==='badge')return ic(e.b.e)+' Conquista: '+e.b.t;
  return '';
}
function rewardsHtml(r,fail){
  if(fail)sfx('no');
  else{const big=r.ev.some(e=>e.k==='rank'||e.k==='level');sfx(big?'fanfare':'win');if(!big&&r.ev.some(e=>e.k==='goal'||e.k==='badge'||e.k==='milestone'))setTimeout(()=>sfx('ding'),650)}
  const rows=[];
  if(r.bonus)rows.push('<li><span>'+ic('flame:f')+' Bônus de ofensiva '+pct(r.mu)+'</span><b>+'+r.bonus+'</b></li>');
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
// One dice roll per device per day, whoever is signed in (signing out must not give a free re-roll).
const DICE_DEV_KEY='devenglish-dice';
function deviceDice(){try{const d=JSON.parse(localStorage.getItem(DICE_DEV_KEY)||'{}');return{day:d.day||'',val:+d.val||0}}catch(e){return{day:'',val:0}}}
function todayHtml(){
  const d=dayXpNow(),g=Math.min(1,d/S.goal),st=liveStreak(),mu=mult(st);
  return '<section class="daily"><div class="dg"><div class="gl"><span>'+(d>=S.goal?ic('target-arrow')+' Meta de hoje batida!':'Meta de hoje')+'</span><b>'+Math.min(d,S.goal)+'/'+S.goal+' xp</b></div><div class="prog"><i style="width:'+(g*100)+'%"></i></div></div>'+
   '<div class="dchips"><span class="dchip fire">'+ic('flame:f')+' '+st+(st===1?' dia':' dias')+(mu>1?' · '+pct(mu)+' xp':'')+'</span><span class="dchip">'+ic('shield-check')+' '+S.freezes+'/'+MAX_FREEZES+(shielded()?' · protegendo':'')+'</span></div></section>';
}

/* ---------- voice: browser speech synthesis + recognition (free, no server) ---------- */
let voiceMode=false;
let sess=null,les=null,rev=null;
let chat={scen:null,msgs:[],items:[],busy:false,err:''};
const conversationInteractions=new Map();
const conversationInteractionKey=account=>'devenglish-conversation-practice:'+account;
function conversationLastInteraction(account){
  const recent=conversationInteractions.get(account)||0;
  try{return Math.max(recent,Number(localStorage.getItem(conversationInteractionKey(account)))||0)}catch(e){return recent}
}
function markConversationInteraction(){
  const account=deps.conversationAccount?.();if(!account)return;
  const time=Date.now();
  conversationInteractions.set(account,time);
  try{localStorage.setItem(conversationInteractionKey(account),String(time))}catch(e){}
}
// Conversation level follows the learner's open level (CEFR); they can pick a lower one.
const CHATLV_KEY='devenglish-chatlv';
const maxChatLevel=()=>(deps.quota()||{}).admin?PROG-1:openLv();
function chatLevel(){let v=-1;try{const r=localStorage.getItem(CHATLV_KEY);if(r!==null&&r!=='')v=+r}catch(e){}const mx=maxChatLevel();return v<0||v>mx?mx:v}
// What the mic heard goes into the box; the learner checks it (and fixes it) before sending.
const chatSink=text=>{const i=$('#say');i.value=(i.value+' '+text).trim();i.classList.add('heard');setTimeout(()=>i.classList.remove('heard'),1800);try{i.focus()}catch(e){}if(voiceMode)toast('Confira o texto e toque em enviar '+ic('arrow-right'))};
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
  const label=t==='ouvindo'?ic('microphone')+' Ouvindo… pode falar':t==='transcrevendo'?ic('hourglass')+' Transcrevendo…':t?ic('microphone')+' '+t+'…':'';
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
const canSpeak=()=>browserVoice()||Boolean(player&&deps.tts);
let enVoice=null;
let ptVoice=null;
const pickVoice=()=>{try{const vs=speechSynthesis.getVoices();enVoice=vs.find(v=>/en[-_]US/i.test(v.lang)&&/Google|Samantha|Natural/i.test(v.name))||vs.find(v=>/en[-_]US/i.test(v.lang))||null;
  ptVoice=vs.find(v=>/pt[-_]BR/i.test(v.lang)&&/Google|Luciana|Natural|Francisca|Thalita/i.test(v.name))||vs.find(v=>/pt[-_]BR/i.test(v.lang))||vs.find(v=>/^pt/i.test(v.lang))||null}catch(e){}};
try{if(browserVoice()){pickVoice();speechSynthesis.onvoiceschanged=pickVoice}}catch(e){}
// Lesson narration: the explanation in Portuguese, then each example in English and its translation.
// Starts by itself when a lesson card opens; the learner can turn it off (remembered on this device).
const NARR_KEY='devenglish-narration';
const narrOn=()=>{try{return localStorage.getItem(NARR_KEY)!=='off'}catch(e){return true}};
// Natural voice (OpenAI TTS, cached on the server) with the device voice as fallback.
const player=typeof Audio!=='undefined'?new Audio():null;
const voicePlayer=createSpeechPlayer(player,()=>{if(browserVoice())speechSynthesis.cancel()});
if(player){player.preload='auto';
  // iPhone only lets audio play after a tap: play a silent clip on the first touch to unlock the player.
  root.addEventListener('pointerdown',()=>{if(player.dataset.ok)return;player.dataset.ok='1';try{player.src='data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYwLjE2LjEwMAAAAAAAAAAAAAAA//NwwAAAAAAAAAAAAEluZm8AAAAPAAAABgAAAykAWlpaWlpaWlpaWlpaWlpaWnt7e3t7e3t7e3t7e3t7e3t7nJycnJycnJycnJycnJycnL29vb29vb29vb29vb29vb293t7e3t7e3t7e3t7e3t7e3t7/////////////////////AAAAAExhdmM2MC4zMQAAAAAAAAAAAAAAACQCowAAAAAAAAMpso+sIAAAAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NCxKMAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NAxKQAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/80LEowAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=';player.play().catch(()=>{})}catch(e){}},true)}
function stopAudio(){voicePlayer.stop()}
function playTTS(text,lang,{slow,done,fallback}){
  voicePlayer.play(lang+'|'+text,{
    rate:slow?0.72:1,
    done,
    fallback:browserVoice()?fallback:undefined,
    fetchUrl:deps.tts?async()=>{const result=await deps.tts(text.slice(0,900),lang);return result.ok?result.url:undefined}:undefined,
  });
}
function narrate(parts,done){
  const lines=parts.filter(([text])=>text);
  if(!lines.length){done();return}
  try{
    lines.forEach(([text,lang],index)=>{const u=new SpeechSynthesisUtterance(text);u.lang=lang==='pt'?'pt-BR':'en-US';
      const v=lang==='pt'?ptVoice:enVoice;if(v)u.voice=v;u.rate=lang==='pt'?1.02:0.9;
      if(index===lines.length-1){u.onend=done;u.onerror=done}
      speechSynthesis.speak(u)});
  }catch(e){done()}
}
function narrateCard(st,L){
  if(!narrOn()||!st||st.k!=='card')return;
  const x=(EXPLAIN[L.id]||[])[L.c.indexOf(st.c)]||st.c.pt;
  const parts=[[st.c.h+'. '+x,'pt']];
  if(st.c.ex.length){parts.push(['Por exemplo:','pt']);st.c.ex.slice(0,3).forEach(e=>{parts.push([sayable(e[0]),'en']);if(e[1]&&!/^(soa|igual|rima)/i.test(e[1]))parts.push([e[1],'pt'])})}
  const script=parts.map(([t])=>/[.!?:]$/.test(t)?t:t+'.').join(' ');
  playTTS(script,'pt',{fallback:done=>narrate(parts,done)});
}
function browserSpeak(text,slow,done){
  try{if(browserVoice()){const u=new SpeechSynthesisUtterance(text);u.lang='en-US';if(enVoice)u.voice=enVoice;u.rate=slow?0.6:0.92;if(done){u.onend=done;u.onerror=done}speechSynthesis.speak(u);return}}catch(e){}
  if(done)done();
}
function speak(text,slow,done){
  if(!text){stopAudio();if(done)done();return}
  playTTS(text,'en',{slow,done,fallback:finish=>browserSpeak(text,slow,finish)});
}
const sameText=(a,b)=>norm(a).join(' ')===norm(b).join(' ');
function listenForReply(){
  if(!voiceMode||!dict||listening||!chat.scen||chat.busy||les||sess||rev)return;
  if($('#v-chat').classList.contains('hidden'))return;
  dict.start().catch(()=>{});
}
function speakChatReply(text){
  const current=chat;
  speak(text,false,()=>setTimeout(()=>{if(chat===current)listenForReply()},250));
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
  if(q.admin)return '<p class="quota"><span>'+ic('message-circle')+' <b>Ilimitado</b> · conta admin ('+q.used+' hoje)</span></p>';
  const left=Math.max(0,q.limit-q.used);
  return '<p class="quota'+(left===0?' out':'')+'"><span>'+ic('message-circle')+' <b>'+left+'</b> de '+q.limit+' mensagens hoje</span>'+(q.next?'<span class="s">'+esc(q.next.rank)+' libera '+q.next.limit+'</span>':'')+'</p>';
}

/* ---------- home + phrasebook ---------- */
const starsHtml=n=>'<span class="stars" aria-label="'+n+' de 3 estrelas">'+[1,2,3].map(i=>i<=n?'<i>'+ic('star:f')+'</i>':ic('star:f')).join('')+'</span>';
function reviewHtml(){
  if(!deps.isAuthed())return '';
  const n=deps.dueMistakes().length;
  if(!n)return '<p class="note">Os erros que a IA corrigir nas conversas e nos textos aparecem aqui para você revisar.</p>';
  return '<section class="review"><span><b>Revisar meus erros</b><span class="s">'+n+(n===1?' frase para revisar hoje':' frases para revisar hoje')+'</span></span><button class="btn" data-review="1">Revisar</button></section>';
}
function levelHead(lv,done,total,what){
  const open=lvOpen(lv);
  return '<div class="lvhead'+(open?'':' locked')+'"><span class="lvtag">'+LEVELS[lv].tag+'</span><span class="lvt"><b>'+esc(LVNAME(lv))+'</b><span class="s">'+esc(LEVELS[lv].s)+' · '+done+'/'+total+' '+what+'</span></span>'+(open?'':'<span class="lock" role="img" aria-label="Bloqueado">'+ic('lock')+'</span>')+'</div>';
}
function lockedHtml(lv){
  return '<div class="lockbox"><span>Vença o chefão de '+esc(WORLD[lv-1])+' para entrar. Já sabe o conteúdo? Enfrente agora.</span><button class="btn alt" data-test="'+lv+'">Enfrentar o chefão de '+esc(WORLD[lv-1])+'</button></div>';
}
function renderHome(){
  updateHeader();
  const open=UNITS.map((u,i)=>i).filter(i=>canStartPractice(UNITS[i],'treino'));
  let nx=open.find(i=>!S.units[UNITS[i].id]);const all=nx===undefined;if(all)nx=open.find(i=>S.units[UNITS[i].id]<3);if(nx===undefined)nx=open[0];
  const u=UNITS[nx];
  $('#v-home').innerHTML=todayHtml()+reviewHtml()+
   (u?'<section class="today">'+MASCOT+'<small>'+(all?'Revisão, 5 minutos':'Treino de hoje, 5 minutos')+'</small><h1>'+esc(u.t)+'</h1><p>'+esc(u.s)+'. 10 exercícios, quase tudo no toque.</p><button class="go" data-start="'+nx+'">Começar</button></section>':'')+
   LEVELS.map((L,lv)=>{
     const list=UNITS.map((x,i)=>[x,i]).filter(([x])=>x.lv===lv),done=list.filter(([x])=>S.units[x.id]).length,isOpen=lvOpen(lv);
     return levelHead(lv,done,list.length,'treinos')+(isOpen?'':lockedHtml(lv))+'<div class="units'+(isOpen?'':' locked')+'">'+list.map(([x,i])=>
       '<button class="unit" '+(canStartPractice(x,'treino')?'data-start="'+i+'"':'disabled')+'><span class="n">'+(i+1)+'</span><span><span class="t">'+esc(x.t)+'</span><span class="s">'+esc(x.s)+'</span></span>'+starsHtml(S.units[x.id]||0)+'</button>').join('')+'</div>';
   }).join('');
}
function renderBook(){
  $('#v-book').innerHTML='<p class="note">Toque na frase para ouvir.</p>'+UNITS.map((u,ui)=>
   '<details class="pb"'+(ui===0?' open':'')+'><summary><span>'+esc(u.t)+' <span class="lvmini">'+LEVELS[u.lv].tag+'</span></span></summary>'+u.p.map((p,pi)=>
     '<button class="phrase" data-say="'+ui+'.'+pi+'"><span><span class="en">'+esc(p[0])+'</span>'+pronHtml(p[0])+'<span class="pt">'+esc(p[1])+'</span></span><span class="ico">'+SPK+'</span></button>').join('')+'</details>').join('');
}

/* ---------- training session ---------- */
function startSession(ui){
  if (!canStartPractice(UNITS[ui], 'treino')) return;
  if (!allowPractice('unit:' + UNITS[ui].id)) return;
  const order=shuffle([0,1,2,3,4,5,6,7]),types=['listen','gap','build','reverse'];
  const q=order.map((pi,i)=>({pi,type:types[i%4]}));
  q.push({pi:order[0],type:'build'},{pi:order[1],type:'listen'});
  sess={ui,queue:q,pos:0,right:0,total:q.length};
  openSess();renderEx();
}
function renderEx(){
  stopAudio(); // a new exercise never talks over the previous one
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
  completeGuestPractice('unit:' + u.id);
  const r=award(sess.right*10),gain=r.total;
  sessionAchievement = {
    title: 'Treino concluído!',
    description: 'Pratiquei ' + u.t + ' no Dev English Gym.',
    topics: [unitShareTopic(u)],
    technique: practiceTechnique(['unit-' + u.id]),
    result: '+' + gain + ' XP',
  };
  $('#bar').style.width='100%';
  $('#sbody').innerHTML='<div class="end">'+MASCOT+pushAsk()+'<div class="stars">'+[1,2,3].map(i=>i<=st?'<i>'+ic('star:f')+'</i>':ic('star:f')).join('')+'</div><p class="big">'+esc(u.t)+' feito!</p><div class="kv"><div><b>'+sess.right+'/'+sess.total+'</b>de primeira</div><div><b>+'+gain+'</b>xp</div></div>'+rewardsHtml(r)+'<p class="note">Agora use essas frases numa conversa de verdade com a IA.</p></div>';
  const fb=$('#fb');fb.className='fb';
  fb.innerHTML='<button class="btn" id="tochat">Praticar conversa</button><button class="btn alt" id="back">Voltar pra trilha</button>'+sessionShareButton();
  sess.over=true;
}

/* ---------- review of saved mistakes ---------- */
function startReview(){
  const list=deps.dueMistakes().slice(0,10);if(!list.length)return;
  rev={list,pos:0,right:0};openSess();renderRev();
}
function renderRev(){
  stopAudio(); // a new exercise never talks over the previous one
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
  $('#sbody').innerHTML='<div class="end">'+MASCOT+pushAsk()+'<p class="big">Revisão feita!</p><div class="kv"><div><b>'+rev.right+'/'+rev.list.length+'</b>certas</div><div><b>+'+gain+'</b>xp</div></div>'+rewardsHtml(r)+'<p class="note">As que você acertou voltam daqui a alguns dias. As que errou voltam amanhã.</p></div>';
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

// An open activity gets its own history entry, so the phone's back button closes it (and silences it).
let sessHist=false;
function openSess(){$('#sess').classList.remove('hidden');if(!sessHist){try{history.pushState({sess:1},'',location.pathname+location.search+'#atividade');sessHist=true}catch(e){}}}
function closeSession(fromHistory){
  achievementShare.close();
  sessionAchievement = null;
  const restoreWorkoutFocus = workout !== null;
  workout = null;
  if (restoreWorkoutFocus) {
    $('.app').inert = false;
    $('#sess').removeAttribute('aria-modal');
    $('#sess').setAttribute('aria-label', 'Treino');
  }
  if(sessHist){sessHist=false;if(!fromHistory&&location.hash==='#atividade'){try{history.replaceState(null,'',location.pathname+location.search)}catch(e){}}}
  xw=null;tm=null;emo=null;$('#sess').classList.add('hidden');sess=null;les=null;rev=null;dictSink=chatSink;if(listening&&dict){try{dict.stop().catch(()=>{})}catch(e){}}stopAudio();renderHome();renderLearn();boardSel=null;renderBoard();
  if(restoreWorkoutFocus) $('[data-workout-start]')?.focus({preventScroll:true});
}

$('#sess').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;if(b.dataset.login){deps.login();return}if(workout){workoutClick(b);return}if(emo){emoClick(b);return}if(tm){tmClick(b);return}if(xw){xwClick(b);return}if(rev){revClick(b);return}if(les){lessonClick(b);return}if(!sess)return;
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
  $('#v-learn').innerHTML=todayHtml()+reviewHtml()+
   LEVELS.map((V,lv)=>{
     const ls=LESSONS.map((x,i)=>[x,i]).filter(([x])=>x.lv===lv),us=UNITS.map((x,i)=>[x,i]).filter(([x])=>x.lv===lv),isOpen=lvOpen(lv);
     const tiles=worldTiles(lv),dn=tiles.filter(t=>tileDone(t)).length;
     const row=(x,attr,kind,n,stars)=>'<button class="unit" '+(canStartPractice(x,kind)?attr:'disabled')+'><span class="n">'+n+'</span><span><span class="t">'+esc(x.t)+'</span><span class="s">'+esc(x.s)+'</span></span>'+starsHtml(stars)+'</button>';
     return '<div class="lvhead'+(isOpen?'':' locked')+'"><span class="lvtag">'+V.tag+'</span><span class="lvt"><b>'+esc(WORLD[lv])+'</b><span class="s">'+esc(LVNAME(lv))+' · '+dn+'/'+(tiles.length-1)+' casas</span></span>'+(isOpen?'<button class="btn alt mini" data-world="'+lv+'">Tabuleiro</button>':'<span class="lock" role="img" aria-label="Bloqueado">'+ic('lock')+'</span>')+'</div>'+
       (isOpen?'':lockedHtml(lv))+
       '<div class="units'+(isOpen?'':' locked')+'">'+ls.map(([x,i])=>row(x,'data-lesson="'+i+'"','aula','A',S.lessons[x.id]||0)).join('')+us.map(([x,i])=>row(x,'data-start="'+i+'"','treino','T',S.units[x.id]||0)).join('')+'</div>';
   }).join('');
}
// Skipping a world = beating the previous world's boss.
/* ---------- placement test (onboarding): 3 questions per level, A2 to C2 ---------- */
const PLACE_PER=3;
function startPlacement(){
  const qs=[];
  for(let w=0;w<PROG;w++){
    const pool=shuffle(LESSONS.filter(l=>l.lv===w).flatMap(l=>l.q).concat(BANK[w]||[])).slice(0,PLACE_PER);
    for(const q of pool){const c=q.slice();c._lv=w;if(q.practiceTopicId)c.practiceTopicId=q.practiceTopicId;qs.push(c)}
  }
  les={li:-1,L:{id:'placement',t:'Teste de nível',q:qs,c:[],w:null,sp:[]},place:{byLv:new Array(PROG).fill(0)},steps:qs.map(q=>({k:'quiz',q})),pos:0,right:0,wrote:false,spoke:0,busy:false,say:'',heard:''};
  try{deps.track('placement','start')}catch(e){}
  openSess();renderStep();
}
// Level = highest level reached with 2 of 3 right on it and on every level below.
function finishPlacement(){
  const byLv=les.place.byLv,lv=placementLevel(byLv,PROG-1);
  for(let w=0;w<lv;w++)S.board['w'+w+'t15']=1;
  if(lv>0)S.lvl=Math.max(S.lvl||0,lv);
  boardW=lv;
  const r=award(les.right*2),gain=r.total;
  try{deps.track('placement','lv'+lv);localStorage.setItem('gym.placed','1')}catch(e){}
  dictSink=chatSink;les.over=true;$('#bar').style.width='100%';
  const rows=byLv.map((n,w)=>'<li><span class="ptag">'+LEVELS[w].tag+'</span> '+esc(LEVELS[w].t)+' <b>'+n+'/'+PLACE_PER+'</b></li>').join('');
  $('#sbody').innerHTML='<div class="end">'+MASCOT+'<p class="big">Seu nível: '+esc(LEVELS[lv].tag)+' · '+esc(LEVELS[lv].t)+'</p>'+
    '<ul class="placelist">'+rows+'</ul><div class="kv"><div><b>'+les.right+'/'+les.L.q.length+'</b>certas</div><div><b>+'+gain+'</b>xp</div></div>'+
    '<p class="note">'+(lv>0?'Liberamos '+(lv===1?'o mundo':'os mundos até')+' '+esc(WORLD[lv])+'. Os mundos anteriores continuam abertos pra revisar quando quiser.':'Você começa pelo primeiro mundo. Ele vai rápido se você já sabe o básico.')+' Você pode refazer o teste no Perfil.</p></div>';
  const fb=$('#fb');fb.className='fb';fb.innerHTML='<button class="btn" id="back">Começar a trilha</button>';
  save();
}
function startTest(lv){
  if (lv>0 && LEVELS[lv]) startBoardQuiz(lv-1,worldTiles(lv-1)[15],true);
}
function startLesson(li){
  const L=LESSONS[li];
  if (!canStartPractice(L, 'aula')) return;
  if (!allowPractice('lesson:' + L.id)) return;
  const steps=[...L.c.map(c=>({k:'card',c})),...L.q.map(q=>({k:'quiz',q})),...(L.w?[{k:'write'}]:[]),...L.sp.map(t=>({k:'speak',t}))];
  les={li,L,steps,pos:0,right:0,wrote:false,spoke:0,busy:false,say:'',heard:''};
  openSess();renderStep();
}
const listenRow=()=>canSpeak()?'<div class="listen"><button class="play" data-act="say" aria-label="Ouvir">'+SPK+'</button><button class="pill" data-act="slow">Mais devagar</button></div>':'';
function renderStep(){
  const st=les.steps[les.pos],L=les.L;les.done=false;les.busy=false;les.heard='';les.say='';dictSink=chatSink;
  $('#bar').style.width=(les.pos/les.steps.length*100)+'%';
  const fb=$('#fb');fb.className='fb';let h='';
  if(st.k==='card'){
    const xpl=(EXPLAIN[L.id]||[])[L.c.indexOf(st.c)]||'';
    h=(canSpeak()?'<button class="narr" data-narr="1" aria-pressed="'+narrOn()+'">'+(narrOn()?ic('volume')+' Narração ligada':ic('volume-off')+' Narração desligada')+'</button>':'')+'<p class="ask">'+esc(st.c.h)+'</p><p class="rule">'+esc(st.c.pt)+'</p>'+(xpl?'<p class="xpl">'+esc(xpl)+'</p>':'')+'<div class="exs">'+st.c.ex.map((e,i)=>
      '<button class="phrase ex" data-ex="'+i+'"><span><span class="en">'+esc(e[0])+'</span>'+pronHtml(e[0])+'<span class="pt">'+esc(e[1])+'</span></span>'+(canSpeak()?'<span class="ico">'+SPK+'</span>':'')+'</button>').join('')+'</div>'+
      (canSpeak()?'<p class="note">Toque num exemplo para ouvir.</p>':'');
    fb.innerHTML='<button class="btn" id="lnext">Entendi</button>';
  }else if(st.k==='quiz'){
    const [q,o]=st.q,gap=q.includes('___');
    if(les.board&&les.board.kind==='chefe'&&BOSSES[les.board.w]){const B=BOSSES[les.board.w],hp=Math.max(0,1-les.right/les.board.need);
      h='<div class="bossbar">'+B.av+'<div class="bb"><b>'+esc(B.name)+'</b><span>'+esc(B.role)+'</span><div class="hp" aria-label="Vida do chefão"><i style="width:'+(hp*100)+'%"></i></div><small>'+(les.pos===0?esc(B.taunt):'Acerte '+Math.max(0,les.board.need-les.right)+' para vencer')+'</small></div></div>'}
    les.opts=shuffle(o);les.answer=les.opts.indexOf(o[0]);
    h+=gap?'<p class="ask">Complete a frase</p><div class="card"><span class="en">'+esc(q).replace('___','<span class="gap" id="gapslot">&nbsp;</span>')+'</span></div>':'<p class="ask">'+esc(q)+'</p>';
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
  if(st.k==='card')narrateCard(st,L);else if(st.k!=='speak'&&!les.say)stopAudio();
}
function showHeard(){
  const st=les.steps[les.pos],el=$('#heard');if(st.k!=='speak'||!el||!les.heard)return;
  const want=norm(st.t),got=norm(les.heard),hit=want.filter(w=>got.includes(w)).length,pc=Math.round(hit/want.length*100);
  el.innerHTML='O microfone entendeu: <span class="en">'+esc(les.heard)+'</span><br>'+pc+'% igual à frase.'+(pc<70?' Ouça de novo e tente outra vez.':' Boa.');
}
function speakState(){const r=$('#rec');if(r)r.textContent=listening?'Parar':(les.heard?'Gravar de novo':'Gravar minha fala');if(!listening)showHeard()}
function gradeQuiz(i){
  const st=les.steps[les.pos],[q,o,sayIt]=st.q,ok=i===les.answer,gap=q.includes('___');les.done=true;
  if(ok){
    les.right++;
    if (les.place && st.q._lv != null) les.place.byLv[st.q._lv]++;
    if (les.board?.kind === 'chefe' && st.q.practiceTopicId) {
      (les.board.topics ??= new Set()).add(st.q.practiceTopicId);
    }
  }
  root.querySelectorAll('#sbody .opt').forEach((x,k)=>{if(k===les.answer)x.classList.add('ok');else if(k===i)x.classList.add('no')});
  const g=$('#gapslot');if(g)g.textContent=o[0];
  const full=gap?q.replace('___',o[0]):o[0];
  les.say=sayIt||(gap||/[.?!]$/.test(o[0])?full.replace(/\s*\(.*?\)/,''):'');
  const fb=$('#fb');fb.className='fb '+(ok?'ok':'no');sfx(ok?'ok':'no');
  fb.innerHTML='<div class="v">'+(ok?'Isso aí!':'Quase. O certo é:')+'</div><div class="row"><span><span class="en">'+esc(full)+'</span>'+pronHtml(les.say||full)+'</span>'+(les.say&&canSpeak()?'<button class="ico" data-act="say" aria-label="Ouvir">'+SPK+'</button>':'')+'</div>'+(st.q.why?'<p class="why">'+ic('bulb')+' '+esc(st.q.why)+'</p>':'')+'<button class="btn" id="lnext">Continuar</button>';
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
  $('#sbody').innerHTML='<div class="end">'+MASCOT+pushAsk()+'<p class="big">'+(pass?esc(LEVELS[lv].t)+' liberado!':'Quase lá!')+'</p><div class="kv"><div><b>'+les.right+'/'+les.L.q.length+'</b>certas (precisa '+need+')</div><div><b>+'+gain+'</b>xp</div></div>'+rewardsHtml(r,!pass)+
    '<p class="note">'+(pass?'Você pulou direto para o '+esc(LVNAME(lv))+'.':'Faça as aulas do '+esc(LEVELS[lv-1].t)+' ou tente o teste de novo mais tarde.')+'</p></div>';
  const fb=$('#fb');fb.className='fb';fb.innerHTML='<button class="btn" id="back">Voltar</button>';
}
function finishBoard(){
  const b=les.board,n=les.L.q.length,pass=les.right>=b.need,first=!S.board[b.key];try{deps.track('board_done',b.kind+(pass?':ok':':fail'))}catch(e){}
  completeGuestPractice(b.kind === 'daily' ? 'game:daily' : 'board:' + b.key);
  if(pass)S.board[b.key]=1;
  if(pass&&b.kind==='chefe'&&b.topics){
    const evidence = [...b.topics];
    evidence.sort((a,b)=>Number(b.startsWith('technique-'))-Number(a.startsWith('technique-')));
    const labels = new Set();
    const distinct = evidence.filter(id=>{
      const label = bossTopicLabels.get(id);
      if (!label || labels.has(label)) return false;
      labels.add(label);
      return true;
    });
    rememberBossTopics(S.board,b.w,distinct);
  }
  if(pass&&b.kind==='chefe')setTimeout(()=>sfx('fanfare'),700);
  if(pass&&b.kind==='chefe'&&!LEVELS[b.w].free)S.lvl=Math.min(PROG-1,Math.max(S.lvl||0,b.w+1));
  const bonus=pass&&first?{quiz:10,sprint:15,rev:15,chefe:50,daily:40}[b.kind]||0:0;
  const r=award(les.right*5+bonus),gain=r.total;
  dictSink=chatSink;les.over=true;$('#bar').style.width='100%';
  const nextW=b.w+1<PROG?WORLD[b.w+1]:'';
  const title=pass?(b.kind==='chefe'?'Chefão derrotado!':b.kind==='daily'?'Desafio do dia concluído!':b.kind==='emoji'?'Emoji idioms: mandou bem!':'Casa concluída!'):'Quase lá!';
  const note=b.kind==='emoji'?(pass?(first?'Bônus de hoje garantido. Jogue mais rodadas para aprender novas expressões!':'Rodada extra feita. São quase 100 expressões!'):'Precisava de '+b.need+' acertos. Jogue outra rodada!'):b.kind==='daily'?(pass?(first?'Bônus de hoje garantido. Amanhã tem perguntas novas!':'Treino extra feito. Amanhã tem perguntas novas!'):'Precisava de '+b.need+' acertos. Tente de novo!'):pass?(b.kind==='chefe'?(nextW?nextW+' liberada! Seu peão já pode entrar no próximo mundo.':'Você zerou o jogo. Respeito!'):'Seu peão avança no tabuleiro.'):'Precisava de '+b.need+' acertos. Revise e tente de novo.';
  const B=b.kind==='chefe'?BOSSES[b.w]:null;
  sessionAchievement = pass && b.kind === 'chefe'
    ? worldBossAchievement(b.w, b.topics, { right: les.right, total: n, xp: gain })
    : null;
  const topics = sessionAchievement?.topics ?? [];
  const structure = sessionAchievement?.technique;
  const learned = topics.length || structure ? '<div class="boss-learned">'+
    (topics.length ? '<b>O que você praticou neste mundo</b><ul>'+topics.map(topic=>'<li>'+esc(topic)+'</li>').join('')+'</ul>' : '')+
    (structure ? '<p><b>Estrutura em inglês</b><br>'+esc(structure.pattern)+'<br><i lang="en">'+esc(structure.example)+'</i></p>' : '')+
    '</div>' : '';
  $('#sbody').innerHTML='<div class="end">'+(B?'<div class="bossend'+(pass?' down':'')+'">'+B.av+'</div><p class="bossline">'+esc(B.name)+': “'+esc(pass?B.win:B.lose)+'”</p>':MASCOT)+pushAsk()+'<p class="big">'+title+'</p><div class="kv"><div><b>'+les.right+'/'+n+'</b>certas (precisa '+b.need+')</div><div><b>+'+gain+'</b>xp</div></div>'+learned+rewardsHtml(r,!pass)+'<p class="note">'+esc(note)+'</p></div>';
  const certBtn=pass&&b.kind==='chefe'&&!LEVELS[b.w].free&&deps.open?'<button class="btn alt" data-panel="cert:'+b.w+'">'+ic('certificate')+' Emitir certificado</button>':'';
  const fb=$('#fb');fb.className='fb';fb.innerHTML='<button class="btn" id="back">Voltar ao tabuleiro</button>'+certBtn+sessionShareButton();
}
function finishLesson(){
  if(les.board){finishBoard();return}
  if(les.test){finishTest();return}
  if(les.place){finishPlacement();return}
  const L=les.L,st=les.right>=L.q.length?3:les.right>=L.q.length*.6?2:1;
  S.lessons[L.id]=Math.max(S.lessons[L.id]||0,st);try{deps.track('lesson_done',L.id)}catch(e){}
  completeGuestPractice('lesson:' + L.id);
  const r=award(les.right*10+(les.wrote?20:0)+les.spoke*5),gain=r.total;
  sessionAchievement = {
    title: 'Aula concluída!',
    description: 'Concluí a aula “' + L.t + '” na minha trilha de inglês para devs.',
    topics: [lessonShareTopic(L)],
    technique: practiceTechnique([L.id]),
    result: les.right + '/' + L.q.length + ' acertos · +' + gain + ' XP',
  };
  dictSink=chatSink;les.over=true;
  $('#bar').style.width='100%';
  $('#sbody').innerHTML='<div class="end">'+MASCOT+pushAsk()+'<div class="stars">'+[1,2,3].map(i=>i<=st?'<i>'+ic('star:f')+'</i>':ic('star:f')).join('')+'</div><p class="big">Aula feita: '+esc(L.t)+'!</p><div class="kv"><div><b>'+les.right+'/'+L.q.length+'</b>exercícios certos</div><div><b>+'+gain+'</b>xp</div></div>'+rewardsHtml(r)+'</div>';
  const fb=$('#fb');fb.className='fb';
  const nl=les.li+1;
  fb.innerHTML='<button class="btn" id="back">Voltar ao tabuleiro</button><button class="btn alt" id="tochat">Praticar conversa</button>'+sessionShareButton();
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
  if(b.dataset.narr){const on=!narrOn();try{localStorage.setItem(NARR_KEY,on?'on':'off')}catch(e){}
    b.setAttribute('aria-pressed',String(on));b.innerHTML=on?ic('volume')+' Narração ligada':ic('volume-off')+' Narração desligada';
    if(on)narrateCard(st,les.L);else stopAudio();return}
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
  const current=chat;
  chat.busy=true;chat.err='';renderChat();
  let r=null;
  try{r=await deps.chat(chat.scen,chat.msgs,chatLevel())}catch(e){r={ok:false,code:'ERROR'}}
  if(chat!==current)return;
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
    if(voiceMode&&o.reply){chat.busy=false;renderChat();speakChatReply(o.reply);return}
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
  const scene=SCEN.find(item=>item.id===id);
  if(!scene||(scene.xp&&S.xp<scene.xp&&!(deps.quota()||{}).admin))return;
  stopAudio();
  if(listening&&dict)dict.stop().catch(()=>{});
  markConversationInteraction();
  chat={scen:id,msgs:[],items:[],busy:false,err:''};
  $('#say').value='';
  if(!scene.opening){void turn();return}
  chat.msgs.push({role:'assistant',content:scene.opening.reply});
  chat.items.push({who:'ai',...scene.opening});
  renderChat();
  if(voiceMode)speakChatReply(scene.opening.reply);
}
function sendMsg(){
  const i=$('#say'),t=i.value.trim();if(!t||chat.busy||!chat.scen||!deps.isAuthed())return;
  if(chat.msgs.length>=60){chat.err='Essa conversa chegou ao fim. Escolha uma situação para começar outra.';renderChat();return}
  if(listening&&dict){try{dict.stop().catch(()=>{})}catch(e){}}
  i.value='';chat.items.push({who:'me',text:t.slice(0,600)});chat.msgs.push({role:'user',content:t.slice(0,600)});turn();
}
function renderChat(){
  const on=!$('#v-chat').classList.contains('hidden');
  const selected=SCEN.find(scene=>scene.id===chat.scen);
  $('#scen').innerHTML=(deps.isAuthed()?'<button class="pill vm" data-voice="1" aria-pressed="'+voiceMode+'">'+(voiceMode?'Voz ligada':'Modo voz')+'</button><label class="lvpick">Nível <select id="chatlv" aria-label="Nível da conversa">'+LEVELS.slice(0,maxChatLevel()+1).map((V,i)=>'<option value="'+i+'"'+(i===chatLevel()?' selected':'')+'>'+V.tag+' · '+esc(V.t)+'</option>').join('')+'</select></label>':'')+
    (selected?'<button class="pill" data-chat-end'+(chat.busy?' disabled':'')+'>Encerrar: '+esc(selected.t)+'</button>':'')+quotaHtml();
  let h=selected?'':conversationChoices();
  if(selected?.practice)h+='<p class="note">'+esc(selected.practice)+'</p>';
  h+=chat.items.map((m,k)=>{
    if(m.who==='me')return '<div class="msg me"><span class="en" lang="en">'+esc(m.text)+'</span></div>'+
      ((m.better||m.tip)?'<div class="fix">'+(m.better?'<small>Mais natural</small><span class="en" lang="en">'+esc(m.better)+'</span>':'')+(m.tip?'<span>'+esc(m.tip)+'</span>':'')+'</div>':'');
    const lastAi=k===chat.items.length-1;
    return '<div class="msg ai"><span class="en" lang="en">'+esc(m.reply)+'</span>'+(m.showPt&&m.pt?'<span class="pt">'+esc(m.pt)+'</span>':'')+(m.showHint&&m.hint?'<span class="pt">Você pode dizer:</span><span class="en" lang="en">'+esc(m.hint)+'</span>':'')+
      '<div class="tools">'+(canSpeak()?'<button data-m="say" data-k="'+k+'">Ouvir</button>':'')+(m.pt&&!m.showPt?'<button data-m="pt" data-k="'+k+'">Traduzir</button>':'')+(lastAi&&m.hint&&!m.showHint?'<button data-m="hint" data-k="'+k+'">Não sei o que dizer</button>':'')+'</div></div>';
  }).join('');
  if(chat.busy)h+='<div class="typing">digitando…</div>';
  else if(voiceMode&&listening)h+='<div class="typing">ouvindo… fale em inglês</div>';
  else if(voiceMode&&chat.scen)h+='<p class="note">Modo voz: a IA fala a resposta e o microfone abre sozinho. Toque no microfone se ele não abrir.</p>';
  if(chat.err)h+='<p class="note">'+esc(chat.err)+'</p>';
  $('#log').innerHTML=h;
  $('#composer').classList.toggle('hidden',!(on&&deps.isAuthed()&&chat.scen));
  if(on&&selected){const m=$('#v-chat');m.scrollTop=m.scrollHeight}
}

function conversationChoices(){
  const pills=interview=>SCEN.filter(scene=>Boolean(scene.interview)===interview).map(scene=>{
    const locked=scene.xp&&S.xp<scene.xp&&!(deps.quota()||{}).admin;
    return locked
      ? '<button class="pill lockd" data-lockscen="'+scene.id+'" title="Libera em '+esc(rankForXp(scene.xp))+'">'+ic('lock')+' '+esc(scene.t)+'</button>'
      : '<button class="pill" data-scen="'+scene.id+'">'+esc(scene.t)+'</button>';
  }).join('');
  return `<div class="chat-paths">
    <section aria-labelledby="chat-work">
      <h2 id="chat-work">Praticar situações de trabalho</h2>
      <p>Responda por texto ou voz. A IA faz o papel de um colega e sugere formas mais naturais de falar inglês.</p>
      <div class="chat-scenarios">${pills(false)}</div>
    </section>
    <section aria-labelledby="chat-interviews">
      <h2 id="chat-interviews">Preparar entrevistas internacionais</h2>
      <p>Treine etapas de um processo seletivo por área, da conversa com o recrutador à entrevista técnica. O simulador dá feedback e gera um relatório.</p>
      ${deps.open?'<button class="btn" data-panel="interview">Abrir simulador de entrevistas</button>':''}
      <div class="chat-scenarios" role="group" aria-label="Conversas curtas sobre carreira">${pills(true)}</div>
    </section>
  </div>${deps.open?'<button class="linkbtn" data-panel="tools">Abrir corretor de mensagens</button>':''}
    ${deps.isAuthed()?'':'<button class="btn alt" data-login="1">Entrar grátis para conversar</button>'}`;
}

$('#v-chat').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.login){deps.login();return}
  if(b.hasAttribute('data-chat-end')){
    if(chat.busy)return;
    stopAudio();
    if(listening&&dict)dict.stop().catch(()=>{});
    chat={scen:null,msgs:[],items:[],busy:false,err:''};
    renderChat();
    $('.chat-title').focus();
    return;
  }
  if(b.dataset.voice){
    if(!dict){chat.err='Seu navegador não reconhece voz. No celular, use o Chrome.';renderChat();return}
    voiceMode=!voiceMode;
    if(!voiceMode){stopAudio();if(listening)dict.stop()}
    renderChat();
    if(voiceMode){const last=chat.items[chat.items.length-1];if(last&&last.who==='ai')speakChatReply(last.reply)}
    return;
  }
  if(b.dataset.lockscen){const sc=SCEN.find(x=>x.id===b.dataset.lockscen);if(sc)toast(ic('lock')+' <b>'+esc(sc.t)+'</b> libera na patente '+esc(rankForXp(sc.xp))+' ('+sc.xp+' xp)');return}
  if(b.dataset.scen){startScen(b.dataset.scen);return}
  if(b.dataset.m){const m=chat.items[+b.dataset.k];if(!m)return;
    if(b.dataset.m==='say'){speak(m.reply);return}
    if(b.dataset.m==='pt')m.showPt=true;if(b.dataset.m==='hint')m.showHint=true;renderChat()}
});
$('#send').addEventListener('click',sendMsg);
root.addEventListener('click',e=>{
  const pa=e.target.closest('[data-pushask]');if(pa){const box=pa.closest('.pushask');
    if(pa.dataset.pushask==='yes'){if(box)box.remove();togglePush(true)}
    else{const a=askState();try{localStorage.setItem(ASK_KEY,JSON.stringify({n:(a.n||0)+1,until:Date.now()+3*864e5}))}catch(err){}if(box)box.remove()}
    return}
  const dly=e.target.closest('[data-daily]');if(dly){startDaily();return}
  const xwb=e.target.closest('[data-xword]');if(xwb){startXword();return}
  const tmb=e.target.closest('[data-termo]');if(tmb){startTermo();return}
  if(e.target.closest('[data-emoji]'))startEmoji();
});
root.addEventListener('click',e=>{
  const pn=e.target.closest('[data-panel]');if(pn&&deps.open){e.preventDefault();stopAudio();try{deps.track('tool_open',pn.dataset.panel.split(':')[0])}catch(err){}deps.open(pn.dataset.panel);return}
  const pl=e.target.closest('[data-placement]');if(pl){e.preventDefault();startPlacement()}
});
root.addEventListener('click',e=>{const b=e.target.closest('[data-login]');if(b&&!b.closest('#log')){e.preventDefault();deps.login()}});
$('#scen').addEventListener('change',e=>{if(e.target.id!=='chatlv')return;try{localStorage.setItem(CHATLV_KEY,e.target.value)}catch(err){}
  if(chat.scen&&!chat.busy){toast('Nível <b>'+esc(LEVELS[+e.target.value].tag)+'</b>: conversa recomeçada.');startScen(chat.scen)}});
$('#say').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();sendMsg()}});
$('#mic').addEventListener('click',()=>{
  if(!dict)return;
  if(listening){dict.stop().catch(()=>{});return}
  dict.start().catch(()=>{dict=null;$('#mic').classList.add('hidden')});
});

/* ---------- tabs ---------- */
// Each tab has its own URL, so refresh and the back button keep you where you were.
const tabFromPath=()=>{const p=normalizedPath(location.pathname);for(const k in APP_TABS)if(APP_TABS[k]===p)return k;return null};
function showTab(t,fromHistory){
  if(t!=='chat'&&!$('#v-chat').classList.contains('hidden')){stopAudio();if(listening&&dict){try{dict.stop().catch(()=>{})}catch(e){}}}
  if(!fromHistory&&APP_TABS[t]&&location.pathname!==APP_TABS[t]){try{history.pushState({tab:t},'',APP_TABS[t]+location.search)}catch(e){}}
  ['board','learn','home','chat','book','me'].forEach(n=>$('#v-'+n).classList.toggle('hidden',n!==t));
  root.querySelectorAll('nav.tabs button').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===t)));
  if(t==='home')renderHome();if(t==='learn')renderLearn();if(t==='me')renderMe();if(t==='board')renderBoard();
  renderChat();
}
root.querySelector('nav.tabs').addEventListener('click',e=>{const b=e.target.closest('button');if(b)showTab(b.dataset.tab)});
const onVis=()=>{if(document.hidden){stopAudio();if(listening&&dict){try{dict.stop().catch(()=>{})}catch(e){}}}else if(boardVisible()&&renderedWorkoutDay!==workoutDay())renderBoard()};
document.addEventListener('visibilitychange',onVis);
const onPop=()=>{
  if(sessHist&&location.hash!=='#atividade'&&!$('#sess').classList.contains('hidden')){closeSession(true);return}
  const t=tabFromPath();if(t)showTab(t,true)};
window.addEventListener('popstate',onPop);
$('#v-home').addEventListener('click',e=>{if(e.target.closest('[data-review]')){startReview();return}const tb=e.target.closest('[data-test]');if(tb){startTest(+tb.dataset.test);return}const b=e.target.closest('[data-start]');if(b)startSession(+b.dataset.start)});
$('#v-learn').addEventListener('click',e=>{if(e.target.closest('[data-review]')){startReview();return}const tb=e.target.closest('[data-test]');if(tb){startTest(+tb.dataset.test);return}const w=e.target.closest('[data-world]');if(w){boardW=+w.dataset.world;boardSel=null;mapOpen=true;showTab('board');return}const b=e.target.closest('[data-lesson]');if(b){startLesson(+b.dataset.lesson);return}const u=e.target.closest('[data-start]');if(u)startSession(+u.dataset.start)});
$('#v-book').addEventListener('click',e=>{const b=e.target.closest('[data-say]');if(b){const [u,p]=b.dataset.say.split('.');speak(UNITS[+u].p[+p][0])}});

/* ---------- board game: each level is a world with 16 squares around a ring ---------- */
const WORLD=WORLD_NAMES;
const SHORT={past:'Passado',present:'Presente',future:'Futuro',polite:'Educado',questions:'Perguntas',perfect:'Experiência',brmistakes:'Erros BR',stories:'Histórias',writing:'Escrita',sounds:'Pronúncia',conditionals:'Hipóteses',modals:'Modais',passive:'Passiva',phrasal:'Phrasal',tradeoffs:'Trade-offs',standup:'Daily',help:'Ajuda',review:'Review',meet:'Reuniões',bugs:'Bugs',intro:'Sobre você',story:'Casos',offer:'Proposta',pushback:'Negociar',design:'Design',...ADV_SHORT,...USA_SHORT};
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
// Die face showing n pips (1-6).
function DIE(n){
  const P={1:[[12,12]],2:[[8,8],[16,16]],3:[[7.5,7.5],[12,12],[16.5,16.5]],4:[[8,8],[16,8],[8,16],[16,16]],5:[[8,8],[16,8],[12,12],[8,16],[16,16]],6:[[8,7],[16,7],[8,12],[16,12],[8,17],[16,17]]}[n]||[];
  return '<svg class="die" viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="2.5" width="19" height="19" rx="4.5" fill="none" stroke="currentColor" stroke-width="2"/>'+P.map(([x,y])=>'<circle cx="'+x+'" cy="'+y+'" r="1.9" fill="currentColor"/>').join('')+'</svg>';
}
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
// C1: a district of tall glass towers.
const antenna=(x,y)=>'<path d="M'+x+' '+y+'v-14" stroke="hsl(var(--art-wood-lo))" stroke-width="1.6"/><circle cx="'+x+'" cy="'+(y-15)+'" r="2.2" fill="hsl(var(--art-light-hi))"/>';
const district=tree(30,138,.55)+tree(206,132,.6)+
  building(120,122,.8,8)+antenna(124,17)+building(76,140,.82,5)+building(166,137,.84,6)+
  building(44,154,.6,2)+building(196,152,.58,2)+
  shrub(98,150,.6)+shrub(150,152,.6)+lamp(92,166,.82)+lamp(146,160,.74)+bench;
// C2: a summit with a lookout tower and a flag at the top.
const peak='<path d="M34 142 104 44q16-14 30 0l72 98Z" fill="url(#map-side)"/><path d="M34 142 104 44q7-6 14-6l-8 104Z" fill="url(#map-wall)"/>'+
  '<path d="M96 56 104 44q16-14 30 0l9 12-10 6-8-7-9 9-7-8-8 7Z" fill="hsl(0 0% 100% / .92)"/>'+
  '<path class="art-masonry" d="M62 112l18-10m-6 26 20-12m46-8 16 10m-6 18 18 10"/>';
const summit=peak+turret(119,56,.5)+
  '<path d="M117 8v14" stroke="hsl(var(--art-wood-lo))" stroke-width="1.6"/><path d="m117 8 18 4-6 3 4 3-16-2Z" fill="url(#map-pane)"/>'+
  tree(40,146,.6)+tree(200,144,.62)+shrub(66,150,.7)+shrub(176,150,.7)+lamp(88,164,.8)+lamp(150,160,.74)+bench;
// US intensive: a skyline with a plane overhead.
const plane='<g transform="translate(150 34) rotate(-12)"><path d="M-26 0q0-4 6-4h34l10-9h6l-5 9h8l5-5h4l-3 7 3 7h-4l-5-5h-8l5 9h-6l-10-9h-34q-6 0-6-4Z" fill="hsl(var(--art-stone-hi))" stroke="hsl(var(--art-stone-edge))" stroke-width="1"/></g><path d="M40 52q50-14 92-12" fill="none" stroke="hsl(var(--art-stone-hi) / .6)" stroke-width="2" stroke-dasharray="4 5"/>';
const skyline=plane+tree(30,140,.55)+tree(207,136,.58)+building(92,128,.78,6)+antenna(96,32)+building(136,124,.74,7)+building(176,142,.8,4)+building(58,148,.66,3)+
  shrub(112,152,.6)+shrub(160,154,.6)+lamp(96,166,.8)+lamp(150,162,.74)+bench;
const ART=[village,city,tower,district,summit,skyline].map(scene=>'<svg viewBox="0 12 240 175" aria-hidden="true" focusable="false">'+artDefs+island+scene+'</svg>');


let boardW=null,boardSel=null,mapOpen=false;
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
  if(t.k==='start')return false;
  if(t.k==='aula')return !!S.lessons[t.id];
  if(t.k==='treino')return !!S.units[t.id];
  return !!S.board[t.key];
}
const FAMILY={start:'v',aula:'v',sprint:'v',chefe:'v',treino:'b',quiz:'b',rev:'b',bau:'g'};
const curIndex=tiles=>{const i=tiles.findIndex(t=>t.k!=='start'&&!tileDone(t));return i<0?tiles.length:i};
function canPlayTile(tile, tiles=worldTiles(tile.w)) {
  return lvOpen(tile.w) && tile.k!=='start' && (tileDone(tile) || tile.i===curIndex(tiles));
}
function canStartPractice(activity, kind) {
  if (!activity || !lvOpen(activity.lv)) return false;
  const tiles = worldTiles(activity.lv);
  const tile = tiles.find(t=>t.k===kind && t.id===activity.id);
  return !tile || canPlayTile(tile,tiles);
}
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
  if(t.k==='chefe'){const nx=t.w+1<PROG?WORLD[t.w+1]:'',B=BOSSES[t.w];return{title:B?'Chefão: '+B.name:'Chefão: prova final',sub:B?B.role:'',ex:B?B.quote:'',av:B?B.av:'',desc:'10 perguntas de todo o mundo. Acerte 8'+(nx?' e libere '+nx+'.':LEVELS[t.w].free?' para fechar o mundo.':' e zere o jogo.'),xp:XP.chefe,go:'Enfrentar '+(B?B.name:'chefão'),again:'Lutar de novo'}}
  return{title:'Início',ex:'',desc:'Sua jornada neste mundo começa aqui.',xp:'',go:'',again:''};
}
// Termo (Wordle-style) in English: one 5-letter word per day, 6 tries, shareable result.
let tm=null;const TM_KEY='devenglish-termo',TM_START=Date.UTC(2026,10,23);
let tmValid=null;
function tmWords(){
  if(tmValid)return tmValid;const v=new Set(TERMO_EXTRA);TERMO_ANSWERS.forEach(([w])=>v.add(w));
  const add=t=>String(t||'').toLowerCase().split(/[^a-z]+/).forEach(w=>{if(w.length===5)v.add(w)});
  XALL.forEach(([w])=>add(w));UNITS.forEach(u=>u.p.forEach(p=>add(p[0])));LESSONS.forEach(l=>{l.c.forEach(c=>c.ex.forEach(e=>add(e[0])));l.q.forEach(q=>{add(q[0]);(q[1]||[]).forEach(add)});l.sp.forEach(add)});
  BANK.forEach(lv=>lv.forEach(q=>{add(q[0]);(q[1]||[]).forEach(add)}));
  return tmValid=v;
}
function tmToday(){
  const [y,m,d]=today().split('-').map(Number),n=Math.max(0,Math.round((Date.UTC(y,m-1,d)-TM_START)/864e5));
  const rnd=seeded('termo-order'),order=TERMO_ANSWERS.map((x,i)=>[rnd(),i]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
  const [word,mean]=TERMO_ANSWERS[order[n%order.length]];return{word,mean,num:n+1};
}
function tmScore(guess,word){
  const res=Array(5).fill('x'),left={};
  for(let i=0;i<5;i++){if(guess[i]===word[i])res[i]='g';else left[word[i]]=(left[word[i]]||0)+1}
  for(let i=0;i<5;i++){if(res[i]==='g')continue;if(left[guess[i]]){res[i]='y';left[guess[i]]--}}
  return res;
}
function startTermo(){
  const t=tmToday();let saved=S.termo||{};
  if(saved.day!==today()){try{saved=JSON.parse(localStorage.getItem(TM_KEY)||'{}')}catch(e){}} // older versions kept it only here
  const guesses=saved.day===today()?(saved.guesses||[]).slice(0,6):[];
  if (!guesses.includes(t.word) && guesses.length < 6 && !allowPractice('game:termo')) return;
  sess=null;les=null;rev=null;xw=null;emo=null;
  tm={...t,guesses,cur:['','','','',''],over:false,won:false,msg:''};
  tm.won=guesses.includes(t.word);tm.over=tm.won||guesses.length>=6;
  openSess();renderTermo();tmFocus(0);
}
// Guesses go into the progress (saved to the account), so the game continues and stays locked on any device.
function tmSave(){S.termo={day:today(),guesses:tm.guesses.slice()};save();try{localStorage.setItem(TM_KEY,JSON.stringify(S.termo))}catch(e){}}
function renderTermo(){
  $('#bar').style.width=(tm.guesses.length/6*100)+'%';
  const rows=[];for(let r=0;r<6;r++){const g=tm.guesses[r],cur=r===tm.guesses.length&&!tm.over;const sc=g?tmScore(g,tm.word):null;
    rows.push('<div class="tmrow'+(cur?' active':'')+(cur&&tm.shake?' shake':'')+'">'+[0,1,2,3,4].map(i=>{
      if(cur)return '<input class="tmc tin'+(tm.cur[i]?' typed':'')+'" data-ti="'+i+'" value="'+esc((tm.cur[i]||'').toUpperCase())+'" maxlength="2" autocomplete="off" autocapitalize="characters" autocorrect="off" spellcheck="false" enterkeyhint="send" inputmode="text" aria-label="Letra '+(i+1)+'">';
      const ch=g?g[i]:'';return '<span class="tmc'+(sc?' s'+sc[i]:'')+'"'+(sc?' style="animation-delay:'+(i*90)+'ms"':'')+'>'+esc(ch.toUpperCase())+'</span>'}).join('')+'</div>')}
  const st={};tm.guesses.forEach(g=>tmScore(g,tm.word).forEach((r,i)=>{const k=g[i],p=st[k];if(r==='g'||(r==='y'&&p!=='g')||(!p))st[k]=r}));
  const kb='<div class="tmabc" aria-label="Letras já testadas">'+[...'abcdefghijklmnopqrstuvwxyz'].map(k=>'<span class="tml'+(st[k]?' s'+st[k]:'')+'">'+k.toUpperCase()+'</span>').join('')+'</div><button class="btn" data-tk="⏎">Enviar palavra</button>';
  let end='';
  if(tm.over){end='<div class="tmend">'+(tm.won?'<p class="big">'+(['Gênio!','Incrível!','Muito bem!','Boa!','Ufa, foi!','No limite!'][tm.guesses.length-1])+'</p>':'<p class="big">Não foi dessa vez</p>')+
    '<p class="tmword"><b>'+esc(tm.word.toUpperCase())+'</b> = '+esc(tm.mean)+(canSpeak()?' <button class="ico" data-tsay="1" aria-label="Ouvir">'+SPK+'</button>':'')+'</p>'+(tm.gain?'<p class="note">+'+tm.gain+' xp</p>':'')+
    '<p class="note">Amanhã tem palavra nova.</p></div>'}
  $('#sbody').innerHTML='<p class="ask">Termo em inglês #'+tm.num+'</p><p class="note">Descubra a palavra de 5 letras em inglês em 6 tentativas. 🟩 letra certa no lugar certo · 🟨 está na palavra, em outro lugar · ⬛ não está. Toque num quadrado para trocar a letra.</p><div class="tmgrid">'+rows.join('')+'</div>'+(tm.msg?'<p class="tmmsg">'+esc(tm.msg)+'</p>':'')+end+(tm.over?'':'<div class="tmkb">'+kb+'</div>');
  const fb=$('#fb');fb.className='fb';fb.innerHTML=tm.over?'<div class="xbtns"><button class="btn" data-tshare="1">'+ic('share')+' Compartilhar</button><button class="btn alt" id="back">Voltar</button></div>':'';
}
function tmFocus(i){const el=root.querySelector('#sbody .tin[data-ti="'+i+'"]');if(el){el.focus();try{el.select()}catch(e){}}}
function tmSubmit(){
  if(!tm||tm.over)return;tm.msg='';tm.shake=false;const w=tm.cur.join('');
  if(w.length<5){tm.msg='A palavra precisa de 5 letras.';tm.shake=true;sfx('no');renderTermo();tmFocus(Math.max(0,tm.cur.findIndex(x=>!x)));return}
  if(!tmWords().has(w)){tm.msg='Essa palavra não está na nossa lista.';tm.shake=true;sfx('no');renderTermo();tmFocus(4);return}
  tm.guesses.push(w);tm.cur=['','','','',''];tmSave();
  if(w===tm.word){tm.won=tm.over=true}else if(tm.guesses.length>=6)tm.over=true;
  if(tm.over)tmFinish();else sfx('tap');
  renderTermo();if(!tm.over)tmFocus(0);
}
function tmKey(k){if(k==='⏎'||k==='Enter')tmSubmit()}
$('#sbody').addEventListener('input',e=>{
  if(!tm||tm.over)return;const el=e.target.closest('.tin');if(!el)return;
  const i=+el.dataset.ti,ch=(el.value||'').toLowerCase().replace(/[^a-z]/g,'').slice(-1);
  tm.cur[i]=ch;el.value=ch.toUpperCase();el.classList.toggle('typed',!!ch);
  const m=root.querySelector('#sbody .tmmsg');if(m)m.remove();
  if(ch&&i<4)tmFocus(i+1);
});
$('#sbody').addEventListener('keydown',e=>{
  if(!tm||tm.over)return;const el=e.target.closest('.tin');if(!el)return;const i=+el.dataset.ti;
  if(e.key==='Enter'){e.preventDefault();tmSubmit()}
  else if(e.key==='Backspace'&&!el.value&&i>0){e.preventDefault();tm.cur[i-1]='';const p=root.querySelector('#sbody .tin[data-ti="'+(i-1)+'"]');if(p){p.value='';p.classList.remove('typed');tmFocus(i-1)}}
  else if(e.key==='ArrowLeft'&&i>0){e.preventDefault();tmFocus(i-1)}
  else if(e.key==='ArrowRight'&&i<4){e.preventDefault();tmFocus(i+1)}
});
// Keep the row being typed visible above the phone keyboard.
$('#sbody').addEventListener('focusin',e=>{if(!tm)return;const el=e.target.closest('.tin');if(el)setTimeout(()=>{try{el.closest('.tmrow').scrollIntoView({block:'center',behavior:'smooth'})}catch(err){}},250)});
function tmFinish(){
  completeGuestPractice('game:termo');
  const key='termo:'+today(),first=!S.board[key];
  if(first){S.board[key]=tm.won?1:2;if(tm.won){const r=award(30+(6-tm.guesses.length)*5);tm.gain=r.total}else save()}
  sfx(tm.won?'fanfare':'no');const w=tm.word;setTimeout(()=>{if(tm&&tm.word===w)speak(w)},400);
  try{deps.track('board_done','termo'+(tm.won?':ok':':fail'))}catch(e){}
}
async function tmShare(){
  const em={g:'🟩',y:'🟨',x:'⬛'};
  const txt='Dev English · Termo em inglês #'+tm.num+' '+(tm.won?tm.guesses.length:'X')+'/6\n\n'+tm.guesses.map(g=>tmScore(g,tm.word).map(r=>em[r]).join('')).join('\n')+'\n\n'+location.origin;
  try{if(navigator.share){await navigator.share({text:txt});return}}catch(e){if(e&&e.name==='AbortError')return}
  try{await navigator.clipboard.writeText(txt);toast('Resultado copiado! Cole onde quiser.')}catch(e){toast('Não consegui copiar.')}
}
function tmClick(b){
  if(b.id==='quit'||b.id==='back'){closeSession();return}
  if(b.dataset.tk){tmKey(b.dataset.tk);return}
  if(b.dataset.tshare){tmShare();return}
  if(b.dataset.tsay){speak(tm.word);return}
}


// Daily crossword: English answers, Portuguese clues, the same puzzle for everyone each day.
let xw=null;const XEN_KEY='devenglish-xword-lang';
function startXword(){
  if (!S.board['xword:'+today()] && !allowPractice('game:xword')) return;
  const P=makeCrossword(XALL,seeded('xword'+today()),7,11);
  sess=null;les=null;rev=null;
  const en=(()=>{try{return localStorage.getItem(XEN_KEY)==='en'}catch(e){return false}})();
  xw={P,fill:P.grid.map(r=>r.map(x=>x===null?null:'')),dir:'a',r:P.entries[0].r,c:P.entries[0].c,over:false,reveals:0,en,usedPt:!en};
  const st=S.board['xword:'+today()];
  if(st){xw.fill=P.grid.map(r=>r.slice());xw.over=true;xw.given=st===2} // done or answers seen today: answers only, no replay
  openSess();renderXword();
}
function xwEntryAt(r,c,dir){return xw.P.entries.find(e=>e.dir===dir&&(dir==='a'?e.r===r&&c>=e.c&&c<e.c+e.word.length:e.c===c&&r>=e.r&&r<e.r+e.word.length))}
function xwCells(e){return Array.from({length:e.word.length},(_,i)=>e.dir==='a'?[e.r,e.c+i]:[e.r+i,e.c])}
function renderXword(){
  const P=xw.P,nums={};P.entries.forEach(e=>nums[e.r+','+e.c]=e.num);
  const total=P.grid.flat().filter(x=>x!==null).length,filled=xw.fill.flat().filter(x=>x).length;
  $('#bar').style.width=(filled/total*100)+'%';
  const grid='<div class="xgrid" style="--cols:'+P.cols+'">'+P.grid.map((row,r)=>row.map((v,c)=>v===null?'<span class="xb"></span>':
    '<label class="xc" data-r="'+r+'" data-c="'+c+'">'+(nums[r+','+c]?'<small>'+nums[r+','+c]+'</small>':'')+'<input data-x="'+r+','+c+'" maxlength="2" value="'+esc((xw.fill[r][c]||'').toUpperCase())+'" autocomplete="off" autocapitalize="characters" autocorrect="off" spellcheck="false" inputmode="text" aria-label="Linha '+(r+1)+', coluna '+(c+1)+'"'+(xw.over?' readonly':'')+'></label>').join('')).join('')+'</div>';
  const list=d=>P.entries.filter(e=>e.dir===d).map(e=>'<button class="xclue" data-xe="'+P.entries.indexOf(e)+'"><b>'+e.num+'</b> '+esc(xw.en?e.en:e.clue)+' <small>('+e.word.length+')</small></button>').join('');
  const lang='<div class="xlang" role="group" aria-label="Idioma das dicas"><button class="pill" data-xl="pt" aria-pressed="'+!xw.en+'">Dicas em PT</button><button class="pill" data-xl="en" aria-pressed="'+xw.en+'">Clues in English · +50% XP</button></div>';
  $('#sbody').innerHTML='<p class="ask">Palavras-cruzadas do dia</p>'+(xw.over?'<p class="note">'+(xw.given?'Você viu as respostas de hoje. Amanhã tem uma cruzadinha nova!':'Você já completou a de hoje. Amanhã tem uma nova!')+'</p>':lang)+'<p class="note">'+(xw.en?'All in English: clues and answers. Tap a clue or a square and type.':'Dicas em português, respostas em inglês. Toque numa dica ou num quadrado e digite.')+(xw.en&&xw.usedPt?' <b>(o bônus de 50% vale só jogando do início ao fim em inglês)</b>':'')+'</p>'+grid+
    '<div class="xclues"><div><h3>'+(xw.en?'Across →':'Horizontais →')+'</h3>'+list('a')+'</div><div><h3>'+(xw.en?'Down ↓':'Verticais ↓')+'</h3>'+list('d')+'</div></div>';
  const fb=$('#fb');fb.className='fb';
  fb.innerHTML=xw.over?'<button class="btn" id="back">Voltar ao tabuleiro</button>':'<div class="xbtns"><button class="btn" data-xa="check">Verificar</button><button class="btn alt" data-xa="hint">Revelar letra</button><button class="btn alt" data-xa="give">Ver respostas</button></div>';
  xwHighlight();
}
function xwHighlight(){
  const e=xwEntryAt(xw.r,xw.c,xw.dir)||xwEntryAt(xw.r,xw.c,xw.dir==='a'?'d':'a');if(e)xw.dir=e.dir;
  const on=new Set(e?xwCells(e).map(([r,c])=>r+','+c):[]);
  root.querySelectorAll('#sbody .xc').forEach(l=>{const k=l.dataset.r+','+l.dataset.c;l.classList.toggle('on',on.has(k));l.classList.toggle('cur',k===xw.r+','+xw.c)});
  root.querySelectorAll('#sbody .xclue').forEach(b=>b.classList.toggle('on',e&&+b.dataset.xe===xw.P.entries.indexOf(e)));
}
function xwFocus(r,c){const i=root.querySelector('#sbody input[data-x="'+r+','+c+'"]');if(i){xw.r=r;xw.c=c;i.focus();try{i.select()}catch(err){}xwHighlight()}}
function xwStep(d){const e=xwEntryAt(xw.r,xw.c,xw.dir);if(!e)return;const cells=xwCells(e),i=cells.findIndex(([r,c])=>r===xw.r&&c===xw.c),n=cells[i+d];if(n)xwFocus(n[0],n[1])}
function xwSolved(){return xw.P.grid.every((row,r)=>row.every((v,c)=>v===null||xw.fill[r][c]===v))}
function xwFinish(given){
  completeGuestPractice('game:xword');
  xw.over=true;const key='xword:'+today(),first=!S.board[key];
  let r={total:0,ev:[]};
  const enBonus=xw.en&&!xw.usedPt;
  if(given){if(first){S.board[key]=2;save()}}
  if(!given){if(first)S.board[key]=1;const base=first?40+Math.max(0,xw.P.entries.length*5-xw.reveals*5):10;r=award(enBonus?Math.round(base*1.5):base);sfx('fanfare')}
  renderXword();
  $('#sbody').insertAdjacentHTML('afterbegin','<div class="end xend">'+MASCOT+'<p class="big">'+(given?'Respostas reveladas':'Cruzadinha completa!')+'</p>'+(given?'<p class="note">Como você viu as respostas, a de hoje fica fechada. Amanhã tem uma nova!</p>':'<div class="kv"><div><b>'+xw.P.entries.length+'</b>palavras</div><div><b>+'+r.total+'</b>xp'+(enBonus?' 🇺🇸':'')+'</div></div>'+(enBonus?'<p class="note">Bônus de 50% por jogar tudo em inglês!</p>':'')+rewardsHtml(r))+'</div>');
  $('#sbody').scrollTop=0;try{deps.track('board_done','xword'+(given?':give':':ok'))}catch(e){}
}
function xwClick(b){
  if(b.id==='quit'||b.id==='back'){closeSession();return}
  if(b.dataset.xl){const en=b.dataset.xl==='en';if(!en)xw.usedPt=true;xw.en=en;try{localStorage.setItem(XEN_KEY,en?'en':'pt')}catch(e){}const r=xw.r,c=xw.c;renderXword();xwFocus(r,c);return}
  if(b.dataset.xe!==undefined){const e=xw.P.entries[+b.dataset.xe];xw.dir=e.dir;const cells=xwCells(e),empty=cells.find(([r,c])=>!xw.fill[r][c])||cells[0];xwFocus(empty[0],empty[1]);return}
  const a=b.dataset.xa;if(!a||xw.over)return;
  if(a==='check'){
    let bad=0;root.querySelectorAll('#sbody .xc').forEach(l=>{const r=+l.dataset.r,c=+l.dataset.c,v=xw.fill[r][c],w=v&&v!==xw.P.grid[r][c];l.classList.toggle('bad',!!w);if(w)bad++});
    if(xwSolved())xwFinish(false);else{sfx(bad?'no':'tap');toast(bad?bad+(bad===1?' letra errada':' letras erradas')+' (em vermelho).':'Até aqui tudo certo! Falta completar.')}
  }else if(a==='hint'){
    // Reveal the selected square if it isn't right yet; otherwise the next missing letter (this word first).
    const ok=(r,c)=>xw.fill[r][c]===xw.P.grid[r][c];let t=null;
    if(!ok(xw.r,xw.c))t=[xw.r,xw.c];
    else{const e=xwEntryAt(xw.r,xw.c,xw.dir);t=(e?xwCells(e):[]).find(([r,c])=>!ok(r,c))||null;
      if(!t){for(const e2 of xw.P.entries){const m=xwCells(e2).find(([r,c])=>!ok(r,c));if(m){xw.dir=e2.dir;t=m;break}}}}
    if(!t)return;xw.reveals++;const [hr,hc]=t;xw.fill[hr][hc]=xw.P.grid[hr][hc];
    const i=root.querySelector('#sbody input[data-x="'+hr+','+hc+'"]');if(i){i.value=xw.fill[hr][hc].toUpperCase();i.parentElement.classList.add('rev');i.parentElement.classList.remove('bad')}
    if(xwSolved())xwFinish(false);else xwFocus(hr,hc);
  }else if(a==='give'){xw.fill=xw.P.grid.map(r=>r.slice());xwFinish(true)}
}
$('#sbody').addEventListener('input',e=>{
  if(!xw||xw.over)return;const i=e.target.closest('input[data-x]');if(!i)return;
  const [r,c]=i.dataset.x.split(',').map(Number),ch=(i.value||'').toLowerCase().replace(/[^a-z]/g,'').slice(-1);
  i.value=ch.toUpperCase();xw.fill[r][c]=ch;i.parentElement.classList.remove('bad');xw.r=r;xw.c=c;
  const total=xw.P.grid.flat().filter(x=>x!==null).length,filled=xw.fill.flat().filter(x=>x).length;$('#bar').style.width=(filled/total*100)+'%';
  if(ch){if(xwSolved()){xwFinish(false);return}xwStep(1)}
});
$('#sbody').addEventListener('keydown',e=>{
  if(!xw||xw.over)return;const i=e.target.closest('input[data-x]');if(!i)return;
  if(e.key==='Backspace'&&!i.value){e.preventDefault();xwStep(-1);const j=root.querySelector('#sbody input[data-x="'+xw.r+','+xw.c+'"]');if(j){j.value='';xw.fill[xw.r][xw.c]=''}}
  else if(e.key==='ArrowRight'){xw.dir='a';xwStep(1)}else if(e.key==='ArrowLeft'){xw.dir='a';xwStep(-1)}else if(e.key==='ArrowDown'){xw.dir='d';xwStep(1)}else if(e.key==='ArrowUp'){xw.dir='d';xwStep(-1)}
});
$('#sbody').addEventListener('focusin',e=>{if(!xw)return;const i=e.target.closest('input[data-x]');if(!i)return;const [r,c]=i.dataset.x.split(',').map(Number);
  if(r===xw.r&&c===xw.c&&xw._tap){xw.dir=xw.dir==='a'?'d':'a'}xw.r=r;xw.c=c;xw._tap=false;xwHighlight()});
$('#sbody').addEventListener('pointerdown',e=>{if(!xw)return;const i=e.target.closest('input[data-x]');if(!i)return;const [r,c]=i.dataset.x.split(',').map(Number);
  if(r===xw.r&&c===xw.c&&document.activeElement===i){xw.dir=xw.dir==='a'?'d':'a';xwHighlight()}});

// Emoji idioms: type the expression the emojis stand for. Hints cost points; 5 per round, bonus once a day.
const EMOJI_N=5;let emo=null;
const emNorm=t=>String(t||'').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9 ]+/g,' ').replace(/\b(a|an|the)\b/g,' ').replace(/\s+/g,' ').trim();
function emDist(a,b){const m=a.length,n=b.length,d=Array.from({length:m+1},(_,i)=>[i]);for(let j=1;j<=n;j++)d[0][j]=j;
  for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return d[m][n]}
function emOk(guess,ans){const g=emNorm(guess),a=emNorm(ans);if(!g)return false;return g===a||emDist(g,a)<=Math.max(1,Math.floor(a.length/10))}
// Hint 2: first letter of each word. Hint 3: the first half of each word.
function emPattern(ans,more){return ans.split(' ').map(w=>{const keep=more?Math.ceil(w.length/2):1;let n=0;return w.replace(/[a-z]/gi,ch=>(n++<keep)?ch:'_')}).join('   ')}
function startEmoji(){
  if (!allowPractice('game:emoji')) return;
  sess=null;les=null;rev=null;xw=null;tm=null;
  emo={list:shuffle(EMOJI_IDIOMS.slice()).slice(0,EMOJI_N),pos:0,pts:0,hints:0,state:'ask',msg:''};
  openSess();renderEmoji();
}
function renderEmoji(){
  const it=emo.list[emo.pos],[em,ans,pt,ex]=it;$('#bar').style.width=(emo.pos/EMOJI_N*100)+'%';
  let h='<p class="ask">Qual é a expressão? <small class="emcount">'+(emo.pos+1)+'/'+EMOJI_N+'</small></p><div class="emojiq" aria-label="Emojis">'+esc(em)+'</div>';
  if(emo.state==='ask'){
    const hints=[];if(emo.hints>=1)hints.push('<li>'+ic('bulb')+' Significado: <b>'+esc(pt)+'</b></li>');
    if(emo.hints>=2){const nw=ans.split(' ').length;hints.push('<li>'+ic('letter-case')+' '+nw+(nw===1?' palavra':' palavras')+': <span class="empat">'+esc(emPattern(ans,emo.hints>=3))+'</span></li>')}
    h+=(hints.length?'<ul class="emhints">'+hints.join('')+'</ul>':'')+
      '<input id="emin" class="eminput" placeholder="Digite em inglês…" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" lang="en" enterkeyhint="send" value="'+esc(emo.typed||'')+'">'+
      (emo.msg?'<p class="tmmsg">'+esc(emo.msg)+'</p>':'');
    $('#sbody').innerHTML=h;
    const fb=$('#fb');fb.className='fb';
    fb.innerHTML='<div class="xbtns"><button class="btn" data-em="ok">Responder</button><button class="btn alt" data-em="hint"'+(emo.hints>=3?' disabled':'')+'>'+ic('bulb')+' Dica (−1 ponto)</button><button class="btn alt" data-em="skip">Pular</button></div>';
    const i=$('#emin');if(i)setTimeout(()=>{try{i.focus()}catch(e){}},50);
  }else{
    const good=emo.state==='right';
    h+='<div class="card"><span class="en">'+esc(ans)+'</span>'+pronHtml(ans)+'<span class="pt">'+esc(pt)+'</span></div><p class="note">Ex.: <i>'+esc(ex)+'</i></p>';
    $('#sbody').innerHTML=h;
    const fb=$('#fb');fb.className='fb '+(good?'ok':'no');
    fb.innerHTML='<div class="v">'+(good?(emo.last===3?'Isso aí, sem dica! +3':emo.last>0?'Acertou! +'+emo.last:'Acertou, mas com todas as dicas (+0)'):'Essa era:')+'</div><button class="btn" data-em="next">'+(emo.pos+1<EMOJI_N?'Próxima':'Ver resultado')+'</button>';
  }
}
function emoAnswer(){
  const it=emo.list[emo.pos],i=$('#emin'),g=i?i.value:'';emo.typed=g;
  if(!emNorm(g)){emo.msg='Digite a expressão em inglês.';renderEmoji();return}
  // Each hint costs a point: 3 without hints, down to 0 after all three.
  if(emOk(g,it[1])){emo.last=Math.max(0,3-emo.hints);emo.pts+=emo.last;emo.state='right';sfx('ok');renderEmoji();speak(it[1]);}
  else{emo.msg='Ainda não. Tente de novo ou peça uma dica.';sfx('no');renderEmoji();const r=$('#emin');if(r){r.classList.add('shake');}}
}
function emoFinish(){
  completeGuestPractice('game:emoji');
  const key='emoji:'+today(),first=!S.board[key],pass=emo.pts>=7;
  if(pass&&first)S.board[key]=1;
  const r=award(emo.pts*3+(pass&&first?25:0));
  $('#bar').style.width='100%';
  $('#sbody').innerHTML='<div class="end">'+MASCOT+'<p class="big">'+(pass?'Mandou bem nos emojis!':'Boa tentativa!')+'</p><div class="kv"><div><b>'+emo.pts+'/'+(EMOJI_N*3)+'</b>pontos</div><div><b>+'+r.total+'</b>xp</div></div>'+rewardsHtml(r)+
    '<p class="note">'+(pass?(first?'Bônus de hoje garantido (+25). ':'')+'São quase 100 expressões: jogue outra rodada!':'Faça 7 pontos para ganhar o bônus do dia. Sem dica vale 3; cada dica tira 1 ponto.')+'</p></div>';
  const fb=$('#fb');fb.className='fb';fb.innerHTML='<div class="xbtns"><button class="btn" data-em="again">Outra rodada</button><button class="btn alt" id="back">Voltar</button></div>';
  try{deps.track('board_done','emoji'+(pass?':ok':':fail'))}catch(e){}
}
function emoClick(b){
  if(b.id==='quit'||b.id==='back'){closeSession();return}
  const a=b.dataset.em;if(!a)return;
  if(a==='ok')emoAnswer();
  else if(a==='hint'){const i=$('#emin');emo.typed=i?i.value:'';if(emo.hints<3){emo.hints++;emo.msg=''}renderEmoji()}
  else if(a==='skip'){emo.state='wrong';emo.last=0;sfx('no');renderEmoji();speak(emo.list[emo.pos][1])}
  else if(a==='next'){emo.pos++;emo.hints=0;emo.typed='';emo.msg='';emo.state='ask';if(emo.pos>=EMOJI_N)emoFinish();else renderEmoji()}
  else if(a==='again')startEmoji();
}
$('#sbody').addEventListener('keydown',e=>{if(emo&&emo.state==='ask'&&e.target.id==='emin'&&e.key==='Enter'){e.preventDefault();emoAnswer()}});

// Daily challenge: 7 questions from the bank (levels already open), the same for everyone each day.
const DAILY_N=7,DAILY_NEED=5;
function startDaily(){
  if (!allowPractice('game:daily')) return;
  const ol=openLv(),rnd=seeded('daily'+today());
  const all=[];for(let lv=0;lv<=ol;lv++)if(lvOpen(lv))all.push(...(BANK[lv]||[]));
  const pool=all.map(q=>[rnd(),q]).sort((a,b)=>a[0]-b[0]).slice(0,DAILY_N).map(x=>x[1]);
  les={li:-1,L:{id:'daily',t:'Desafio do dia',q:pool,c:[],w:null,sp:[]},board:{w:ol,key:'daily:'+today(),kind:'daily',need:DAILY_NEED},steps:pool.map(q=>({k:'quiz',q})),pos:0,right:0,wrote:false,spoke:0,busy:false,say:'',heard:''};
  openSess();renderStep();
}
function quickGames() {
  return `<section class="quick-games" aria-labelledby="quick-games-title">
    <h2 id="quick-games-title">Jogos rápidos</h2>
    <div class="quick-games-list">
      ${[['termo', 'keyboard', 'Termo'], ['xword', 'puzzle', 'Palavras-cruzadas'],
         ['emoji', 'mood-smile', 'Emojis'], ['daily', 'target-arrow', 'Desafio do dia']].map(([id, icon, label]) =>
        `<button class="quick-game" data-${id}="1"><span aria-hidden="true">${ic(icon)}</span>${label}${
          S.board[id + ':' + today()] ? '<span class="quick-game-done" title="Já jogou hoje">'+ic('check')+'<span class="sr-only">Já jogou hoje</span></span>' : ''
        }</button>`
      ).join('')}
    </div>
  </section>`;
}
function startBoardQuiz(w,t,placement=false){
  if (!t || (!placement && !canPlayTile(t))) return;
  if (!allowPractice((placement ? 'placement:' : 'board:') + t.key)) return;
  const n={quiz:3,sprint:5,rev:6,chefe:10}[t.k],need={quiz:2,sprint:4,rev:4,chefe:8}[t.k];
  // Lesson questions plus the extra bank for this world, so replays keep changing.
  const pool=shuffle(LESSONS.filter(l=>l.lv===w).flatMap(l=>l.q).concat(BANK[w]||[])).slice(0,n);
  const title={quiz:'Quiz relâmpago',sprint:'Sprint',rev:'Revisão: '+WORLD[w],chefe:'Chefão: '+WORLD[w]}[t.k];
  les={li:-1,L:{id:t.key,t:title,q:pool,c:[],w:null,sp:[]},board:{w,key:t.key,kind:t.k,need},steps:pool.map(q=>({k:'quiz',q})),pos:0,right:0,wrote:false,spoke:0,busy:false,say:'',heard:''};
  openSess();renderStep();
}
function rankHud(){
  const r=rankOf(S.xp);
  return '<div class="bhud"><div class="gl"><span>'+esc(r.name)+'</span><b>'+S.xp+(r.next?' / '+r.next:'')+' XP</b></div><div class="prog"><i style="width:'+(r.pct*100)+'%"></i></div></div>';
}
/* ---------- guided work practice ---------- */
let workout = null;
let lastWorkoutOffer = '';
let renderedWorkoutDay = 0;
let workoutRefreshTimer = 0;
const workoutDay = () => Number(brasiliaDay(Date.now()).replaceAll('-', ''));
const trackWorkout = (event, id) => {
  try { deps.track(event, id) } catch {}
};

function scheduleWorkoutRefresh() {
  const now = Date.now();
  const nextDay = Date.parse(brasiliaDay(now) + 'T03:00:00Z') + 86_400_000;
  workoutRefreshTimer = setTimeout(() => {
    if (boardVisible()) renderBoard();
    scheduleWorkoutRefresh();
  }, nextDay - now);
}

function todayCard(workoutId, next, remaining) {
  const info = next && tileInfo(next);
  const action = next ? `data-practice-tile="${next.key}"` : `data-workout-start="${workoutId}"`;
  const button = remaining === 0 && next?.k !== 'bau' ? 'Entrar para continuar' :
    (info?.go || (S.board[workoutId] ? 'Praticar de novo' : 'Começar treino'));
  const meta = info?.xp.split(' · ')[0] || '3 min';
  const note = remaining === null ? '' : remaining === 0
    ? 'Você concluiu as atividades grátis de visitante.'
    : `${remaining} de ${GUEST_PRACTICE_LIMIT} atividades grátis sem login.`;
  return `<section class="today-practice" aria-labelledby="today-practice-title">
    <div class="today-label">${MASCOT}<span>Hoje</span></div>
    <h2 id="today-practice-title">${esc(info?.title ?? WORKOUTS[workoutId].title)}</h2>
    <p>${esc(info?.sub || info?.desc || (next ? 'Avance para a próxima casa do seu mundo.' : 'Escreva em inglês e compare com um exemplo comentado.'))}</p>
    <span class="today-duration">${next ? esc(meta) : 'Code review · 3 min'}</span>
    <button class="btn" ${action}>${esc(button)} ${ARROW}</button>
    ${note ? '<p class="today-allowance">' + note + '</p>' : ''}
    ${next ? `<button class="today-extra" data-workout-start="${workoutId}">Praticar code review</button>` : ''}
  </section>`;
}

function startWorkout(id) {
  if (!allowPractice('workout:' + id)) return;
  workout = { id, answer: '', stage: 'write', submitted: false, xp: 0 };
  trackWorkout(WORKOUT_EVENTS.started, id);
  $('.app').inert = true;
  $('#sess').setAttribute('aria-label', 'Treino de code review');
  $('#sess').setAttribute('aria-modal', 'true');
  openSess();
  renderWorkout();
}

function renderWorkout() {
  const { id, answer, stage, xp } = workout;
  const { title, context, comment, task, example, checklist, skill } = WORKOUTS[id];
  const body = $('#sbody');
  const footer = $('#fb');
  footer.className = 'fb';
  $('#bar').style.width = stage === 'write' ? '33%' : stage === 'feedback' ? '67%' : '100%';
  if (stage === 'write') {
    body.innerHTML = `<h2 id="workout-heading" class="workout-heading" tabindex="-1">${esc(title)}</h2>
      <p class="note">${esc(context)}</p>
      <blockquote class="card workout-quote"><span class="en" lang="en">${esc(comment)}</span></blockquote>
      <form id="workout-form" class="workout-form">
        <label for="workout-answer">Sua resposta em inglês</label>
        <p id="workout-task" class="note">${esc(task)}</p>
        <textarea id="workout-answer" lang="en" aria-describedby="workout-task" rows="4" maxlength="600" required>${esc(answer)}</textarea>
      </form>`;
    footer.innerHTML = '<button class="btn" type="submit" form="workout-form">Ver exemplo comentado</button>';
  } else if (stage === 'feedback') {
    body.innerHTML = `<h2 id="workout-heading" class="workout-heading" tabindex="-1">Compare sua resposta</h2>
      <div class="card"><span class="pt">Sua resposta</span><span class="en workout-response" lang="en">${esc(answer)}</span></div>
      <div class="card"><span class="pt">Uma resposta possível</span><span class="en" lang="en">${esc(example)}</span></div>
      <ul class="workout-checklist">${checklist.map(item => '<li>' + esc(item) + '</li>').join('')}</ul>`;
    footer.innerHTML = '<button class="btn" type="button" data-workout-action="finish">Concluir treino</button><button class="btn alt" type="button" data-workout-action="retry">Editar minha resposta</button>';
  } else {
    body.innerHTML = `<h2 id="workout-heading" class="workout-heading" tabindex="-1">Code review praticado!</h2>
      <div class="card"><span class="pt">Você praticou</span><span class="en">${esc(skill)}</span></div>
      ${xp ? '<p class="note">+' + xp + ' XP</p>' : ''}
      ${id === WORKOUT_IDS[0] && workoutForDay(S.board, workoutDay()) === id ? '<p class="note">Volte amanhã para testar a mesma habilidade em outro PR.</p>' : ''}
      ${pushAsk()}`;
    footer.innerHTML = `<button class="btn" type="button" id="back">Voltar ao tabuleiro</button>
      <button class="btn alt" type="button" data-workout-action="chat">${deps.isAuthed() ? 'Praticar com a IA' : 'Entrar para praticar com a IA'}</button>
      ${sessionShareButton()}`;
  }
  body.scrollTop = 0;
  $('#workout-heading').focus({preventScroll:true});
}

$('#sess').addEventListener('input', e => {
  if (e.target.id === 'workout-answer') e.target.setCustomValidity('');
});
$('#sess').addEventListener('submit', e => {
  if (!workout || e.target.id !== 'workout-form') return;
  e.preventDefault();
  const field = $('#workout-answer');
  const answer = field.value.trim();
  if (!answer) {
    field.setCustomValidity('Escreva uma resposta em inglês para continuar.');
    field.reportValidity();
    return;
  }
  if (!workout.submitted) trackWorkout(WORKOUT_EVENTS.submitted, workout.id);
  Object.assign(workout, { answer, stage: 'feedback', submitted: true });
  renderWorkout();
});
$('#sess').addEventListener('keydown', e => {
  if (workout && e.key === 'Escape') {
    e.preventDefault();
    closeSession();
  }
});

function workoutClick(button) {
  if (button.id === 'quit' || button.id === 'back') {
    closeSession();
    return;
  }
  if (button.dataset.workoutAction === 'retry') {
    workout.stage = 'write';
    renderWorkout();
    $('#workout-answer').focus();
  }
  if (button.dataset.workoutAction === 'finish' && workout.stage === 'feedback') {
    workout.stage = 'done';
    completeGuestPractice('workout:' + workout.id);
    if (!S.board[workout.id]) {
      S.board[workout.id] = workoutDay();
      workout.xp = award(20).total;
      trackWorkout(WORKOUT_EVENTS.completed, workout.id);
      sfx('win');
    }
    sessionAchievement = workoutAchievement(workout.id, workout.xp);
    updateHeader();
    renderWorkout();
  }
  if (button.dataset.workoutAction === 'chat') {
    closeSession();
    if (!deps.isAuthed()) {
      deps.login('review-chat');
      return;
    }
    openReviewChat();
  }
}

function openReviewChat() {
  showTab('chat');
  startScen('review');
}

function worldTile(key) {
  const match = /^w(\d{1,2})t(\d{1,2})$/.exec(key);
  return match && LEVELS[+match[1]] ? worldTiles(+match[1])[+match[2]] : null;
}

function resumePractice(target: LoginTarget) {
  if (!deps.isAuthed()) return;
  if (target === 'review-chat') {
    openReviewChat();
    return;
  }
  const [kind, id] = target.split(':');
  showTab('board');
  if (kind === 'workout' && isWorkoutId(id)) startWorkout(id);
  if (kind === 'lesson') {
    const index = LESSONS.findIndex(lesson => lesson.id === id);
    if (index >= 0 && lvOpen(LESSONS[index].lv)) startLesson(index);
  }
  if (kind === 'unit') {
    const index = UNITS.findIndex(unit => unit.id === id);
    if (index >= 0 && lvOpen(UNITS[index].lv)) startSession(index);
  }
  if (kind === 'board') {
    const tile = worldTile(id);
    if (tile && lvOpen(tile.w) && ['quiz','sprint','rev','chefe'].includes(tile.k)) startBoardQuiz(tile.w, tile);
  }
  if (kind === 'placement') {
    const tile = worldTile(id);
    if (tile?.k === 'chefe' && tile.w < LEVELS.length - 1) startTest(tile.w + 1);
  }
  if (kind === 'game') {
    if (id === 'daily') startDaily();
    if (id === 'emoji') startEmoji();
    if (id === 'termo') startTermo();
    if (id === 'xword') startXword();
  }
}

function conversationCard(){
  const account=deps.conversationAccount?.();
  if(!account||practiceAccess()!=='member')return '';
  const suggestion=conversationSuggestion(S.chats||0,conversationLastInteraction(account));
  if(!suggestion)return '';
  const scene=SCEN.find(item=>item.id===suggestion.scenario);
  if(!scene)return '';
  return `<section class="conversation-card" aria-labelledby="conversation-card-title">
    <div>
      <h2 id="conversation-card-title">${suggestion.first?'Sua primeira conversa com IA':'Conversa com IA: '+esc(scene.t)}</h2>
      <p>${suggestion.first?'Simule uma daily em inglês por texto ou voz. A IA faz o papel de um colega e ajuda você a responder.':esc(scene.practice)}</p>
    </div>
    <div class="conversation-actions">
      <button class="btn" data-conversation-start="${scene.id}">${suggestion.first?'Simular uma daily':'Treinar '+esc(scene.t)} ${ARROW}</button>
      <button class="linkbtn" data-conversation-dismiss>Agora não</button>
    </div>
  </section>`;
}

function renderBoard(){
  updateHeader();
  const ol=openLv();if(boardW===null||boardW>LEVELS.length-1)boardW=ol;
  const w=boardW,open=lvOpen(w),tiles=worldTiles(w),cur=open?curIndex(tiles):-1,done=tiles.filter(tileDone).length;
  if(boardSel!==null&&boardSel>=tiles.length)boardSel=null;
  const selected = boardSel ?? Math.min(Math.max(cur,0),tiles.length-1);
  const sel=tiles[selected],selDone=tileDone(sel),selLocked=!open||(!selDone&&selected>cur);
  const devDice=deviceDice(),diceToday=S.diceDay===today()||devDice.day===today();
  const diceShown=S.diceDay===today()?S.diceVal:devDice.val;
  const cells=tiles.map((t,i)=>{
    const [r,c]=ringPos(i),dn=tileDone(t),isCur=i===cur,lock=!open||(!dn&&i>cur);
    const cls='tile f-'+FAMILY[t.k]+' k-'+t.k+(dn?' done':'')+(isCur?' cur':'')+(lock?' locked':'')+(i===selected?' sel':'');
    return '<button class="'+cls+'" style="grid-row:'+r+';grid-column:'+c+'" data-tile="'+i+'"'+(lock||t.k==='start'||(dn&&t.k==='bau')?' disabled':'')+' aria-pressed="'+(i===selected)+'" aria-label="Casa '+(i+1)+': '+esc(t.label)+(lock?', bloqueada':dn?', concluída':isCur?', sua vez':'')+'"><span class="tn">'+(i+1)+'</span>'+(isCur?PAWN:'<span class="tico'+(t.k==='chefe'&&BOSSES[t.w]?' boss':'')+'">'+(t.k==='chefe'&&BOSSES[t.w]?BOSSES[t.w].av:TIC(t))+'</span>')+'<span class="tl">'+esc(t.label)+'</span>'+(dn?'<span class="tok">'+CHECK+'</span>':'')+'</button>';
  }).join('');
  const center=open
    ?'<div class="bcenter"><div class="art">'+ART[w]+'</div><button class="dice'+(diceToday?' used':'')+'" data-dice'+(diceToday?' disabled':'')+'>'+(diceToday&&diceShown?DIE(diceShown):DICE)+'<span>'+(diceToday?'Tirou '+diceShown+' hoje':'Rolar dado')+'</span></button><span class="dsub">'+(diceToday?'Volte amanhã':'1 vez por dia')+'</span></div>'
    :'<div class="bcenter"><div class="art dim">'+ART[w]+'</div><p class="lockmsg">'+ic('lock')+' Vença o chefão de '+esc(WORLD[w-1])+' para entrar. Já sabe o conteúdo? Pule direto para o desafio.</p><button class="btn alt mini" data-test="'+w+'">Pular: enfrentar o chefão de '+esc(WORLD[w-1])+'</button></div>';
  const info=tileInfo(sel);
  const kicker='Casa '+(selected+1)+(selLocked?' · Bloqueada':selected===cur?' · Sua vez':selDone?' · Concluída':'');
  let btn='';
  if(selLocked)btn='<button class="btn" disabled>Bloqueada</button>';
  else if(sel.k==='start')btn='';
  else if(sel.k==='bau')btn=selDone?'<button class="btn alt" disabled>Baú aberto</button>':'<button class="btn alt" data-play>'+info.go+'</button>';
  else btn='<button class="btn alt" data-play>'+(selDone?info.again:info.go)+' '+ARROW+'</button>';
  const card='<section class="turn'+(info.av?' bossturn':'')+'">'+(info.av?'<span class="bossbig">'+info.av+'</span>':'')+'<span class="kick">'+kicker+'</span><h2>'+esc(info.title)+'</h2>'+(info.sub?'<p class="sub">'+esc(info.sub)+'</p>':'')+(info.ex?'<p class="ex">'+esc(info.ex)+'</p>':'')+(info.desc?'<p class="desc">'+esc(info.desc)+'</p>':'')+(info.xp?'<span class="meta">'+info.xp+'</span>':'')+btn+'</section>';
  renderedWorkoutDay = workoutDay();
  const workoutId = workoutForDay(S.board, renderedWorkoutDay);
  const startedTrail = Object.values(S.lessons).some(Boolean) || Object.values(S.units).some(Boolean);
  const nextTiles = w === ol ? tiles : worldTiles(ol);
  const next = startedTrail || S.board[workoutId] ? nextTiles[curIndex(nextTiles)] : null;
  const remaining = practiceAccess() === 'guest' ? guestRemaining(readGuestPractice()) : null;
  $('#v-board').innerHTML = `<div class="practice-heading"><h1 tabindex="-1">Seu treino</h1>${rankHud()}</div>
    ${conversationCard()}
    <div class="practice-grid">
      ${todayCard(workoutId, next, remaining)}
      <section class="world-panel${mapOpen ? ' expanded' : ''}" aria-labelledby="world-name">
        <div class="world-head">
          <div><span class="world-label">Seu mundo</span><h2 id="world-name">${esc(WORLD[w])}</h2>
            <p>${LEVELS[w].tag} · ${open ? done + ' de ' + (tiles.length - 1) + ' casas concluídas' : 'Mundo bloqueado'}</p>
          </div>
          <div class="wnav">
            <button class="wbtn" data-wprev aria-label="Mundo anterior"${w === 0 ? ' disabled' : ''}>${CHEVRON}</button>
            <button class="wbtn" data-wnext aria-label="Próximo mundo"${w === LEVELS.length - 1 ? ' disabled' : ''}>${CHEVRON}</button>
          </div>
        </div>
        <button class="btn alt world-toggle" aria-expanded="${mapOpen}" aria-controls="world-board" data-map-toggle>${mapOpen ? 'Recolher tabuleiro' : 'Ver tabuleiro'}</button>
        <div id="world-board" class="world-board">
          <div class="boardbox"><div class="ring">${cells + center}</div></div>
          ${boardSel === null ? '' : card}
        </div>
      </section>
    </div>
    ${quickGames()}`;
  if (boardVisible() && !document.hidden && (tabFromPath() ?? 'board') === 'board') {
    const offer = renderedWorkoutDay + ':' + workoutId;
    if (offer !== lastWorkoutOffer && !S.board[workoutId] && remaining !== 0) {
      lastWorkoutOffer = offer;
      trackWorkout(WORKOUT_EVENTS.offered, workoutId);
    }
  }
  queueHop(w,cur,open,tiles.length);
}
// Pawn hop: when the learner's square moves forward, the pawn jumps tile by tile to the new one.
const lastCur={};let hopTimer=0;
function boardVisible(){return !$('#v-board').classList.contains('hidden')&&$('#sess').classList.contains('hidden')}
function queueHop(w,cur,open,n){
  if(!open)return;
  if(!boardVisible() || !$('.boardbox')?.getClientRects().length)return;
  const from=lastCur[w];lastCur[w]=cur;
  if(from===undefined||cur<=from||cur>=n)return;
  clearTimeout(hopTimer);hopTimer=setTimeout(()=>animateHop(from,cur),260);
}
function animateHop(from,to){
  const ring=$('#v-board .ring'),dest=ring&&ring.querySelector('[data-tile="'+to+'"]');if(!ring||!dest)return;
  const pawn=dest.querySelector('.pawn');
  let reduce=false;try{reduce=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
  if(reduce||!pawn||!pawn.animate){dest.classList.add('land');return}
  // Path: every square between the old and new one (at most 5 hops, so long jumps stay quick).
  let path=[];for(let i=from;i<=to;i++)path.push(i);
  if(path.length>6)path=[from,...path.slice(-5)];
  const rr=ring.getBoundingClientRect(),pr=pawn.getBoundingClientRect();
  const pts=path.map(i=>{const t=ring.querySelector('[data-tile="'+i+'"]');const r=t.getBoundingClientRect();return[r.left+r.width/2-rr.left,r.top+r.height/2-rr.top]});
  const hop=document.createElement('span');hop.className='hopper';hop.innerHTML=MASCOT;
  hop.style.width=pr.width+'px';hop.style.height=pr.height+'px';ring.appendChild(hop);
  pawn.style.opacity='0';
  const kf=[];const step=1/(pts.length-1);
  pts.forEach((p,k)=>{
    const tr=(x,y,sc)=>'translate('+(x-pr.width/2)+'px,'+(y-pr.height/2)+'px) scale('+sc+')';
    if(k>0){const q=pts[k-1];kf.push({transform:tr((p[0]+q[0])/2,(p[1]+q[1])/2-Math.max(18,pr.height*.45),1.08),offset:(k-.5)*step})}
    kf.push({transform:tr(p[0],p[1],k===pts.length-1?1:.96),offset:k*step});
  });
  const dur=300*(pts.length-1);
  for(let k=1;k<pts.length;k++)setTimeout(()=>sfx('hop'),300*k-120);
  const an=hop.animate(kf,{duration:dur,easing:'ease-in-out',fill:'forwards'});
  an.onfinish=()=>{hop.remove();pawn.style.opacity='';dest.classList.add('land');setTimeout(()=>dest.classList.remove('land'),700)};
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
  if(!t||!canPlayTile(t))return;
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
  const conversation=e.target.closest('[data-conversation-start]');
  if(conversation){
    showTab('chat');
    startScen(conversation.dataset.conversationStart);
    $('.chat-title').focus({preventScroll:true});
    return;
  }
  if(e.target.closest('[data-conversation-dismiss]')){
    markConversationInteraction();
    renderBoard();
    $('.practice-heading h1').focus({preventScroll:true});
    return;
  }
  const toggle=e.target.closest('[data-map-toggle]');
  if(toggle){
    mapOpen=!mapOpen;
    toggle.closest('.world-panel').classList.toggle('expanded',mapOpen);
    toggle.setAttribute('aria-expanded',String(mapOpen));
    toggle.textContent=mapOpen?'Recolher tabuleiro':'Ver tabuleiro';
    return;
  }
  const todayButton=e.target.closest('[data-practice-tile]');
  if(todayButton){
    const tile=worldTile(todayButton.dataset.practiceTile);
    if(tile)playTile(tile);
    return;
  }
  const workoutButton = e.target.closest('[data-workout-start]');
  if(workoutButton){startWorkout(workoutButton.dataset.workoutStart);return}
  const tb=e.target.closest('[data-test]');if(tb){startTest(+tb.dataset.test);return}
  if(e.target.closest('[data-wprev]')){boardW=Math.max(0,boardW-1);boardSel=null;renderBoard();return}
  if(e.target.closest('[data-wnext]')){boardW=Math.min(LEVELS.length-1,boardW+1);boardSel=null;renderBoard();return}
  if(e.target.closest('[data-review]')){startReview();return}
  const tile=e.target.closest('[data-tile]');if(tile){boardSel=+tile.dataset.tile;renderBoard();showTurn();return}
  if(e.target.closest('[data-play]')){playTile(worldTiles(boardW)[boardSel]);return}
  if(e.target.closest('[data-dice]')){
    if(S.diceDay===today()||deviceDice().day===today())return;
    const v=1+Math.floor(Math.random()*6);S.diceDay=today();S.diceVal=v;try{localStorage.setItem(DICE_DEV_KEY,JSON.stringify({day:today(),val:v}))}catch(e){}
    sfx('dice');try{deps.track('dice',String(v))}catch(e){}const r=award(v*5);sfxEvents(r.ev,450);
    // Tumble through random faces, then land on the real value.
    const btn=e.target.closest('[data-dice]');btn.disabled=true;let k=0;
    const spin=setInterval(()=>{const f=btn.querySelector('svg');if(f)f.outerHTML=DIE(1+Math.floor(Math.random()*6));if(++k>=8){clearInterval(spin);renderBoard();const d=$('#v-board .dice');if(d)d.classList.add('rolled')}},70);
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
  hop:()=>{tone(520,0,.09,'sine',.07,820)},
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
  try{if(window.speechSynthesis&&speechSynthesis.speaking)return;if(player&&!player.paused&&!player.ended&&player.currentTime>0.2)return}catch(e){}
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

/* ---------- theme: dark by default, with optional device preference ---------- */
const THEME_KEY='devenglish-theme';
const SUN_IC=IC('<circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>');
const MOON_IC=IC('<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z"/>');
const deviceTheme=window.matchMedia('(prefers-color-scheme: dark)');
let theme='dark';
try {
  const saved=localStorage.getItem(THEME_KEY);
  if(saved==='light'||saved==='auto')theme=saved;
} catch(e){}
const isDark=()=>theme==='dark'||(theme==='auto'&&deviceTheme.matches);
function paintTheme(){
  const dark=isDark();
  const resolved=dark?'dark':'light';
  root.closest('.gym')?.setAttribute('data-theme',resolved);
  document.documentElement.dataset.theme=resolved;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',dark?'#081126':'#faf9f7');
  const b=$('#themebtn');
  if(b){
    const label=dark?'Usar tema claro':'Usar tema escuro';
    b.innerHTML=dark?SUN_IC:MOON_IC;
    b.title=label;
    b.setAttribute('aria-label',label);
  }
}
function applyTheme(next){
  theme=next;
  try{localStorage.setItem(THEME_KEY,next)}catch(e){}
  paintTheme();
}
paintTheme();
$('#themebtn').addEventListener('click',()=>{applyTheme(isDark()?'light':'dark');if(!$('#v-me').classList.contains('hidden'))renderMe()});
deviceTheme.addEventListener('change',paintTheme);

/* ---------- profile: rank, streak, goal, levels, badges ---------- */
// Soft ask for reminders at the end of an activity (the browser prompt only comes after "yes").
// "Agora não" waits 3 days; at most 3 asks in total. Never shown together with the save-progress nudge.
const ASK_KEY='devenglish-pushask';
function askState(){try{return JSON.parse(localStorage.getItem(ASK_KEY)||'{}')}catch(e){return{}}}
function pushAsk(){
  if(!deps.push||deps.push().status!=='off')return '';
  if(!deps.isAuthed()&&S.xp>0)return ''; // the save-progress nudge comes first
  const a=askState();if((a.n||0)>=3||(a.until||0)>Date.now())return '';
  const st=liveStreak();
  return '<div class="memecard pushask"><span class="mav">'+MASCOT+'</span><div class="mbub"><b>Bolha</b><span>'+
    (st>0?'Quer que eu te cutuque amanhã pra não perder a ofensiva de '+st+(st===1?' dia':' dias')+'?':'Quer que eu te cutuque amanhã pra manter o ritmo?')+' Prometo só 1 meme por dia.</span>'+
    '<span class="mbtns"><button class="btn mini" data-pushask="yes">'+ic('bell')+' Pode me lembrar</button><button class="btn mini alt" data-pushask="no">Agora não</button></span></div></div>';
}
// Daily reminders (web push) in the profile.
function remindHtml(){
  const P=deps.push?deps.push():{status:'unsupported',hour:20};
  const hours=[8,12,18,19,20,21,22].map(h=>'<option value="'+h+'"'+(h===P.hour?' selected':'')+'>'+h+'h</option>').join('');
  let body='';
  if(P.status==='on')body='<p>'+ic('bell')+' Ativados. Se você ainda não praticou no dia, eu te cutuco às <select id="pushhour" aria-label="Horário do lembrete">'+hours+'</select> com um meme.</p><button class="btn alt mini" data-push="off">Desativar lembretes</button>';
  else if(P.status==='denied')body='<p>As notificações estão bloqueadas para este site. Libere nas configurações do navegador (ícone de cadeado ao lado do endereço) e volte aqui.</p>';
  else if(P.status==='unsupported')body=/Instagram|FBAN|FBAV|LinkedInApp|Line\/|; wv\)/i.test(navigator.userAgent)
    ?'<p>Você abriu o app dentro de outro aplicativo (Instagram, LinkedIn…), e ele não permite notificações. Toque nos <b>⋯</b> e escolha <b>Abrir no navegador</b> (Chrome ou Safari) para ativar os lembretes.</p>'
    :'<p>Este navegador não permite notificações. No celular, use o <b>Chrome</b> (Android) ou adicione o app à Tela de Início (iPhone).</p>';
  else if(P.status==='ios-install')body='<p>No iPhone, os lembretes só funcionam com o app na Tela de Início: toque em <b>Compartilhar</b> → <b>Adicionar à Tela de Início</b>, abra o Dev English por lá e ative aqui.</p>';
  else body='<p>Receba um lembrete por dia (com meme) se ainda não tiver praticado. Nada de spam: no máximo 1 por dia.</p><button class="btn mini" data-push="on">'+ic('bell')+' Ativar lembretes diários</button>';
  return '<h2 class="sec">Lembretes</h2><div class="remind">'+body+'</div>';
}
async function togglePush(on,hour){
  if(on&&deps.pushEnable){const r=await deps.pushEnable(hour||(deps.push?deps.push().hour:20));toast(r.status==='on'?ic('bell')+' Lembretes ativados!':r.status==='denied'?'Notificações bloqueadas no navegador.':'Lembretes não ativados.')}
  else if(!on&&deps.pushDisable){await deps.pushDisable();toast('Lembretes desativados.')}
  renderMe();renderBoard();
}
function learnedTopics(level?: number) {
  const scores: Record<string, number> = {};
  const topics = [];
  for (const unit of UNITS) {
    const id = 'unit:' + unit.id;
    topics.push({ id, level: unit.lv, label: unitShareTopic(unit) });
    scores[id] = S.units[unit.id] || 0;
  }
  for (const lesson of LESSONS) {
    const id = 'lesson:' + lesson.id;
    topics.push({ id, level: lesson.lv, label: lessonShareTopic(lesson) });
    scores[id] = S.lessons[lesson.id] || 0;
  }
  if (level === undefined) {
    for (const id of WORKOUT_IDS) {
      topics.unshift({ id, level: -1, label: WORKOUTS[id].skill });
      scores[id] = S.board[id] || 0;
    }
  }
  return completedTopics(topics, scores, level);
}

function sessionShareButton() {
  return sessionAchievement ? '<button class="share-text-action" type="button" data-share-result>Compartilhar conquista</button>' : '';
}

function worldBossAchievement(level, challengeTopics = [], score?) {
  const boss = BOSSES[level];
  const ids = [...new Set([...savedBossTopicIds(S.board, level), ...challengeTopics])];
  const evidence = ids.map(id => bossTopicLabels.get(id)).filter(Boolean);
  const topics = [...new Set([...learnedTopics(level), ...evidence])].slice(0, 3);
  return {
    ...bossAchievement(WORLD[level], boss?.name ?? '', topics, score),
    portrait: boss ? '/bosses/boss-' + (level + 1) + '.webp' : undefined,
    technique: techniqueFromBossEvidence(ids) ?? learnedTechnique(level),
  };
}

function techniqueFromBossEvidence(ids: string[]) {
  return practiceTechnique(ids.filter(id=>id.startsWith('technique-')).map(id=>id.slice('technique-'.length)));
}

function learnedTechnique(level?: number) {
  const lessonIds = LESSONS.filter(lesson=>S.lessons[lesson.id] && (level===undefined || lesson.lv===level)).map(lesson=>lesson.id);
  const unitIds = UNITS.filter(unit=>S.units[unit.id] && (level===undefined || unit.lv===level)).map(unit=>'unit-'+unit.id);
  const workouts = level===undefined ? WORKOUT_IDS.filter(id=>S.board[id]) : [];
  return practiceTechnique([...lessonIds, ...unitIds, ...workouts]);
}

function workoutAchievement(id, xp = 0) {
  return {
    title: 'Code review praticado!',
    description: 'Completei um treino de code review em inglês.',
    topics: [WORKOUTS[id].skill],
    technique: practiceTechnique([id]),
    result: xp ? '+' + xp + ' XP' : undefined,
  };
}

function profileAchievements() {
  const choices: { id: string; label: string; card: Achievement }[] = [];
  const topics = learnedTopics();
  const technique = learnedTechnique() ?? techniqueFromBossEvidence(WORLD.flatMap((_, level)=>savedBossTopicIds(S.board, level)));
  const rank = rankOf(S.xp);
  const streak = liveStreak();
  if (S.xp > 0 || topics.length) {
    choices.push({
      id: 'progress',
      label: 'Meu progresso',
      card: {
        title: 'Meu progresso no inglês',
        description: 'Estou praticando inglês para o dia a dia em tecnologia.',
        topics,
        technique,
        result: rank.name + ' · ' + S.xp + ' XP',
      },
    });
  }
  if (rank.i > 0) {
    choices.push({
      id: 'rank', label: 'Patente ' + rank.name,
      card: { title: 'Subi de patente!', description: 'Cheguei a ' + rank.name + ' no Dev English Gym.', topics, technique, result: S.xp + ' XP' },
    });
  }
  if (streak >= 3) {
    choices.push({
      id: 'streak', label: streak + ' dias seguidos',
      card: { title: streak + ' dias seguidos!', description: 'Mantive uma rotina de inglês para devs.', topics, technique },
    });
  }
  for (let level = 0; level < WORLD.length; level++) {
    if (S.board[worldTiles(level).at(-1).key]) {
      choices.push({ id: 'boss:' + level, label: 'Chefão de ' + WORLD[level], card: worldBossAchievement(level) });
    }
  }
  for (const id of WORKOUT_IDS) {
    if (!S.board[id]) continue;
    const practice = WORKOUTS[id];
    choices.push({
      id: 'workout:' + id, label: practice.title,
      card: workoutAchievement(id),
    });
  }
  for (const lesson of LESSONS) {
    if (!S.lessons[lesson.id]) continue;
    const structure = practiceTechnique([lesson.id]);
    if (!structure) continue;
    choices.push({
      id: 'structure:' + lesson.id,
      label: 'Estrutura · ' + lesson.t,
      card: { title: 'Inglês em prática', description: 'Concluí a aula “' + lesson.t + '”.', topics: [lessonShareTopic(lesson)], technique: structure },
    });
  }
  for (const badge of BADGES) {
    if (!S.badges.includes(badge.id)) continue;
    choices.push({
      id: 'badge:' + badge.id,
      label: badge.t,
      card: { title: badge.t, description: 'Conquistei este marco na minha trilha de inglês para devs.', topics, technique },
    });
  }
  return choices;
}

function profileShareHtml() {
  const choices = profileAchievements();
  if (!choices.length) return '';
  const selected = $('#share-achievement-select')?.value;
  return '<section class="mecard profile-share"><h2>Compartilhar progresso</h2><label for="share-achievement-select">Escolha o que mostrar</label>'+
    '<select id="share-achievement-select">'+choices.map(choice=>'<option value="'+choice.id+'"'+(choice.id===selected?' selected':'')+'>'+esc(choice.label)+'</option>').join('')+'</select>'+
    '<button type="button" class="btn alt" data-share-profile>Ver card para compartilhar</button></section>';
}

const onShareClick = e => {
  const button = e.target.closest('[data-share-result], [data-share-profile]');
  if (!button) return;
  const card = button.hasAttribute('data-share-result')
    ? sessionAchievement
    : profileAchievements().find(choice => choice.id === $('#share-achievement-select').value)?.card;
  if (card) achievementShare.open(card, button);
};
root.addEventListener('click', onShareClick);

function renderMe(){
  updateHeader();
  const r=rankOf(S.xp),st=liveStreak(),mu=mult(st),nm=nextMult(st),d=dayXpNow(),ms=MILESTONES.find(m=>m>st);
  // Calendar week, Sunday to Saturday: today is outlined, days still to come are faded.
  const week=[],td=new Date(),wd=td.getDay();for(let k=0;k<7;k++){const x=new Date(td.getFullYear(),td.getMonth(),td.getDate()-wd+k),ds=dayStr(x);week.push('<span class="wd'+(S.days.includes(ds)?' on':'')+(k===wd?' now':'')+(k>wd?' future':'')+'" title="'+x.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'numeric'})+'"><i>'+'DSTQQSS'[k]+'</i></span>')}
  $('#v-me').innerHTML=
   '<section class="rankcard"><small>Sua patente</small><h1>'+esc(r.name)+'</h1><div class="prog"><i style="width:'+(r.pct*100)+'%"></i></div><p>'+(r.next?'<b>'+S.xp+'</b> xp · faltam <b>'+(r.next-S.xp)+'</b> para '+esc(r.nextName):'<b>'+S.xp+'</b> xp · topo da carreira!')+'</p></section>'+
   profileShareHtml()+(deps.open?'<div class="hub">'+[['league','trophy','Liga semanal'],['report','chart-bar','Relatório da semana'],['invite','gift','Convide e ganhe'],['certs','certificate','Certificados'],['interview','microphone','Entrevista'],['tools','writing','Corretor']].map(([k,e,t])=>'<button class="hubbtn" data-panel="'+k+'"><span>'+ic(e)+'</span>'+t+'</button>').join('')+'</div>':'')+'<div class="mecols">'+
   '<section class="mecard"><h3>'+ic('flame:f')+' Ofensiva</h3><p class="bign">'+st+'<span> '+(st===1?'dia':'dias')+'</span></p><div class="week">'+week.join('')+'</div>'+
     '<ul class="perks"><li><span>Bônus de XP agora</span><b>'+(mu>1?pct(mu):'nenhum')+'</b></li>'+(nm?'<li><span>Com '+nm[0]+' dias</span><b>'+pct(nm[1])+'</b></li>':'')+
     '<li><span>Proteções '+ic('shield-check')+'</span><b>'+S.freezes+'/'+MAX_FREEZES+'</b></li>'+(ms?'<li><span>Próximo marco: '+ms+' dias</span><b>+'+ms*5+' xp</b></li>':'')+'</ul>'+
     '<p class="note">Cada 7 dias seguidos dão uma proteção. Se você faltar um dia, ela é usada sozinha e a ofensiva continua.</p></section>'+
   '<section class="mecard"><h3>'+ic('target-arrow')+' Meta diária</h3><div class="goalbar"><div class="gl"><span>Hoje</span><b>'+Math.min(d,S.goal)+'/'+S.goal+' xp</b></div><div class="prog"><i style="width:'+Math.min(100,d/S.goal*100)+'%"></i></div></div>'+
     '<div class="goalpick">'+GOALS.map(([g,n])=>'<button class="pill" data-goal="'+g+'" aria-pressed="'+(S.goal===g)+'">'+n+'<small>'+g+' xp</small></button>').join('')+'</div>'+
     '<p class="note">Bater a meta dá +10 xp. Você já bateu '+S.goals+(S.goals===1?' vez':' vezes')+'.</p></section>'+
   '</div>'+
   remindHtml()+'<h2 class="sec">Tema</h2><div class="themepick">'+[['auto','Automático'],['light','Claro'],['dark','Escuro']].map(([k,n])=>'<button class="pill" data-theme-pick="'+k+'" aria-pressed="'+(theme===k)+'">'+n+'</button>').join('')+'</div>'+
   '<h2 class="sec">O que sua patente libera</h2><div class="perktable">'+AI_TIERS.map((t,k)=>{const nx=AI_TIERS[k+1],cur=S.xp>=t.xp&&(!nx||S.xp<nx.xp),got=S.xp>=t.xp;
     const sc=SCEN.filter(x=>x.xp&&x.xp>=t.xp&&(!nx||x.xp<nx.xp)).map(x=>x.t);
     return '<div class="ptier'+(cur?' cur':'')+(got?' got':'')+'"><span class="pr">'+(got?'':ic('lock')+' ')+esc(rankForXp(t.xp))+'<small>'+t.xp+' xp</small></span><span class="pv"><b>'+t.limit+'</b> mensagens/dia com a IA'+(sc.length?'<small>+ conversa: '+esc(sc.join(', '))+'</small>':'')+'</span>'+(cur?'<span class="you">você</span>':'')+'</div>'}).join('')+'</div>'+
   '<h2 class="sec">Níveis</h2><p class="note">Já sabe inglês? <button class="linkbtn" data-placement="1">Refazer o teste de nível</button></p><div class="lvlist">'+LEVELS.map((V,lv)=>{const ls=LESSONS.filter(l=>l.lv===lv),dn=ls.filter(l=>S.lessons[l.id]).length,op=lvOpen(lv);
     return '<div class="lvrow'+(op?'':' locked')+'"><span class="lvtag">'+V.tag+'</span><span class="lvt"><b>'+esc(V.t)+'</b><span class="s">'+(op?dn+'/'+ls.length+' aulas':'Bloqueado')+'</span></span><div class="prog"><i style="width:'+(dn/ls.length*100)+'%"></i></div></div>'}).join('')+'</div>'+
   '<h2 class="sec">Conquistas <span class="cnt">'+S.badges.length+'/'+BADGES.length+'</span></h2><div class="badges">'+BADGES.map(b=>{const on=S.badges.includes(b.id);
     return '<div class="badge'+(on?' on':'')+'"><span class="be">'+ic(b.e)+'</span><b>'+esc(b.t)+'</b><span class="s">'+esc(b.d)+'</span></div>'}).join('')+'</div>';
}
$('#v-me').addEventListener('change',e=>{if(e.target.id==='pushhour')togglePush(true,+e.target.value)});
$('#v-me').addEventListener('click',e=>{const pb=e.target.closest('[data-push]');if(pb){togglePush(pb.dataset.push==='on');return}const tp=e.target.closest('[data-theme-pick]');if(tp){applyTheme(tp.dataset.themePick);renderMe();return}const b=e.target.closest('[data-goal]');if(b){S.goal=+b.dataset.goal;save();renderMe()}});
$('#rankchip').addEventListener('click',()=>showTab('me'));

// Badges earned by older saves (before gamification existed) are granted silently on load.
{const ev=[];checkBadges(ev);if(ev.length)save()}
renderBoard();renderLearn();renderHome();renderBook();renderChat();
scheduleWorkoutRefresh();
{const t0=tabFromPath();if(t0&&t0!=='board')showTab(t0,true)}
// Wide screens float the toolbar over the board header: reserve exactly its width there.
let tbObs=null;{const hd=root.querySelector('header.top');if(hd&&window.ResizeObserver){tbObs=new ResizeObserver(()=>root.style.setProperty('--tbw',Math.ceil(hd.getBoundingClientRect().width+20)+'px'));tbObs.observe(hd)}}

const acctLabel=()=>{const a=$('#acct');if(!a)return;const l=deps.accountLabel();a.textContent=l;a.classList.toggle('av',deps.isAuthed()&&l.length<=2);a.setAttribute('aria-label',deps.isAuthed()?'Sua conta':'Entrar')};
$('#acct').addEventListener('click',()=>deps.account());
acctLabel();
return {
  destroy(){root.removeEventListener('click',onShareClick);achievementShare.destroy();clearTimeout(workoutRefreshTimer);window.removeEventListener('popstate',onPop);document.removeEventListener('visibilitychange',onVis);deviceTheme.removeEventListener('change',paintTheme);try{if(tbObs)tbObs.disconnect()}catch(e){}stopAudio();try{if(dict)dict.stop()}catch(e){}root.innerHTML=''},
  resumePractice,
  startPlacement,
  getState(){return JSON.parse(JSON.stringify(S))},
  patch(p){Object.assign(S,p||{});save();renderBoard();renderLearn();renderHome();if(!$('#v-me').classList.contains('hidden'))renderMe()},
  // Sign-out: forget this device's progress and the open conversation.
  reset(){stopAudio();S=DEF();chat={scen:null,msgs:[],items:[],busy:false,err:''};boardW=null;boardSel=null;mapOpen=false;renderBoard();renderLearn();renderHome();renderChat();if(!$('#v-me').classList.contains('hidden'))renderMe()},
  setState(p){S=Object.assign(DEF(),p||{});checkBadges([]);renderBoard();renderLearn();renderHome();if(!$('#v-me').classList.contains('hidden'))renderMe()},
  refresh(){acctLabel();renderChat();renderHome();renderLearn();renderBoard();if(!$('#v-me').classList.contains('hidden'))renderMe()},
}
}

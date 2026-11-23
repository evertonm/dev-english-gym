// Boss of each world (tile 16): an original character with portrait, lines and a health bar in battle.
// Portraits live in public/bosses (320px WebP, transparent background).
const img = (n: number, name: string) =>
  `<img class="boss-av" src="/bosses/boss-${n}.webp" alt="${name}" width="320" height="320" decoding="async">`
const AV = [img(1, 'Rita'), img(2, 'Leo'), img(3, 'Sofia'), img(4, 'Marcus'), img(5, 'Helena'), img(6, 'Officer Jones')]

export const BOSSES = [
  { name: 'Rita', role: 'Recrutadora', quote: "So, tell me about yourself.", taunt: 'Vamos ver se o seu básico está afiado!', win: 'Impressionante! Você passou na triagem.', lose: 'Hmm… volte quando estiver mais preparado.', av: AV[0] },
  { name: 'Leo', role: 'Tech Lead', quote: "Walk me through your last pull request.", taunt: 'Na minha review nada passa batido.', win: 'LGTM! Aprovado sem comentários.', lose: 'Request changes. Tente de novo.', av: AV[1] },
  { name: 'Sofia', role: 'Arquiteta de Software', quote: "Why this design and not another?", taunt: 'Justifique cada decisão.', win: 'Arquitetura sólida. Pode subir!', lose: 'Esse design não escala. Revise e volte.', av: AV[2] },
  { name: 'Marcus', role: 'Diretor de Engenharia', quote: "Give me the short version.", taunt: 'Seja claro, diplomático e direto.', win: 'Você fala a língua da liderança.', lose: 'Faltou clareza. Próxima reunião, então.', av: AV[3] },
  { name: 'Helena', role: 'CTO', quote: "Convince me in one minute.", taunt: 'Só os melhores chegam ao topo.', win: 'Você zerou o jogo. Bem-vindo ao topo!', lose: 'Quase. No topo, cada palavra conta.', av: AV[4] },
  { name: 'Officer Jones', role: 'Imigração (EUA)', quote: "Purpose of your visit?", taunt: 'Next! Passport, please.', win: 'Welcome to the United States!', lose: 'Please step aside. Tente de novo.', av: AV[5] },
]

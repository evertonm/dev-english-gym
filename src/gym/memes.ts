// Meme card on the board: the mascot (b) or a boss (0-5, see bosses.ts) says something for the moment.
// BASE never gets old (dev humor). MONTH is the "memes do momento" pack: swap it when the trend changes.
// Situations: back (came back after 2+ days), risk (evening, streak at risk), guest (playing without
// an account), goal (daily goal hit), hello (any other day). {streak}, {xp}, {days} and {left} are filled in.

type Who = 'b' | 0 | 1 | 2 | 3 | 4 | 5
export type Meme = { who: Who; text: string }
export type Situation = 'back' | 'risk' | 'guest' | 'goal' | 'hello'

const BASE: Record<Situation, Meme[]> = {
  back: [
    { who: 'b', text: '{days} dias sem praticar. Seu inglês entrou em code freeze. Bora fazer um hotfix?' },
    { who: 1, text: 'Sumiu, hein? Achei que você tinha dado rollback no inglês.' },
    { who: 0, text: 'Oi, sumido! A vaga gringa continua aberta. E você?' },
    { who: 'b', text: 'Eu não guardo mágoa. Só um log de {days} dias de ausência. 🙂' },
    { who: 2, text: 'Seu inglês está com débito técnico de {days} dias. Vamos pagar uma parcela hoje?' },
  ],
  risk: [
    { who: 'b', text: 'Sua ofensiva de {streak} dias expira à meia-noite. Uma aula de 5 min salva tudo.' },
    { who: 0, text: 'Seu próximo recrutador gringo não vai esperar você "estudar amanhã".' },
    { who: 1, text: 'Ofensiva de {streak} dias sem commit hoje? Isso não passa na minha review.' },
    { who: 3, text: 'Me dá a versão curta: você vai deixar {streak} dias de ofensiva morrerem hoje?' },
    { who: 'b', text: 'Não quero ser dramático, mas sua ofensiva está em produção sem monitoramento. 🔥' },
  ],
  guest: [
    { who: 1, text: 'Progresso sem conta? Isso aí é deploy sem backup. Salva aí.' },
    { who: 'b', text: 'Seus {xp} xp moram só neste aparelho. Se o cache limpar, já era.' },
    { who: 2, text: 'Arquitetura frágil: um único ponto de falha chamado "seu navegador". Crie a conta.' },
    { who: 0, text: 'Seu progresso é ótimo. Seria uma pena se algo acontecesse com ele… 👀' },
  ],
  goal: [
    { who: 'b', text: 'Meta de hoje batida. LGTM! 🚀 Merged to main.' },
    { who: 1, text: 'Aprovado sem comentários. Raro, hein.' },
    { who: 4, text: 'É assim que se chega ao topo: um dia de cada vez.' },
    { who: 'b', text: 'Build verde, meta batida, ofensiva de {streak} dias. Pode tomar seu café em paz. ☕' },
  ],
  hello: [
    { who: 'b', text: 'Fun fact: "I have 30 years" é o bug mais comum de dev brasileiro. Você não, né?' },
    { who: 5, text: 'Purpose of your visit? Se a resposta for "treinar inglês", pode entrar.' },
    { who: 1, text: 'Uma aula por dia mantém o sotaque longe. Tipo lint, só que pra fala.' },
    { who: 'b', text: 'Hoje é um ótimo dia para não travar na daily.' },
    { who: 3, text: 'Inglês não é diferencial. É requisito. Bora?' },
  ],
}

// Memes do momento — novembro de 2026.
const MONTH: Partial<Record<Situation, Meme[]>> = {
  back: [
    { who: 'b', text: 'Você em janeiro: "2026 vai ser meu ano". Você em novembro: sumido há {days} dias. Ainda dá tempo!' },
  ],
  risk: [
    { who: 'b', text: 'Remember, November 2026 is coming… ah, já chegou. E a sua ofensiva de {streak} dias?' },
    { who: 0, text: 'Ainda dá pra 2026 ser seu ano: faltam {left} dias. Começa salvando a ofensiva de hoje.' },
  ],
  goal: [
    { who: 'b', text: 'Quando eu ficar fluente não direi nada, mas haverá sinais: daily sem travar e meta batida todo dia.' },
  ],
  hello: [
    { who: 'b', text: 'Você em janeiro: "esse ano eu fico fluente". Você em novembro: "I have 30 years". Bora mudar esse final?' },
    { who: 'b', text: 'Quando eu ficar fluente não direi nada, mas haverá sinais: LinkedIn em inglês, entrevista gringa e salário em dólar.' },
    { who: 0, text: '2026 vai ser seu ano? Faltam {left} dias. Uma aula por dia ainda dá um baita final de temporada.' },
    { who: 'b', text: '6 de 7 no quiz? 🤲 six-seven. Agora vai lá e faz 7 de 7.' },
  ],
}

export function memesFor(s: Situation): Meme[] {
  return [...(MONTH[s] ?? []), ...BASE[s]]
}

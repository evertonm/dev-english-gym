// Notification texts: short, funny, never mean. Title = who is talking; body = the meme.
// {streak}, {days}, {left} are filled in. MONTH = memes do momento (novembro de 2026); swap when trends change.
type Kind = "risk" | "back" | "hello"
type M = [title: string, body: string]

const BASE: Record<Kind, M[]> = {
  risk: [
    ["🔥 Bolha", "Sua ofensiva de {streak} dias expira à meia-noite. 5 minutos salvam tudo."],
    ["Rita, Recrutadora", "Seu próximo recrutador gringo não vai esperar você \"estudar amanhã\"."],
    ["Leo, Tech Lead", "{streak} dias de ofensiva e nenhum commit hoje? Isso não passa na minha review."],
    ["Marcus, Diretor", "Versão curta: abre o app ou perde {streak} dias de ofensiva."],
    ["🔥 Bolha", "Sua ofensiva está em produção sem monitoramento. Corre aqui. 🚨"],
    ["Sofia, Arquiteta", "Ponto único de falha detectado: você não estudou hoje."],
  ],
  back: [
    ["🥺 Bolha", "{days} dias sem praticar. Seu inglês entrou em code freeze."],
    ["Leo, Tech Lead", "Sumiu, hein? Achei que você tinha dado rollback no inglês."],
    ["Rita, Recrutadora", "Oi, sumido! A vaga gringa continua aberta. E você?"],
    ["🥺 Bolha", "Eu não guardo mágoa. Só um log de {days} dias de ausência. 🙂"],
    ["Officer Jones", "Passport, please. Ah, você sumiu há {days} dias… next!"],
  ],
  hello: [
    ["Bolha", "Hoje é um ótimo dia para não travar na daily. Uma aula rapidinha?"],
    ["Officer Jones", "Purpose of your visit? Se for treinar inglês, pode entrar. 🛂"],
    ["Leo, Tech Lead", "Uma aula por dia mantém o sotaque longe. Tipo lint, só que pra fala."],
    ["Helena, CTO", "Ninguém chega ao topo pulando dias. Bora?"],
  ],
}

const MONTH: Partial<Record<Kind, M[]>> = {
  risk: [
    ["🐻‍❄️ Bolha", "Remember, November 2026 is coming… já chegou. E a ofensiva de {streak} dias?"],
    ["Rita, Recrutadora", "2026 ainda pode ser seu ano: faltam {left} dias. Começa salvando a ofensiva."],
  ],
  back: [
    ["Bolha", "Você em janeiro: \"2026 vai ser meu ano\". Você em novembro: sumido há {days} dias. Ainda dá tempo!"],
  ],
  hello: [
    ["Bolha", "Quando eu ficar fluente não direi nada, mas haverá sinais: salário em dólar. 👀"],
    ["Bolha", "Você em janeiro: \"esse ano eu fico fluente\". Você em novembro: \"I have 30 years\". Bora?"],
  ],
}

export function pushMeme(kind: Kind, seed: string, v: { streak: number; days: number; left: number }) {
  const list = [...(MONTH[kind] ?? []), ...BASE[kind]]
  let h = 0
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  const [title, body] = list[h % list.length]
  const fill = (t: string) => t.replace("{streak}", String(v.streak)).replace("{days}", String(v.days)).replace("{left}", String(v.left))
  return { title: fill(title), body: fill(body) }
}

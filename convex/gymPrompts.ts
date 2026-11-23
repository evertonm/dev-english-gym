// Server-side prompt data. The client only sends a scenario id or lesson id, never a prompt.
export const SCENARIO_ROLES: Record<string, string> = {
  recruiter: "a friendly tech recruiter doing a first screening call for a remote senior developer position",
  standup: "an engineering manager running the daily standup meeting of a software team",
  review: "a teammate discussing a pull request that the learner opened",
  behavioral: "a hiring manager asking behavioral interview questions about teamwork, deadlines, conflict and mistakes",
  tech: "a senior engineer asking the learner to explain a past project and its technical decisions",
  // Unlocked by rank (see SCENARIO_MIN_XP in perks.ts)
  incident: "an engineering manager on a call during a production incident, asking the learner what broke, the impact, what they are doing now and when it will be fixed",
  salary: "a recruiter making a job offer for a remote senior developer role, negotiating salary, start date, contract type and time zone with the learner",
  cto: "the CTO of a startup in a final interview, asking the learner to design a system, explain trade-offs and say how they would lead a small team",
}

export const LESSON_TASKS: Record<string, string> = {
  past: "O que você fez ontem no trabalho? Escreva 1 ou 2 frases.",
  present: "No que você está trabalhando agora? Quais tecnologias você usa?",
  future: "O que você vai fazer hoje e quando fica pronto?",
  polite: "Peça pra um colega revisar seu PR hoje.",
  questions: "Escreva 1 pergunta que você faria pro entrevistador.",
  perfect: "Há quanto tempo você trabalha com sua stack principal?",
  brmistakes: "Onde você trabalha atualmente e há quanto tempo?",
  stories: "Conte em 2 ou 3 frases um problema que você resolveu no trabalho.",
  writing: "Um recrutador te mandou uma vaga remota. Responda com interesse e proponha uma call.",
  conditionals: "O que você faria se tivesse mais tempo no seu projeto atual?",
  modals: "Apareceu um bug em produção. Escreva o que pode ter causado e o que o time deveria fazer.",
  passive: "Escreva um resumo curto de incidente: o que aconteceu e o que já foi feito.",
  phrasal: "Diga o que você vai fazer com um bug novo, usando look into ou figure out.",
  tradeoffs: "Compare duas tecnologias que você conhece e diga qual escolheria e por quê.",
}

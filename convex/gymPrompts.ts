// Server-side prompt data. The client only sends a scenario id or lesson id, never a prompt.
export const SCENARIO_ROLES: Record<string, string> = {
  recruiter: "a friendly tech recruiter doing a first screening call for a remote senior developer position",
  standup: "an engineering manager running the daily standup meeting of a software team",
  review: "a teammate discussing a pull request that the learner opened",
  behavioral: "a hiring manager asking behavioral interview questions about teamwork, deadlines, conflict and mistakes",
  tech: "a senior engineer asking the learner to explain a past project and its technical decisions",
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
}

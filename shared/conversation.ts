type ConversationScenario = {
  id: string
  t: string
  role: string
  interview?: boolean
  xp?: number
  practice?: string
  opening?: { reply: string; pt: string; hint: string }
}

export const CONVERSATION_SCENARIOS: readonly ConversationScenario[] = [
  {
    id: 'standup', t: 'Daily',
    role: 'an engineering manager on an international software team. The learner is working on a login fix. Based on their update, ask about dependencies, the next step, or who can help',
    practice: 'Conte o que você fez, o que vai fazer e se algo está travando a entrega.',
    opening: {
      reply: 'Quick update on the login fix. What did you work on yesterday, and are you blocked on anything?',
      pt: 'Uma atualização rápida sobre a correção do login. No que você trabalhou ontem? Tem algum impedimento?',
      hint: 'Yesterday I fixed the login bug. I’m waiting for someone to review my PR.',
    },
  },
  { id: 'review', t: 'Code review', role: 'a teammate reviewing the learner’s pull request. Discuss a missing test or behavior change, let the learner clarify or disagree politely, and ask what should happen before the merge' },
  {
    id: 'pipeline', t: 'Pipeline quebrado',
    role: 'a teammate coordinating a release blocked by tests that pass locally but fail in CI. Ask what evidence to check, who can help, and when to post the next update. Do not assume the root cause is known',
    practice: 'Explique por que o CI está bloqueando a entrega e combine o próximo passo com o time.',
    opening: {
      reply: 'The tests pass locally, but they fail in CI. What would you check before we release?',
      pt: 'Os testes passam localmente, mas falham no CI. O que você verificaria antes de lançar?',
      hint: 'I’d check the CI logs first. I’d hold the release until we know why the tests fail.',
    },
  },
  {
    id: 'rollback', t: 'Deploy e rollback',
    role: 'a release lead talking about checkout errors that went up after a deploy. Discuss the case for a rollback, which metrics to monitor after mitigation, and how to communicate the decision',
    practice: 'Explique o impacto de um deploy e como você validaria a recuperação depois de reverter.',
    opening: {
      reply: 'Checkout errors went up after the deploy. Should we roll back now, and why?',
      pt: 'Os erros no checkout aumentaram depois do deploy. Devemos reverter agora? Por quê?',
      hint: 'I’d roll back now to reduce the impact. Then I’d check if the error rate goes down.',
    },
  },
  {
    id: 'handoff', t: 'Handoff entre fusos',
    role: 'the next on-call engineer in another time zone taking over a slow API alert. Ask for current impact, what was checked, who owns the next action, and when to update the incident channel',
    practice: 'Passe o contexto de um alerta para outro fuso e deixe claras as próximas ações.',
    opening: {
      reply: 'I’m taking over on-call. The API is slow. What have you checked so far?',
      pt: 'Estou assumindo o plantão. A API está lenta. O que você já verificou?',
      hint: 'I checked the logs and the latency dashboard. The next step is to check the database.',
    },
  },
  { id: 'recruiter', t: 'Recrutador', interview: true, role: 'a friendly tech recruiter doing a first screening call for a remote developer position. Ask about a recent project, English communication, or time-zone overlap' },
  { id: 'behavioral', t: 'Comportamental', interview: true, role: 'a hiring manager asking behavioral interview questions about teamwork, deadlines, conflict and mistakes. Ask for a concrete situation, the learner’s actions, and the outcome' },
  { id: 'tech', t: 'Papo técnico', interview: true, role: 'a senior engineer asking the learner to explain a past project, a technical decision, an alternative they considered, and how they measured the result' },
  { id: 'incident', t: 'Incidente em produção', xp: 500, role: 'an incident commander on a call about API latency. Ask for scope of impact, confirmed facts, mitigation, and when to expect the next update' },
  { id: 'salary', t: 'Negociar salário', interview: true, xp: 1500, role: 'a recruiter making a remote senior developer job offer and negotiating salary, start date, contract type and time-zone overlap' },
  { id: 'cto', t: 'Entrevista com CTO', interview: true, xp: 3600, role: 'the CTO of a startup in a final interview asking the learner to design a system, explain trade-offs and lead a small team' },
]

const REMINDER_INTERVAL = 7 * 86_400_000
const FOLLOW_UP_SCENARIOS = ['pipeline', 'rollback', 'handoff'] as const

export function conversationSuggestion(chats: number, lastInteraction: number, now = Date.now()) {
  if (lastInteraction > 0 && now - lastInteraction < REMINDER_INTERVAL) return null
  if (chats === 0 && !lastInteraction) return { scenario: 'standup', first: true }
  return { scenario: FOLLOW_UP_SCENARIOS[Math.floor(now / REMINDER_INTERVAL) % FOLLOW_UP_SCENARIOS.length], first: false }
}

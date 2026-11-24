import type { WorkoutId } from '../../shared/workout'

type Workout = {
  title: string
  context: string
  comment: string
  task: string
  example: string
  checklist: readonly string[]
  skill: string
}

export const WORKOUTS: Record<WorkoutId, Workout> = {
  'pr-query-timeout': {
    title: 'Responda a um comentário de PR',
    context: 'Você abriu um PR para adicionar uma consulta ao banco. Durante o review, alguém levanta uma dúvida sobre desempenho.',
    comment: 'Could this query time out on large datasets?',
    task: 'Em uma ou duas frases, reconheça o risco e diga como você vai verificar antes do merge.',
    example: 'Good point. I’ll run it against a larger dataset and share the results before we merge.',
    checklist: [
      '“Good point” reconhece a preocupação de quem revisou.',
      '“I’ll run it against a larger dataset” descreve um teste concreto.',
      '“Before we merge” deixa claro quando você dará retorno.',
    ],
    skill: 'Reconhecer um risco e propor um próximo passo em um code review.',
  },
  'pr-duplicate-retry': {
    title: 'Responda a uma dúvida sobre retries',
    context: 'Seu PR adiciona uma nova tentativa de envio de notificações. Uma pessoa do time pergunta o que acontece se a primeira tentativa funcionar e a confirmação se perder.',
    comment: 'Could this retry send the same notification twice?',
    task: 'Responda em inglês. Reconheça o risco e diga como você vai verificar antes do merge.',
    example: 'Good catch. I’ll simulate a lost acknowledgment and check whether the retry sends a duplicate before we merge.',
    checklist: [
      '“Good catch” reconhece o risco apontado no review.',
      '“I’ll simulate a lost acknowledgment” diz em que condição você vai testar.',
      '“Check whether the retry sends a duplicate” explica o resultado que você quer verificar.',
    ],
    skill: 'Explicar como você testaria um caso de falha apontado no review.',
  },
}

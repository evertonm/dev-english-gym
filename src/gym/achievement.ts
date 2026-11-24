export type Technique = { pattern: string; example: string }

export type Achievement = {
  title: string
  description: string
  topics: string[]
  result?: string
  portrait?: string
  technique?: Technique
}

type Topic = { id: string; level: number; label: string }
const shareUrl = 'https://dev-english-br.vercel.app/'
const techniques: ReadonlyMap<string, Technique & { quiz?: RegExp }> = new Map([
  ['questions', {
    pattern: 'What does + sujeito + verbo na forma base?',
    example: 'What does a typical day look like?',
    quiz: /^what does\b/i,
  }],
  ['polite', {
    pattern: 'Could you + verbo na forma base?',
    example: 'Could you review my PR?',
    quiz: /^could you\b/i,
  }],
  ['past', {
    pattern: 'Did + sujeito + verbo na forma base?',
    example: 'Did you merge the PR?',
    quiz: /^did\b/i,
  }],
  ['perfect', {
    pattern: 'Have / has + particípio + for ou since',
    example: 'I have worked with React for five years.',
    quiz: /\b(?:have|has|['’]ve|['’]s)\s+\w+.*\b(?:for|since)\b/i,
  }],
  ['conditionals', {
    pattern: 'If + presente, will + verbo na forma base',
    example: "If the build fails, we'll roll back.",
    quiz: /^if\b.+,.*\bwill\b/i,
  }],
  ['modals', {
    pattern: 'Should + verbo na forma base',
    example: 'We should add monitoring.',
    quiz: /\bshould (?!have\b)\w+/i,
  }],
  ['passive', {
    pattern: 'Has / have been + particípio',
    example: 'The fix has been deployed.',
    quiz: /\b(?:has|have) been\b/i,
  }],
  ['phrasal', {
    pattern: 'Look into + problema',
    example: "I'll look into it.",
    quiz: /\blook into\b/i,
  }],
  ['unit-standup', {
    pattern: 'Yesterday I + verbo no passado',
    example: 'Yesterday I worked on the login bug.',
  }],
  ['unit-review', {
    pattern: 'Could we + verbo na forma base?',
    example: 'Could we rename this variable?',
  }],
  ['pr-query-timeout', {
    pattern: 'I’ll + verbo na forma base',
    example: 'I’ll run it against a larger dataset.',
  }],
  ['pr-duplicate-retry', {
    pattern: 'Check whether + sujeito + verbo',
    example: 'I’ll check whether the retry sends a duplicate.',
  }],
])

export function practiceTechnique(ids: Iterable<string>): Technique | undefined {
  for (const id of ids) {
    const entry = techniques.get(id)
    if (entry) return { pattern: entry.pattern, example: entry.example }
  }
}

export function quizTechniqueId(lessonId: string, correctSentence: string): string | undefined {
  if (techniques.get(lessonId)?.quiz?.test(correctSentence)) return lessonId
}

const lessonApplications: Record<string, string> = {
  past: 'Contar em inglês o que fiz no trabalho',
  present: 'Descrever minha rotina e em que estou trabalhando',
  future: 'Explicar planos e alinhar prazos',
  conditionals: 'Explicar riscos e planos de rollback',
  modals: 'Sugerir ações e discutir causas de um incidente',
  passive: 'Escrever resumos de incidentes e release notes',
  phrasal: 'Falar sobre investigar bugs e reverter releases',
  tradeoffs: 'Explicar os prós e contras de uma decisão técnica',
}

export function lessonShareTopic(lesson: { id: string; t: string; s?: string }): string {
  return lessonApplications[lesson.id] ?? (lesson.s || lesson.t)
}

const unitApplications: Record<string, string> = {
  standup: 'Dar uma atualização na daily e sinalizar bloqueios',
  help: 'Pedir ajuda e esclarecer uma dúvida',
  review: 'Comentar e responder em pull requests',
  meet: 'Dar minha opinião e alinhar prazos em reuniões',
  bugs: 'Descrever bugs e discutir ações em produção',
}

export function unitShareTopic(unit: { id: string; t: string; s?: string }): string {
  return unitApplications[unit.id] ?? (unit.s || unit.t)
}

export function completedTopics(
  topics: readonly Topic[],
  scores: Record<string, number>,
  level?: number,
): string[] {
  const completed = topics.filter(topic => scores[topic.id] > 0 && (level === undefined || topic.level === level))
  return [...new Set(completed.map(topic => topic.label))].slice(0, 3)
}

export function bossAchievement(
  world: string,
  boss: string,
  topics: string[],
  score?: { right: number; total: number; xp: number },
): Achievement {
  return {
    title: 'Chefão derrotado!',
    description: boss ? `Derrotei ${boss} em ${world}.` : `Venci o desafio final de ${world}.`,
    topics,
    result: score ? `${score.right}/${score.total} acertos · +${score.xp} XP` : undefined,
  }
}

export function shareCaption({ title, description, topics, result, technique }: Achievement): string {
  const practice = topics.length ? 'O que pratiquei:\n' + topics.map(topic => '• ' + topic).join('\n') : ''
  const structure = technique ? `Estrutura em inglês\n${technique.pattern}\n“${technique.example}”` : ''
  return [title, description, practice, structure, result, 'Dev English Gym\n' + shareUrl].filter(Boolean).join('\n\n')
}

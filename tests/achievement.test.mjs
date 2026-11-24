import assert from 'node:assert/strict'
import { test } from 'node:test'
import { bossAchievement, completedTopics, lessonShareTopic, practiceTechnique, quizTechniqueId, shareCaption, unitShareTopic } from '../src/gym/achievement.ts'
import { rememberBossTopics, savedBossTopicIds } from '../shared/boss-topics.ts'

test('describes a grammar lesson through its practical application', () => {
  assert.equal(lessonShareTopic({ id: 'conditionals', t: 'Hipóteses', s: 'If, will e would' }),
    'Explicar riscos e planos de rollback')
  assert.equal(lessonShareTopic({ id: 'interview', t: 'Entrevistas' }), 'Entrevistas')
  assert.equal(unitShareTopic({ id: 'standup', t: 'Daily standup' }), 'Dar uma atualização na daily e sinalizar bloqueios')
})

test('selects only recorded topics from the relevant world', () => {
  const topics = [
    { id: 'past', level: 0, label: 'Contar o que fiz ontem' },
    { id: 'call', level: 0, label: 'Pedir ajuda' },
    { id: 'review', level: 0, label: 'Pedir ajuda' },
    { id: 'missing', level: 0, label: 'Dar feedback' },
    { id: 'advanced', level: 1, label: 'Explicar decisões' },
  ]
  assert.deepEqual(completedTopics(topics, { past: 1, call: 3, review: 1, advanced: 2, missing: 0 }, 0),
    ['Contar o que fiz ontem', 'Pedir ajuda'])
})

test('the boss card combines the result with practiced topics', () => {
  const card = bossAchievement('Vila Júnior', 'Líder de equipe', ['Contar o que fiz ontem'], { right: 9, total: 10, xp: 95 })
  assert.equal(card.title, 'Chefão derrotado!')
  assert.equal(card.description, 'Derrotei Líder de equipe em Vila Júnior.')
  assert.equal(card.result, '9/10 acertos · +95 XP')
  assert.match(shareCaption(card), /O que pratiquei:\n• Contar o que fiz ontem/)
  assert.match(shareCaption(card), /https:\/\/dev-english-br\.vercel\.app\//)
})

test('a previous or placement boss win never invents topics or a score', () => {
  const card = bossAchievement('Torre Sênior', 'Tech Lead', [])
  const caption = shareCaption(card)
  assert.equal(card.result, undefined)
  assert.deepEqual(card.topics, [])
  assert.doesNotMatch(caption, /O que pratiquei|acertos|XP/)
})

test('preserves up to three evidenced topics in a serializable boss record', () => {
  const board = { w1t15: 1 }
  rememberBossTopics(board, 1, ['lesson-past', 'invalid:topic', 'bank-n1', 'lesson-past', 'lesson-help'])
  rememberBossTopics(board, 1, ['lesson-review'])
  assert.deepEqual(savedBossTopicIds(JSON.parse(JSON.stringify(board)), 1), ['lesson-past', 'bank-n1', 'lesson-help'])
  assert.deepEqual(savedBossTopicIds(board, 0), [])
})

test('uses What does only for a completed lesson or the matching quiz structure', () => {
  assert.equal(quizTechniqueId('questions', 'Where is the team based?'), undefined)
  assert.equal(quizTechniqueId('questions', 'What does a typical day look like?'), 'questions')
  assert.deepEqual(practiceTechnique(['unknown', 'lesson-questions', 'questions']), {
    pattern: 'What does + sujeito + verbo na forma base?',
    example: 'What does a typical day look like?',
  })
  assert.equal(practiceTechnique(['lesson-questions', 'unknown']), undefined)
})

test('shares the reusable technique and its example with the achievement', () => {
  const card = bossAchievement('Vila Júnior', 'Rita', [])
  assert.doesNotMatch(shareCaption(card), /Estrutura em inglês/)
  card.technique = practiceTechnique(['questions'])
  assert.match(shareCaption(card), /Estrutura em inglês\nWhat does \+ sujeito \+ verbo na forma base\?\n“What does a typical day look like\?”/)
})

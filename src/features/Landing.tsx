import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { animate } from 'animejs/animation'
import { cubicBezier } from 'animejs/easings'
import { GUEST_PRACTICE_LIMIT } from '../gym/guest-practice'
import { APP_TABS } from '../../shared/routes'
import { LandingIntro } from './LandingIntro'
import { WORLD_NAMES, WORLD_TAGS } from '../gym/worlds'
import './landing.css'

const scenarios = [
  {
    title: 'Daily',
    prompt: 'Any blockers on your side?',
    answers: ['I have a difficulty with the API response.', 'I’m blocked on the API response.'],
    feedback: 'Use “I’m blocked on…” para dizer o que está travando seu trabalho.',
    hint: 'Na daily, “I’m blocked on…” é uma forma natural de introduzir um impedimento.',
    correct: 1,
  },
  {
    title: 'Code review',
    prompt: 'Could you add a test for this edge case?',
    answers: ['I’ll cover that case and push an update.', 'I will make a test and send a new code.'],
    feedback: '“Cover that case” é uma forma natural de dizer que o teste vai cobrir esse cenário.',
    hint: '“Add a test” ou “cover that case” soa mais natural do que “make a test”.',
    correct: 0,
  },
  {
    title: 'Entrevista',
    prompt: 'How long have you worked with Node.js?',
    answers: ['I’ve worked with Node.js for four years.', 'I work with Node.js since four years.'],
    feedback: 'Use “I’ve worked” para falar de uma experiência que começou no passado e continua. “For” indica a duração.',
    hint: 'Para indicar a duração de algo que continua até hoje, use “I’ve worked… for…”.',
    correct: 0,
  },
] as const

const worlds = [
  { title: 'Conte o que você fez na daily.', note: 'Descreva o que aconteceu, peça ajuda e responda a comentários de PR.', example: 'I fixed the login bug yesterday.', image: '/bosses/boss-1.webp' },
  { title: 'Apresente sua experiência.', note: 'Conte histórias de projetos e explique sua contribuição em entrevistas.', example: 'Let me walk you through what I built.', image: '/bosses/boss-2.webp' },
  { title: 'Defenda uma decisão técnica.', note: 'Compare opções, explique riscos e negocie alternativas.', example: 'If the build fails, we’ll roll back.', image: '/bosses/boss-3.webp' },
  { title: 'Conduza conversas difíceis.', note: 'Dê feedback, alinhe expectativas e lidere discussões de time.', example: 'I’d like to hear how you see this.', image: '/bosses/boss-4.webp' },
  { title: 'Comunique decisões complexas.', note: 'Adapte seu tom para conversas de liderança e apresentações.', example: 'Here’s the trade-off we need to consider.', image: '/bosses/boss-5.webp' },
] as const

const sections = [
  ['#conversacao', 'Conversação'],
  ['#trilha', 'Trilha'],
  ['#duvidas', 'Dúvidas'],
] as const

const benefits = [
  ['Explique o que travou sua tarefa', 'Na daily, conte o que já fez, o que está bloqueado e de que ajuda precisa.'],
  ['Peça mudanças com clareza', 'Pratique como sugerir ajustes num PR e discordar de uma decisão sem perder o tom.'],
  ['Conte sua parte no projeto', 'Simule uma entrevista de recrutamento ou técnica em voz ou texto e receba feedback sobre suas respostas.'],
] as const

const steps = [
  ['Encontre seu ponto de partida', 'Faça o teste de nível ou escolha por onde começar.'],
  ['Treine em situações de trabalho', 'Passe por aulas curtas e atividades de inglês para reuniões, mensagens e entrevistas.'],
  ['Enfrente o chefão do mundo', 'Mostre o que aprendeu para abrir o próximo mundo da trilha.'],
] as const

const questions = [
  ['Preciso criar conta para experimentar?', `Você pode fazer ${GUEST_PRACTICE_LIMIT} atividades sem login. Depois, crie sua conta para guardar o progresso e continuar.`],
  ['Qual nível de inglês eu preciso ter?', 'A trilha vai do A2 ao C2. O teste de nível ajuda a escolher por onde começar.'],
  ['O que acontece se eu errar uma resposta?', 'Você recebe feedback com uma forma mais natural de responder. Na demonstração, pode testar a outra opção na hora.'],
  ['Preciso usar o microfone?', 'Na entrevista simulada, você pode praticar por voz ou escrever suas respostas.'],
  ['Como desbloqueio o próximo mundo?', 'Ao vencer o chefão do seu mundo atual, você libera o seguinte.'],
  ['A trilha tem certificado?', 'Os mundos principais têm um certificado verificável, disponível após a conclusão do mundo.'],
] as const

const tagline = ['Da mensagem no PR', 'à conversa ao vivo.'] as const
const orbitAngle = (position: number) => position * 72 - 90
const landEase = cubicBezier(.22, 1, .36, 1)

function Header({ onLogin }: { onLogin: () => void }) {
  const menu = useRef<HTMLDialogElement>(null)
  const [open, setOpen] = useState(false)

  const openMenu = () => {
    menu.current?.showModal()
    setOpen(true)
  }

  return (
    <header className="lp-header">
      <div className="lp-header-bar">
        <a href="/" aria-current="page"><Brand /></a>
        <nav aria-label="Seções da página">
          {sections.map(([href, label]) => <a key={href} href={href}>{label}</a>)}
        </nav>
        <button className="lp-login button-sm" type="button" onClick={onLogin}>Entrar</button>
        <button className="lp-menu-toggle" type="button" aria-label="Abrir menu" aria-controls="lp-menu" aria-expanded={open} onClick={openMenu}>
          <span /><span />
        </button>
      </div>
      <dialog id="lp-menu" className="lp-menu" ref={menu} onClose={() => setOpen(false)} aria-label="Menu">
        <div className="lp-menu-top">
          <Brand />
          <button className="lp-menu-toggle" type="button" aria-label="Fechar menu" data-close onClick={() => menu.current?.close()}>
            <span /><span />
          </button>
        </div>
        <nav aria-label="Seções da página">
          {sections.map(([href, label], index) => (
            <a key={href} href={href} className="heading-4" style={{ '--index': index } as CSSProperties} onClick={() => menu.current?.close()}>{label}</a>
          ))}
        </nav>
      </dialog>
    </header>
  )
}

function Brand() {
  return (
    <span className="lp-brand body-4">
      <img src="/logo192.png" width="38" height="38" alt="" />
      <span>Dev English<span className="lp-brand-gym">Gym</span></span>
    </span>
  )
}

function StartButton({ onStart }: { onStart: () => void }) {
  return (
    <button className="lp-button button-md" type="button" onClick={onStart}>
      Começar treino grátis <span className="lp-arrow" aria-hidden="true">↗</span>
    </button>
  )
}

function ConversationFeature() {
  return (
    <section className="lp-wrap lp-conversation" id="conversacao" aria-labelledby="conversation-title" data-lp-reveal>
      <div className="lp-conversation-copy">
        <h2 id="conversation-title" className="heading-2">Converse em inglês com a IA.</h2>
        <p className="body-2">Simule uma daily ou uma conversa com recrutador. Responda por voz ou por texto e receba sugestões para soar mais natural.</p>
        <div className="lp-conversation-action">
          <a className="lp-button button-md" href={APP_TABS.chat}>Ir para conversação <span className="lp-arrow" aria-hidden="true">↗</span></a>
          <p className="caption-1">Entre na sua conta para iniciar uma conversa.</p>
        </div>
      </div>
      <figure className="lp-chat-preview lp-glass-panel">
        <figcaption className="caption-3">Exemplo de conversa na daily</figcaption>
        <div className="lp-chat-turn">
          <span className="caption-3">IA</span>
          <p className="body-1" lang="en">Any blockers today?</p>
        </div>
        <div className="lp-chat-turn lp-chat-you">
          <span className="caption-3">Você</span>
          <p className="body-1" lang="en">I’m with a problem in the API.</p>
        </div>
        <div className="lp-chat-tip">
          <span className="caption-3">Mais natural</span>
          <p className="body-1" lang="en">I’m blocked on an API issue.</p>
        </div>
      </figure>
    </section>
  )
}

function PracticeDemo() {
  const [demo, setDemo] = useState<{ selected: number; answer: number | null }>({
    selected: 0, answer: null,
  })
  const example = scenarios[demo.selected]
  const solved = demo.answer === example.correct
  return (
    <section className="lp-stage lp-glass-panel" id="demo" aria-label="Experimente um treino">
      <div className="lp-demo-switch" role="group" aria-label="Situação de trabalho">
        {scenarios.map((item, selected) => (
          <button key={item.title} type="button" aria-pressed={demo.selected === selected}
            onClick={() => {
              if (demo.selected !== selected || demo.answer !== null) setDemo({ selected, answer: null })
            }}>
            <span className="body-5">{item.title}</span>
          </button>
        ))}
      </div>
      <div className="lp-exercise">
        <div className="lp-exercise-copy" key={demo.selected}>
          <p className="lp-exercise-prompt heading-4" lang="en">“{example.prompt}”</p>
          <p className="lp-choose caption-1">Como você responderia?</p>
        </div>
        <div className="lp-exercise-interaction">
          <div className="lp-choices" role="group" aria-label="Opções de resposta">
            {example.answers.map((answer, index) => (
              <button className="button-sm" key={answer} type="button" lang="en" aria-pressed={demo.answer === index}
                data-outcome={demo.answer === index ? (solved ? 'correct' : 'retry') : undefined}
                onClick={() => setDemo({ ...demo, answer: index })}>
                <span>{answer}</span>
                <span className="lp-arrow" aria-hidden="true">{demo.answer === index && solved ? '✓' : '→'}</span>
              </button>
            ))}
          </div>
          <div className="lp-exercise-feedback caption-1" role="status">
            {demo.answer !== null && <p><strong>{solved ? 'Boa resposta.' : 'Tente outra opção.'}</strong> {solved ? example.feedback : example.hint}</p>}
          </div>
        </div>
      </div>
    </section>
  )
}

function TrainingTrack() {
  const [selected, setSelected] = useState(0)
  const stage = worlds[selected]
  const arm = useRef<HTMLDivElement>(null)
  const bearing = useRef({ angle: orbitAngle(0) })

  useEffect(() => {
    const pointer = arm.current
    if (!pointer) return
    const state = bearing.current
    const diff = ((orbitAngle(selected) - state.angle) % 360 + 540) % 360 - 180
    if (!diff) return
    const angle = state.angle + diff
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      state.angle = angle
      pointer.style.rotate = `${angle}deg`
      return
    }
    const rotation = animate(state, {
      angle,
      duration: 500,
      ease: landEase,
      onRender: () => { pointer.style.rotate = `${state.angle}deg` },
    })
    return () => { rotation.cancel() }
  }, [selected])

  return (
    <section className="lp-track" id="trilha" aria-labelledby="track-title" data-lp-reveal>
      <div className="lp-wrap">
        <div className="lp-section-intro">
          <h2 id="track-title" className="heading-2">Todo mundo tem um chefão.</h2>
          <p className="body-2">Explore o que você pratica em cada nível, do A2 ao C2.</p>
        </div>
        <div className="lp-world lp-glass-panel">
          <div className="lp-orbit" role="group" aria-label="Prévia dos níveis de inglês">
            <div className="lp-orbit-ring" aria-hidden="true" />
            <div className="lp-orbit-arm" ref={arm} aria-hidden="true" />
            <div className="lp-orbit-core">
              <img key={selected} src={stage.image} width="320" height="320" loading="lazy" decoding="async" alt={`Chefão de ${WORLD_NAMES[selected]}`} />
            </div>
            {worlds.map((_, index) => {
              const angle = orbitAngle(index) * Math.PI / 180
              const point = {
                '--x': `${50 + Math.cos(angle) * 36}%`,
                '--y': `${50 + Math.sin(angle) * 36}%`,
              } as CSSProperties
              return (
                <button key={WORLD_TAGS[index]} className="lp-orbit-node button-sm" type="button" style={point}
                  aria-label={`${WORLD_TAGS[index]} ${WORLD_NAMES[index]}`} aria-pressed={index === selected}
                  onClick={() => setSelected(index)}>
                  {WORLD_TAGS[index]}
                </button>
              )
            })}
          </div>
          <article className="lp-world-copy" aria-live="polite" aria-atomic="true">
            <div key={selected}>
              <p className="caption-3">{WORLD_TAGS[selected]} · {WORLD_NAMES[selected]}</p>
              <h3 className="heading-3">{stage.title}</h3>
              <p className="body-5">{stage.note}</p>
              <p className="lp-world-example body-4" lang="en">“{stage.example}”</p>
            </div>
          </article>
        </div>
        <p className="lp-track-detail caption-1">Certificado verificável ao concluir cada mundo principal.</p>
      </div>
    </section>
  )
}

function Tagline() {
  return (
    <section className="lp-tagline" aria-label={tagline.join(' ')}>
      <div className="lp-wrap lp-tagline-sticky">
        <p className="heading-1" aria-hidden="true">
          {tagline.map(line => (
            <span className="lp-tagline-line" key={line}>
              {line.split(' ').map(word => <span key={word} className="lp-tagline-word">{word}</span>)}
            </span>
          ))}
        </p>
      </div>
    </section>
  )
}

export function Landing({ onStart, onLogin }: { onStart: () => void; onLogin: () => void }) {
  const page = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = page.current
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const quote = root.querySelector<HTMLElement>('.lp-tagline')
    if (!quote) return
    const words = [...quote.querySelectorAll<HTMLElement>('.lp-tagline-word')]
    let frame = 0
    let revealed = 0
    quote.dataset.motion = 'true'
    const update = () => {
      frame = 0
      const viewport = root.getBoundingClientRect()
      const distance = quote.getBoundingClientRect().top - viewport.top
      const progress = (viewport.height * .65 - distance) / (viewport.height * .68)
      const count = Math.min(words.length, Math.floor(progress * words.length))
      while (revealed < count) words[revealed++].dataset.lit = 'true'
      if (revealed === words.length) root.removeEventListener('scroll', schedule)
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    root.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    schedule()

    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.setAttribute('data-visible', '')
        observer?.unobserve(entry.target)
      }
    }, { root, threshold: .08 })
    root.querySelectorAll('[data-lp-reveal]').forEach(section => observer?.observe(section))

    return () => {
      observer?.disconnect()
      if (frame) cancelAnimationFrame(frame)
      root.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      delete quote.dataset.motion
    }
  }, [])

  return (
    <div className="lp" ref={page}>
      <a className="lp-skip button-sm" href="#lp-main">Pular para o conteúdo</a>
      <Header onLogin={onLogin} />

      <main id="lp-main" tabIndex={-1}>
        <LandingIntro action={<StartButton onStart={onStart} />} />

        <ConversationFeature />

        <section className="lp-wrap lp-demo-section" aria-labelledby="demo-title">
          <div className="lp-demo-section-head">
            <h2 id="demo-title" className="heading-2">Experimente um exercício.</h2>
            <p className="body-2">Escolha a situação e veja como soa uma resposta natural em inglês.</p>
          </div>
          <PracticeDemo />
        </section>

        <section className="lp-wrap lp-practice" id="pratica" aria-labelledby="practice-title" data-lp-reveal>
          <div className="lp-section-intro">
            <h2 id="practice-title" className="heading-2">Você sabe a resposta. Treine como falar.</h2>
          </div>
          <div className="lp-feature-list">
            {benefits.map(([title, description]) => (
              <article key={title}>
                <h3 className="heading-6">{title}</h3>
                <p className="body-5">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <Tagline />

        <section className="lp-wrap lp-practice" aria-labelledby="steps-title" data-lp-reveal>
          <div className="lp-section-intro">
            <h2 id="steps-title" className="heading-2">Do primeiro treino ao chefão.</h2>
          </div>
          <ol className="lp-feature-list lp-steps">
            {steps.map(([title, description]) => (
              <li key={title}>
                <h3 className="heading-6">{title}</h3>
                <p className="body-5">{description}</p>
              </li>
            ))}
          </ol>
        </section>

        <TrainingTrack />

        <section className="lp-wrap lp-practice lp-faq" id="duvidas" aria-labelledby="faq-title" data-lp-reveal>
          <h2 id="faq-title" className="heading-2">Perguntas frequentes</h2>
          <div className="lp-faq-list lp-glass-panel">
            {questions.map(([question, answer]) => (
              <details key={question}>
                <summary className="body-1">{question}<span aria-hidden="true">+</span></summary>
                <p className="body-5">{answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="lp-wrap lp-end-wrap" aria-labelledby="finish-title">
          <div className="lp-end lp-glass-panel">
            <div>
              <h2 id="finish-title" className="heading-2">Qual vai ser sua primeira resposta?</h2>
              <p className="body-2">Experimente {GUEST_PRACTICE_LIMIT} atividades antes de criar uma conta.</p>
            </div>
            <StartButton onStart={onStart} />
          </div>
        </section>
      </main>

      <footer className="lp-wrap lp-footer">
        <Brand />
        <div className="caption-1"><a href="/privacidade.html">Privacidade</a><a href="/termos.html">Termos</a></div>
      </footer>
    </div>
  )
}

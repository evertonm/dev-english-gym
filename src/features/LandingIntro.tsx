import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { GUEST_PRACTICE_LIMIT } from '../gym/guest-practice'
import './landing-intro.css'

const views = [
  { id: 'board', label: 'Tabuleiro', title: 'Veja o que praticar hoje', detail: 'Encontre seu treino do dia e acompanhe seu progresso na trilha.', alt: 'Tela Seu treino do Dev English com a prática do dia e o tabuleiro Vila Júnior.' },
  { id: 'workout', label: 'Exercício', title: 'Escreva como faria no trabalho', detail: 'Leia um comentário de pull request e formule sua própria resposta em inglês.', alt: 'Exercício de code review com a pergunta em inglês e o campo para responder.' },
  { id: 'feedback', label: 'Feedback', title: 'Compare e leve uma frase com você', detail: 'Veja uma resposta possível e entenda por que cada parte funciona.', alt: 'Tela de feedback com a resposta enviada, um exemplo comentado e três dicas.' },
] as const

const clamp = (value: number) => Math.min(1, Math.max(0, value))
const tourMedia = '(min-width: 800px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)'
const stickyOffset = 96

export function LandingIntro({ action }: { action: ReactNode }) {
  const tour = useRef<HTMLElement>(null)
  const frame = useRef<HTMLDivElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState(0)

  useEffect(() => {
    const section = tour.current
    const card = frame.current
    const root = section?.closest<HTMLElement>('.lp')
    if (!root || !section || !card) return
    const media = window.matchMedia(tourMedia)
    const motion = window.matchMedia('(prefers-reduced-motion: no-preference)')
    let request = 0
    let previous = -1

    const update = () => {
      request = 0
      if (!motion.matches) {
        card.style.removeProperty('--tour-entrance')
        return
      }
      const distance = section.getBoundingClientRect().top - root.getBoundingClientRect().top
      const entrance = clamp((root.clientHeight - distance) / (root.clientHeight * .85))
      card.style.setProperty('--tour-entrance', String(entrance))
      if (!media.matches) return
      const travel = section.offsetHeight - card.offsetHeight
      const progress = clamp((stickyOffset - distance) / Math.max(travel, 1))
      const chapter = Math.min(views.length - 1, Math.floor(progress * views.length))
      card.style.setProperty('--tour-progress', String(progress))
      if (chapter !== previous) {
        previous = chapter
        setSelected(chapter)
      }
    }
    const queue = () => {
      if (!request && motion.matches) request = requestAnimationFrame(update)
    }
    const changePreference = () => {
      if (motion.matches) queue()
      else card.style.removeProperty('--tour-entrance')
    }
    root.addEventListener('scroll', queue, { passive: true })
    window.addEventListener('resize', queue)
    media.addEventListener('change', queue)
    motion.addEventListener('change', changePreference)
    queue()
    return () => {
      if (request) cancelAnimationFrame(request)
      root.removeEventListener('scroll', queue)
      window.removeEventListener('resize', queue)
      media.removeEventListener('change', queue)
      motion.removeEventListener('change', changePreference)
    }
  }, [])

  useEffect(() => {
    const surface = stage.current
    if (!surface) return
    const media = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)')
    let point: PointerEvent | null = null
    let request = 0

    const clear = () => {
      if (request) cancelAnimationFrame(request)
      request = 0
      point = null
      for (const key of ['--light-x', '--light-y', '--shift-x', '--shift-y', '--tilt-x', '--tilt-y']) surface.style.removeProperty(key)
    }
    const paint = () => {
      request = 0
      if (!media.matches || !point) return
      const bounds = surface.getBoundingClientRect()
      const x = clamp((point.clientX - bounds.left) / bounds.width)
      const y = clamp((point.clientY - bounds.top) / bounds.height)
      surface.style.setProperty('--light-x', `${x * 100}%`)
      surface.style.setProperty('--light-y', `${y * 100}%`)
      surface.style.setProperty('--shift-x', `${(x - .5) * 18}px`)
      surface.style.setProperty('--shift-y', `${(y - .5) * 12}px`)
      surface.style.setProperty('--tilt-x', `${(.5 - y) * 5}deg`)
      surface.style.setProperty('--tilt-y', `${(x - .5) * 7}deg`)
    }
    const move = (event: PointerEvent) => {
      if (!media.matches || event.pointerType === 'touch') return
      point = event
      if (!request) request = requestAnimationFrame(paint)
    }
    surface.addEventListener('pointermove', move, { passive: true })
    surface.addEventListener('pointerleave', clear)
    media.addEventListener('change', clear)
    return () => {
      clear()
      surface.removeEventListener('pointermove', move)
      surface.removeEventListener('pointerleave', clear)
      media.removeEventListener('change', clear)
    }
  }, [])

  function openView(index: number) {
    setSelected(index)
    const section = tour.current
    const card = frame.current
    const root = section?.closest<HTMLElement>('.lp')
    if (!root || !section || !card || !window.matchMedia(tourMedia).matches) return
    const travel = section.offsetHeight - card.offsetHeight
    const firstFrame = root.scrollTop + section.getBoundingClientRect().top - root.getBoundingClientRect().top - stickyOffset
    root.scrollTo({ top: firstFrame + travel * (index + .15) / views.length, behavior: 'instant' })
  }

  const view = views[selected]
  return (
    <section className="lp-product-intro" aria-labelledby="hero-title">
      <div className="lp-wrap lp-product-copy">
        <h1 id="hero-title">Pratique o inglês<br className="lp-title-break" /> <strong>do seu trabalho.</strong></h1>
        <div>
          <p className="body-2">Converse com a IA por voz ou texto e pratique o inglês de dailies, code reviews e entrevistas.</p>
          <div className="lp-product-actions">
            {action}
            <a href="#demo" className="button-sm">Testar exercício <span aria-hidden="true">↓</span></a>
          </div>
          <p className="caption-1">{GUEST_PRACTICE_LIMIT} atividades sem login.</p>
        </div>
      </div>
      <section ref={tour} className="lp-wrap lp-product-tour" data-view={view.id} aria-label="Conheça o Dev English por dentro">
        <div className="lp-product-frame" ref={frame}>
          <div className="lp-product-stage" ref={stage}>
            <div className="lp-product-light" aria-hidden="true" />
            <div className="lp-product-rail" role="group" aria-label="Telas do Dev English">
              {views.map((item, index) => (
                <button key={item.id} type="button" className="button-sm" aria-pressed={selected === index} onClick={() => openView(index)}>
                  {item.label}
                </button>
              ))}
            </div>
            <div className="lp-product-deck">
              {views.map((item, index) => (
                <picture key={item.id} className="lp-product-shot" data-position={(index - selected + views.length) % views.length} aria-hidden={index !== selected ? true : undefined}>
                  <source media="(max-width: 620px)" srcSet={`/landing/${item.id}-mobile.webp`} />
                  <img src={`/landing/${item.id}.webp`} alt={item.alt} width="880" height="560" decoding="async" fetchPriority={index === 0 ? 'high' : 'auto'} />
                </picture>
              ))}
            </div>
          </div>
          <div className="lp-product-caption">
            <div key={view.id}>
              <h2 className="heading-6">{view.title}</h2>
              <p className="body-5">{view.detail}</p>
            </div>
            <div className="lp-product-progress" aria-hidden="true" />
          </div>
        </div>
      </section>
    </section>
  )
}

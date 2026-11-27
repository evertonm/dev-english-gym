import { useState } from 'react'
import { Icon } from './Icon'

export type OnboardChoice = { purpose: string; goal: number; placement: boolean }

const PURPOSES: [string, string, string][] = [
  ['job', 'target-arrow', 'Conseguir vaga internacional'],
  ['team', 'users-group', 'Trabalhar melhor com time gringo'],
  ['travel', 'plane', 'Viajar ou me mudar para os EUA'],
  ['grow', 'chart-line', 'Só melhorar meu inglês'],
]
const GOALS: [number, string, string][] = [
  [30, 'Leve', '5 min por dia'],
  [50, 'Regular', '10 min por dia'],
  [100, 'Intenso', '20 min por dia'],
]

export function Onboarding({ onDone, onSkip }: { onDone: (c: OnboardChoice) => void; onSkip: () => void }) {
  const [step, setStep] = useState(0)
  const [purpose, setPurpose] = useState('')
  const [goal, setGoal] = useState(50)
  return (
    <div className="sheet-bg" role="dialog" aria-modal="true" aria-label="Bem-vindo ao Dev English">
      <div className="sheet">
        <p className="note">Passo {step + 1} de 3</p>
        {step === 0 && (
          <>
            <p className="sheet-title">Qual é seu objetivo?</p>
            {PURPOSES.map(([k, e, t]) => (
              <button
                key={k}
                type="button"
                className="btn alt"
                aria-pressed={purpose === k}
                onClick={() => {
                  setPurpose(k)
                  setStep(1)
                }}
              >
                <Icon name={e} /> {t}
              </button>
            ))}
          </>
        )}
        {step === 1 && (
          <>
            <p className="sheet-title">Quanto tempo por dia?</p>
            {GOALS.map(([g, n, d]) => (
              <button
                key={g}
                type="button"
                className="btn alt"
                aria-pressed={goal === g}
                onClick={() => {
                  setGoal(g)
                  setStep(2)
                }}
              >
                {n} · {d}
              </button>
            ))}
            <p className="note">Dá para mudar depois no Perfil. Constância vale mais que quantidade.</p>
          </>
        )}
        {step === 2 && (
          <>
            <p className="sheet-title">Vamos achar seu nível?</p>
            <p className="note">
              15 perguntas rápidas, do básico (A2) ao proficiente (C2). Em uns 3 minutos você começa no mundo certo, sem perder tempo com o que já sabe.
              {purpose === 'travel' ? ' O mundo Boarding Pass, com o intensivo para os EUA, fica sempre aberto.' : ''}
            </p>
            <button className="btn" type="button" onClick={() => onDone({ purpose, goal, placement: true })}>
              Fazer o teste de nível
            </button>
            <button className="btn alt" type="button" onClick={() => onDone({ purpose, goal, placement: false })}>
              Começar do zero
            </button>
          </>
        )}
        {step > 0 && (
          <button className="linkbtn" type="button" onClick={() => setStep(step - 1)}>
            Voltar
          </button>
        )}
        <button className="linkbtn" type="button" onClick={onSkip} style={{ alignSelf: 'center' }}>
          Pular
        </button>
      </div>
    </div>
  )
}

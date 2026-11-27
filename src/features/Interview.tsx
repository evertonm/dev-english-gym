import { useEffect, useRef, useState } from 'react'
import { useAction, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { FullPanel, NeedLogin, Seg, aiError, parseJson, playVoice, stopVoice } from './common'
import { Icon } from './Icon'

type Turn = { role: 'user' | 'assistant'; content: string }
type AiLine = { reply: string; pt?: string; better?: string; tip?: string; hint?: string; done?: boolean }
type Item = { who: 'ai'; line: AiLine; showPt?: boolean; showHint?: boolean } | { who: 'me'; text: string; better?: string; tip?: string }
type Report = {
  overall: number
  verdict: string
  scores: Record<string, number>
  strengths: string[]
  improve: { you: string; better: string; why: string }[]
  phrases: string[]
  next: string
}

const ROLES: [string, string][] = [
  ['frontend', 'Frontend'],
  ['backend', 'Backend'],
  ['fullstack', 'Full Stack'],
  ['mobile', 'Mobile'],
  ['data', 'Dados'],
  ['devops', 'DevOps/SRE'],
  ['qa', 'QA'],
]
const STAGES: [string, string][] = [
  ['screen', 'Recrutador'],
  ['technical', 'Técnica'],
  ['behavioral', 'Comportamental'],
  ['final', 'Final com CTO'],
]
const LEVELS: [string, string][] = [
  ['0', 'A2'],
  ['1', 'B1'],
  ['2', 'B2'],
  ['3', 'C1'],
  ['4', 'C2'],
]
const SCORE_NAMES: Record<string, string> = { fluency: 'Fluência', grammar: 'Gramática', vocabulary: 'Vocabulário', clarity: 'Clareza', content: 'Conteúdo' }
const roleName = (k: string) => ROLES.find((r) => r[0] === k)?.[1] ?? k
const stageName = (k: string) => STAGES.find((r) => r[0] === k)?.[1] ?? k

function savedLevel(): string {
  try {
    const v = localStorage.getItem('devenglish-chatlv')
    return v && /^[0-4]$/.test(v) ? v : '1'
  } catch {
    return '1'
  }
}

export function InterviewPanel({ authed, onClose, onLogin }: { authed: boolean; onClose: () => void; onLogin: () => void }) {
  const interview = useAction(api.ai.interview)
  const makeReport = useAction(api.ai.interviewReport)
  const tts = useAction(api.tts.speak)
  const history = useQuery(api.ai.interviewHistory, authed ? {} : 'skip')
  const [role, setRole] = useState('fullstack')
  const [stage, setStage] = useState('screen')
  const [level, setLevel] = useState(savedLevel)
  const [turns, setTurns] = useState<Turn[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [started, setStarted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [text, setText] = useState('')
  const [done, setDone] = useState(false)
  const [report, setReport] = useState<Report | null>(null)
  const [reportBusy, setReportBusy] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' })
  }, [items, busy])
  useEffect(() => () => stopVoice(), [])

  async function ask(next: Turn[]) {
    setBusy(true)
    setErr('')
    try {
      const r = await interview({ role, stage, level: +level, history: next })
      if (!r.ok) {
        setErr(aiError(r.code))
        return false
      }
      const line = parseJson<AiLine>(r.text) ?? { reply: r.text }
      if (!line.reply) line.reply = r.text
      setTurns([...next, { role: 'assistant', content: line.reply }])
      setItems((old) => {
        const out = old.slice()
        const last = out[out.length - 1]
        if (last && last.who === 'me' && (line.better || line.tip)) out[out.length - 1] = { ...last, better: line.better, tip: line.tip }
        out.push({ who: 'ai', line })
        return out
      })
      if (line.done) setDone(true)
      return true
    } catch {
      setErr(aiError('ERROR'))
      return false
    } finally {
      setBusy(false)
    }
  }

  async function start() {
    setStarted(true)
    setTurns([])
    setItems([])
    setDone(false)
    setReport(null)
    const ok = await ask([])
    if (!ok) setStarted(false)
  }

  async function send() {
    const t = text.trim()
    if (!t || busy || done) return
    setText('')
    const next: Turn[] = [...turns, { role: 'user', content: t }]
    setItems((old) => [...old, { who: 'me', text: t }])
    const ok = await ask(next)
    if (!ok) {
      // Give the text back so it can be sent again.
      setItems((old) => old.slice(0, -1))
      setText(t)
    }
  }

  async function finish() {
    setReportBusy(true)
    setErr('')
    stopVoice()
    try {
      const r = await makeReport({ role, stage, level: +level, history: turns })
      if (!r.ok) setErr(aiError(r.code))
      else {
        const rep = parseJson<Report>(r.text)
        if (rep) setReport(rep)
        else setErr(aiError('ERROR'))
      }
    } catch {
      setErr(aiError('ERROR'))
    } finally {
      setReportBusy(false)
    }
  }

  const answers = turns.filter((t) => t.role === 'user').length
  const title = 'Simulador de entrevista'

  if (!authed)
    return (
      <FullPanel title={title} onClose={onClose}>
        <NeedLogin
          onLogin={onLogin}
          text="Treine uma entrevista completa em inglês para vagas remotas: a IA faz o entrevistador, corrige cada resposta e no fim te dá uma nota com relatório. Entre para começar, é grátis."
        />
      </FullPanel>
    )

  if (report)
    return (
      <FullPanel title="Relatório da entrevista" onClose={onClose}>
        <div className="card">
          <div className="score">
            <b>{Math.round(report.overall)}</b>
            <span>/100 · {roleName(role)} · {stageName(stage)}</span>
          </div>
          <p style={{ margin: 0 }}>{report.verdict}</p>
        </div>
        <div className="card">
          <h3>Notas</h3>
          <div className="bars">
            {Object.entries(report.scores || {}).map(([k, n]) => (
              <div key={k}>
                <span>{SCORE_NAMES[k] ?? k}</span>
                <span className="prog">
                  <i style={{ width: Math.max(0, Math.min(10, Number(n) || 0)) * 10 + '%' }} />
                </span>
                <b>{Math.round(Number(n) || 0)}</b>
              </div>
            ))}
          </div>
        </div>
        {report.strengths?.length > 0 && (
          <div className="card">
            <h3>
              <Icon name="check" /> Pontos fortes
            </h3>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {report.strengths.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}
        {report.improve?.length > 0 && (
          <div className="card">
            <h3>
              <Icon name="tool" /> Como responder melhor
            </h3>
            {report.improve.map((m, i) => (
              <div className="chg" key={i}>
                <del lang="en">{m.you}</del>
                <ins lang="en">{m.better}</ins>
                <small>{m.why}</small>
              </div>
            ))}
          </div>
        )}
        {report.phrases?.length > 0 && (
          <div className="card">
            <h3>
              <Icon name="message-circle" /> Frases para levar
            </h3>
            {report.phrases.map((p, i) => (
              <button key={i} type="button" className="linkbtn" lang="en" style={{ textAlign: 'left', textDecoration: 'none' }} onClick={() => void playVoice(tts, p)}>
                <Icon name="volume" /> {p}
              </button>
            ))}
          </div>
        )}
        {report.next && (
          <div className="card">
            <h3>
              <Icon name="arrow-right" /> Próximo passo
            </h3>
            <p style={{ margin: 0 }}>{report.next}</p>
          </div>
        )}
        <button className="btn" type="button" onClick={() => void start()}>
          Nova entrevista
        </button>
        <button className="btn alt" type="button" onClick={onClose}>
          Fechar
        </button>
      </FullPanel>
    )

  if (!started)
    return (
      <FullPanel title={title} onClose={onClose}>
        <p className="note">
          Uma entrevista de verdade, em inglês, com {6} perguntas. Cada resposta recebe uma versão mais natural, e no fim você ganha nota, pontos fortes e o que melhorar.
        </p>
        <p className="lbl">Vaga</p>
        <Seg label="Vaga" value={role} options={ROLES} onChange={setRole} />
        <p className="lbl">Etapa</p>
        <Seg label="Etapa" value={stage} options={STAGES} onChange={setStage} />
        <p className="lbl">Seu nível</p>
        <Seg label="Nível" value={level} options={LEVELS} onChange={setLevel} />
        <button className="btn" type="button" onClick={() => void start()}>
          Começar entrevista
        </button>
        {err && <p className="note">{err}</p>}
        {history && history.length > 0 && (
          <div className="card">
            <h3>Suas últimas entrevistas</h3>
            {history.map((h, i) => (
              <div className="lrow" key={i}>
                <span className="p">{h.overall}</span>
                <span>
                  {roleName(h.role)} · {stageName(h.stage)}
                </span>
                <small>{new Date(h.ts).toLocaleDateString('pt-BR')}</small>
              </div>
            ))}
          </div>
        )}
        <p className="note">Cada pergunta usa 1 mensagem da sua cota diária de IA, e o relatório usa mais 1.</p>
      </FullPanel>
    )

  const footer = (
    <div className="fx-in">
      {done || answers >= 6 ? (
        <button className="btn" type="button" style={{ flex: 1 }} disabled={reportBusy || answers < 2} onClick={() => void finish()}>
          {reportBusy ? 'Gerando relatório…' : 'Ver meu relatório'}
        </button>
      ) : (
        <>
          <textarea
            aria-label="Sua resposta em inglês"
            placeholder="Responda em inglês…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void send()
              }
            }}
            rows={2}
            maxLength={900}
          />
          <button className="btn" type="button" disabled={busy || !text.trim()} onClick={() => void send()}>
            Enviar
          </button>
        </>
      )}
    </div>
  )

  return (
    <FullPanel title={roleName(role) + ' · ' + stageName(stage)} onClose={onClose} footer={footer}>
      <div className="qa">
        {items.map((m, i) =>
          m.who === 'ai' ? (
            <div className="msg ai" key={i}>
              <span className="en" lang="en">
                {m.line.reply}
              </span>
              {m.showPt && m.line.pt && <span className="pt">{m.line.pt}</span>}
              {m.showHint && m.line.hint && (
                <>
                  <span className="pt">Uma boa resposta:</span>
                  <span className="en" lang="en">
                    {m.line.hint}
                  </span>
                </>
              )}
              <div className="tools">
                <button type="button" onClick={() => void playVoice(tts, m.line.reply)}>
                  Ouvir
                </button>
                {m.line.pt && !m.showPt && (
                  <button type="button" onClick={() => setItems((o) => o.map((x, k) => (k === i ? { ...x, showPt: true } : x)))}>
                    Traduzir
                  </button>
                )}
                {i === items.length - 1 && m.line.hint && !m.showHint && !done && (
                  <button type="button" onClick={() => setItems((o) => o.map((x, k) => (k === i ? { ...x, showHint: true } : x)))}>
                    Ver exemplo de resposta
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div key={i}>
              <div className="msg me">
                <span className="en" lang="en">
                  {m.text}
                </span>
              </div>
              {(m.better || m.tip) && (
                <div className="fix">
                  {m.better && (
                    <>
                      <small>Mais natural</small>
                      <span className="en" lang="en">
                        {m.better}
                      </span>
                    </>
                  )}
                  {m.tip && <span>{m.tip}</span>}
                </div>
              )}
            </div>
          ),
        )}
        {busy && <div className="typing">entrevistador digitando…</div>}
        {err && <p className="note">{err}</p>}
        {!done && answers >= 2 && answers < 6 && !busy && (
          <button className="linkbtn" type="button" onClick={() => void finish()} disabled={reportBusy}>
            {reportBusy ? 'Gerando relatório…' : 'Encerrar agora e ver relatório'}
          </button>
        )}
        <div ref={endRef} />
      </div>
    </FullPanel>
  )
}

import { useState } from 'react'
import { useAction, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { FullPanel, NeedLogin, Seg, aiError, copyText, parseJson } from './common'
import { Icon } from './Icon'

type Kind = 'slack' | 'email' | 'pr' | 'review' | 'linkedin' | 'resume'
type Tone = 'casual' | 'neutral' | 'formal'
type Result = { better: string; changes?: { from: string; to: string; why: string }[]; tip?: string }

const KINDS: [Kind, string][] = [
  ['slack', 'Slack'],
  ['email', 'E-mail'],
  ['pr', 'Pull request'],
  ['review', 'Code review'],
  ['linkedin', 'LinkedIn'],
  ['resume', 'Currículo'],
]
const TONES: [Tone, string][] = [
  ['casual', 'Casual'],
  ['neutral', 'Profissional'],
  ['formal', 'Formal'],
]
const PLACEHOLDER: Record<Kind, string> = {
  slack: 'Ex.: oi pessoal, o deploy vai atrasar pq achei um bug no login, devo terminar amanha de manha',
  email: 'Ex.: Olá, gostaria de saber se a vaga ainda está aberta e se posso mandar meu currículo…',
  pr: 'Ex.: arruma bug no checkout quando o cupom é invalido. adicionei teste',
  review: 'Ex.: acho que essa função ta muito grande, da pra quebrar em duas?',
  linkedin: 'Cole seu título ou seu "Sobre" do LinkedIn (em português ou inglês).',
  resume: 'Cole os tópicos da sua experiência. Ex.: Desenvolvi o app de pagamentos em React Native usado por 50 mil pessoas…',
}
const DEFAULT_TONE: Record<Kind, Tone> = { slack: 'casual', email: 'neutral', pr: 'neutral', review: 'casual', linkedin: 'neutral', resume: 'formal' }

export function ToolsPanel({ authed, onClose, onLogin }: { authed: boolean; onClose: () => void; onLogin: () => void }) {
  const polish = useAction(api.ai.polish)
  const quota = useQuery(api.ai.quota, authed ? {} : 'skip')
  const [kind, setKind] = useState<Kind>('slack')
  const [tone, setTone] = useState<Tone>('casual')
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [res, setRes] = useState<Result | null>(null)
  const [copied, setCopied] = useState(false)
  const long = kind === 'resume' || kind === 'linkedin'
  const max = long ? 4000 : 1500

  async function run() {
    const t = text.trim()
    if (t.length < 3 || busy) return
    setBusy(true)
    setErr('')
    setRes(null)
    setCopied(false)
    try {
      const r = await polish({ kind, tone, text: t })
      if (!r.ok) setErr(aiError(r.code))
      else {
        const j = parseJson<Result>(r.text)
        if (j && j.better) setRes({ ...j, better: j.better.replace(/\\n/g, '\n') })
        else setErr(aiError('ERROR'))
      }
    } catch {
      setErr(aiError('ERROR'))
    } finally {
      setBusy(false)
    }
  }

  const title = 'Corretor de mensagens'
  if (!authed)
    return (
      <FullPanel title={title} onClose={onClose}>
        <NeedLogin
          onLogin={onLogin}
          text="Escreva do seu jeito (até em português) e receba a versão em inglês natural para Slack, e-mail, pull request, code review, LinkedIn ou currículo, com explicação de cada mudança. Entre para usar, é grátis."
        />
      </FullPanel>
    )

  return (
    <FullPanel title={title} onClose={onClose}>
      <p className="lbl">Onde vai usar</p>
      <Seg
        label="Tipo de texto"
        value={kind}
        options={KINDS}
        onChange={(k) => {
          setKind(k)
          setTone(DEFAULT_TONE[k])
          setRes(null)
        }}
      />
      <p className="lbl">Tom</p>
      <Seg label="Tom" value={tone} options={TONES} onChange={setTone} />
      <textarea
        aria-label="Seu texto"
        rows={long ? 8 : 5}
        maxLength={max}
        placeholder={PLACEHOLDER[kind]}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <p className="note" style={{ textAlign: 'right' }}>
        {text.length}/{max}
        {quota && quota.ok && !quota.admin ? ` · IA hoje: ${quota.used}/${quota.limit}` : ''}
      </p>
      <button className="btn" type="button" disabled={busy || text.trim().length < 3} onClick={() => void run()}>
        {busy ? 'Melhorando…' : long ? 'Revisar' : 'Deixar em inglês natural'}
      </button>
      {err && <p className="note">{err}</p>}
      {res && (
        <>
          <div className="card">
            <h3>Versão sugerida</h3>
            <div className="out" lang="en">
              {res.better}
            </div>
            <button
              className="btn alt"
              type="button"
              onClick={async () => {
                setCopied(await copyText(res.better))
              }}
            >
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
          {res.changes && res.changes.length > 0 && (
            <div className="card">
              <h3>O que mudou e por quê</h3>
              {res.changes.map((c, i) => (
                <div className="chg" key={i}>
                  {c.from && <del>{c.from}</del>}
                  <ins lang="en">{c.to}</ins>
                  <small>{c.why}</small>
                </div>
              ))}
            </div>
          )}
          {res.tip && <p className="note">
              <Icon name="bulb" /> {res.tip}
            </p>}
        </>
      )}
      <p className="note">Não cole senhas, tokens ou dados de clientes. Cada revisão usa 1 mensagem da sua cota diária de IA.</p>
    </FullPanel>
  )
}

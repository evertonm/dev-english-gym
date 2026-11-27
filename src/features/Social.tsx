import { useEffect, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { CERT_WORLDS, WORLD_NAMES, WORLD_TAGS } from '../gym/worlds'
import { FullPanel, NeedLogin, copyText } from './common'
import { Icon } from './Icon'

const DIV_ICON = ['medal-2', 'medal-2', 'medal', 'diamond', 'crown']

function timeLeft(ends: number): string {
  const ms = Math.max(0, ends - Date.now())
  const d = Math.floor(ms / 86_400_000)
  const h = Math.floor((ms % 86_400_000) / 3_600_000)
  return d > 0 ? `${d}d ${h}h` : `${h}h`
}

function NickEditor() {
  const profile = useQuery(api.social.profile)
  const setNick = useMutation(api.social.setNick)
  const [val, setVal] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  if (!profile) return null
  const v = val ?? profile.nick
  return (
    <div className="card">
      <h3>Seu apelido na liga</h3>
      <div className="copyrow">
        <input className="field" aria-label="Apelido" maxLength={18} value={v} placeholder="Seu apelido" onChange={(e) => setVal(e.target.value)} />
        <button
          className="btn alt"
          type="button"
          disabled={v.trim().length < 2 || v === profile.nick}
          onClick={async () => {
            const r = await setNick({ nick: v }).catch(() => null)
            setMsg(r && r.ok ? 'Salvo' : 'Use de 2 a 18 letras ou números.')
            if (r && r.ok) setVal(null)
          }}
        >
          Salvar
        </button>
      </div>
      {msg && <p className="note">{msg}</p>}
      <p className="note">Só o apelido aparece para os outros. Seu e-mail nunca é mostrado.</p>
    </div>
  )
}

export function LeaguePanel({ authed, onClose, onLogin }: { authed: boolean; onClose: () => void; onLogin: () => void }) {
  const lg = useQuery(api.social.league, authed ? {} : 'skip')
  const title = 'Liga semanal'
  if (!authed)
    return (
      <FullPanel title={title} onClose={onClose}>
        <NeedLogin onLogin={onLogin} text="Toda semana você disputa com até 20 devs pelo XP da semana. Os 5 primeiros sobem de divisão: Bronze, Prata, Ouro, Safira e Diamante. Entre para participar." />
      </FullPanel>
    )
  return (
    <FullPanel title={title} onClose={onClose}>
      {lg === undefined ? (
        <p className="note">Carregando…</p>
      ) : lg === null ? (
        <p className="note">Entre de novo para ver a liga.</p>
      ) : (
        <>
          <div className="divs" aria-label="Divisões">
            {lg.divisions.map((d, i) => (
              <span key={d} className={i === lg.div ? 'on' : ''}>
                <Icon name={DIV_ICON[i]} />
                <br />
                {d}
              </span>
            ))}
          </div>
          <p className="note">
            Termina em <b>{timeLeft(lg.ends)}</b> (domingo, 21h de Brasília). Os 5 primeiros sobem de divisão e os 5 últimos descem.
          </p>
          {!lg.joined ? (
            <div className="card">
              <h3>
                <Icon name={DIV_ICON[lg.div]} /> Liga {lg.divisions[lg.div]}
              </h3>
              <p style={{ margin: 0 }}>Ganhe seu primeiro XP desta semana (uma aula, uma casa do tabuleiro ou um jogo) para entrar num grupo.</p>
            </div>
          ) : (
            <div className="card" style={{ padding: 6 }}>
              {lg.players.map((p) => {
                const up = p.pos <= lg.zone && lg.div < lg.divisions.length - 1
                const down = lg.size >= 10 && p.pos > lg.size - lg.zone && lg.div > 0
                return (
                  <div key={p.pos} className={'lrow' + (p.me ? ' me' : '') + (up ? ' up' : down ? ' down' : '')}>
                    <span className="p">{p.pos}</span>
                    <span>
                      {p.nick}
                      {p.me ? ' (você)' : ''}
                    </span>
                    <b>{p.xp} xp</b>
                  </div>
                )
              })}
              {lg.size < 10 && <p className="note" style={{ padding: 8 }}>Grupo novo: mais devs entram conforme jogam esta semana.</p>}
            </div>
          )}
          <NickEditor />
        </>
      )}
    </FullPanel>
  )
}

export function ReportPanel({ authed, streak, onClose, onLogin }: { authed: boolean; streak: number; onClose: () => void; onLogin: () => void }) {
  const r = useQuery(api.social.weeklyReport, authed ? {} : 'skip')
  const title = 'Relatório da semana'
  if (!authed)
    return (
      <FullPanel title={title} onClose={onClose}>
        <NeedLogin onLogin={onLogin} text="Entre para acompanhar sua semana: XP, posição na liga, entrevistas, aulas e textos corrigidos." />
      </FullPanel>
    )
  if (!r)
    return (
      <FullPanel title={title} onClose={onClose}>
        <p className="note">Carregando…</p>
      </FullPanel>
    )
  const diff = r.lastXp > 0 ? Math.round(((r.xp - r.lastXp) / r.lastXp) * 100) : null
  const shareText = `Minha semana no Dev English: ${r.xp} XP${r.rank ? `, ${r.rank}º lugar na liga` : ''}, ${r.lessons} aulas e ${streak} dias de ofensiva. Bora treinar inglês pra vaga gringa?`
  return (
    <FullPanel title={title} onClose={onClose}>
      {r.lastXp > 0 && r.xp === 0 && (
        <div className="card">
          <h3>Semana passada: {r.lastXp} XP</h3>
          <p style={{ margin: 0 }}>Uma semana nova começou. Ganhe XP hoje para entrar na liga desta semana.</p>
        </div>
      )}
      <p className="note">Semana de {new Date(r.week + 'T12:00:00Z').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} até domingo.</p>
      <div className="kv3">
        <div>
          <b>{r.xp}</b>XP na semana
        </div>
        <div>
          <b>{diff === null ? '–' : (diff >= 0 ? '+' : '') + diff + '%'}</b>vs. semana passada
        </div>
        <div>
          <b>{streak}</b>dias de ofensiva
        </div>
        <div>
          <b>{r.rank ? r.rank + 'º' : '–'}</b>na liga
        </div>
        <div>
          <b>{r.lessons}</b>aulas
        </div>
        <div>
          <b>{r.squares}</b>casas e jogos
        </div>
        <div>
          <b>{r.interviews}</b>entrevistas
        </div>
        <div>
          <b>{r.interviews ? r.interviewAvg : '–'}</b>nota média
        </div>
        <div>
          <b>{r.polish}</b>textos corrigidos
        </div>
      </div>
      <div className="card">
        <h3>Para a próxima semana</h3>
        <p style={{ margin: 0 }}>
          {r.interviews === 0
            ? 'Faça uma entrevista simulada: é o treino que mais aproxima você de uma vaga remota.'
            : r.lessons < 3
              ? 'Tente fazer pelo menos 3 aulas: um pouco todo dia rende mais que muito de uma vez.'
              : r.xp < r.lastXp
                ? 'Você treinou menos que na semana passada. Que tal bater a meta diária 5 vezes?'
                : 'Semana forte! Mantenha a ofensiva e tente subir de divisão na liga.'}
        </p>
      </div>
      <button
        className="btn alt"
        type="button"
        onClick={async () => {
          const url = location.origin
          try {
            if (navigator.share) await navigator.share({ text: shareText, url })
            else await copyText(shareText + ' ' + url)
          } catch {
            /* cancelled */
          }
        }}
      >
        Compartilhar minha semana
      </button>
    </FullPanel>
  )
}

export function InvitePanel({ authed, onClose, onLogin, onTrack }: { authed: boolean; onClose: () => void; onLogin: () => void; onTrack: (n: string) => void }) {
  const profile = useQuery(api.social.profile, authed ? {} : 'skip')
  const ensure = useMutation(api.social.ensure)
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (authed && profile && !profile.refCode) void ensure({}).catch(() => undefined)
  }, [authed, profile, ensure])
  const title = 'Convide e ganhe'
  if (!authed)
    return (
      <FullPanel title={title} onClose={onClose}>
        <NeedLogin onLogin={onLogin} text="Convide amigos devs: quando alguém cria a conta pelo seu link, vocês dois ganham mensagens extras com a IA por uma semana. Entre para pegar seu link." />
      </FullPanel>
    )
  if (!profile || !profile.refCode)
    return (
      <FullPanel title={title} onClose={onClose}>
        <p className="note">Gerando seu link…</p>
      </FullPanel>
    )
  const link = `${location.origin}/?ref=${profile.refCode}`
  const msg = `Tô treinando inglês pra trabalhar com time gringo no Dev English (daily, code review, entrevista com IA). É grátis, entra pelo meu link que a gente ganha bônus:`
  const active = profile.bonusUntil > Date.now()
  return (
    <FullPanel title={title} onClose={onClose}>
      <div className="card">
        <h3>
          <Icon name="gift" /> Vocês dois ganham
        </h3>
        <p style={{ margin: 0 }}>
          <b>+{profile.bonusAi} mensagens por dia com a IA</b> durante {profile.bonusDays} dias, para você e para quem criar a conta pelo seu link. Cada amigo novo renova o bônus.
        </p>
      </div>
      <div className="copyrow">
        <input className="field" readOnly value={link} aria-label="Seu link de convite" onFocus={(e) => e.currentTarget.select()} />
        <button
          className="btn alt"
          type="button"
          onClick={async () => {
            setCopied(await copyText(link))
            onTrack('copy')
          }}
        >
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      <button
        className="btn"
        type="button"
        onClick={async () => {
          onTrack('share')
          try {
            if (navigator.share) await navigator.share({ text: msg, url: link })
            else window.open('https://wa.me/?text=' + encodeURIComponent(msg + ' ' + link), '_blank', 'noopener')
          } catch {
            /* cancelled */
          }
        }}
      >
        Enviar convite
      </button>
      <a className="btn alt" href={'https://wa.me/?text=' + encodeURIComponent(msg + ' ' + link)} target="_blank" rel="noopener" onClick={() => onTrack('whatsapp')}>
        Mandar no WhatsApp
      </a>
      <div className="kv3">
        <div>
          <b>{profile.refCount}</b>amigos convidados
        </div>
        <div>
          <b>{active ? <Icon name="check" /> : '–'}</b>bônus ativo
        </div>
        <div>
          <b>{active ? new Date(profile.bonusUntil).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '–'}</b>válido até
        </div>
      </div>
      <p className="note">Vale para contas novas criadas em até 7 dias pelo link. Contas falsas ou duplicadas perdem o bônus.</p>
    </FullPanel>
  )
}

export function CertsPanel({
  authed,
  board,
  focus,
  onClose,
  onLogin,
  onTrack,
}: {
  authed: boolean
  board: Record<string, number>
  focus: number | null
  onClose: () => void
  onLogin: () => void
  onTrack: (n: string) => void
}) {
  const mine = useQuery(api.social.myCertificates, authed ? {} : 'skip')
  const issue = useMutation(api.social.issueCertificate)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState<number | null>(null)
  const [err, setErr] = useState('')
  useEffect(() => {
    if (!name && mine && mine.length) setName(mine[0].name)
  }, [mine, name])
  const title = 'Certificados'
  if (!authed)
    return (
      <FullPanel title={title} onClose={onClose}>
        <NeedLogin onLogin={onLogin} text="Ao vencer o chefão de cada mundo você ganha um certificado com código de verificação para colocar no LinkedIn. Entre para emitir." />
      </FullPanel>
    )
  const open = (code: string) => window.open('/certificado/' + code, '_blank', 'noopener')
  const ok = name.trim().split(/\s+/).length >= 2 && name.trim().length >= 5
  return (
    <FullPanel title={title} onClose={onClose}>
      <p className="note">Um certificado por mundo concluído (chefão vencido). Cada um tem um código público que qualquer recrutador pode conferir.</p>
      <label className="lbl" htmlFor="certname">
        Nome completo no certificado
      </label>
      <input id="certname" className="field" maxLength={60} value={name} placeholder="Ex.: Maria Souza" onChange={(e) => setName(e.target.value)} autoComplete="name" />
      {err && <p className="note">{err}</p>}
      {Array.from({ length: CERT_WORLDS }, (_, w) => {
        const done = !!board[`w${w}t15`]
        const cert = mine?.find((c) => c.world === w)
        return (
          <div className="card" key={w} style={focus === w ? { borderColor: 'hsl(var(--accent))' } : undefined}>
            <h3>
              <Icon name={done ? 'certificate' : 'lock'} /> {WORLD_NAMES[w]} · {WORLD_TAGS[w]}
            </h3>
            {!done ? (
              <p className="note">Vença o chefão deste mundo para liberar.</p>
            ) : (
              <div className="copyrow">
                {cert && (
                  <button className="btn alt" type="button" onClick={() => open(cert.code)}>
                    Ver certificado
                  </button>
                )}
                <button
                  className="btn"
                  type="button"
                  disabled={!ok || busy !== null}
                  onClick={async () => {
                    setBusy(w)
                    setErr('')
                    const r = await issue({ world: w, name }).catch(() => null)
                    setBusy(null)
                    if (r && r.ok) {
                      onTrack('issue')
                      open(r.code)
                    } else
                      setErr(
                        r?.code === 'NOT_DONE'
                          ? 'Esse mundo ainda não foi concluído nesta conta. Se você venceu agora, espere alguns segundos e tente de novo.'
                          : r?.code === 'BAD_INPUT'
                            ? 'Escreva seu nome e sobrenome.'
                            : 'Não deu para emitir agora. Tente de novo.',
                      )
                  }}
                >
                  {busy === w ? 'Emitindo…' : cert ? (cert.name !== name.trim() ? 'Atualizar nome' : 'Emitir de novo') : 'Emitir certificado'}
                </button>
              </div>
            )}
          </div>
        )
      })}
      <p className="note">Dev English é um curso livre de inglês para desenvolvedores. O certificado comprova a conclusão do módulo no app; não é um diploma reconhecido pelo MEC.</p>
    </FullPanel>
  )
}

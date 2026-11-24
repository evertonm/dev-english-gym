import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useQuery } from 'convex/react'
import { api as apiRef } from '../convex/_generated/api'
import type { FunctionReturnType } from 'convex/server'
import type { api } from '../convex/_generated/api'
import './admin.css'

type Dash = NonNullable<FunctionReturnType<typeof api.analytics.dashboard>>
type Day = Dash['days'][number]

const fmtDay = (d: string) => d.slice(8, 10) + '/' + d.slice(5, 7)
const pct = (n: number | null) => (n === null ? '—' : Math.round(n * 100) + '%')
const num = (n: number) => n.toLocaleString('pt-BR')

const METRICS: [string, string][] = [
  ['lesson_done', 'Aulas'],
  ['unit_done', 'Treinos'],
  ['board_done', 'Casas do tabuleiro'],
  ['ai_call', 'Mensagens com IA'],
  ['stt', 'Falas transcritas'],
  ['ai_limit', 'Bateram o limite'],
  ['dice', 'Dados rolados'],
  ['chest', 'Baús abertos'],
  ['signups', 'Cadastros'],
  ['logins', 'Logins'],
]

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="adm-tile">
      <span className="adm-tl">{label}</span>
      <b>{value}</b>
      {sub && <small>{sub}</small>}
    </div>
  )
}

// Vertical chart over days (or hours): bars or a line, with a hover tooltip.
function TimeChart({
  labels,
  values,
  kind,
  unit,
  height = 180,
}: {
  labels: string[]
  values: number[]
  kind: 'bar' | 'line'
  unit: string
  height?: number
}) {
  const [hover, setHover] = useState<number | null>(null)
  const ref = useRef<SVGSVGElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const [W, setW] = useState(640)
  // Draw at the real pixel width so text keeps its size on phones and big screens.
  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setW(Math.max(240, Math.round(el.clientWidth))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const H = height
  const pad = { l: 34, r: 8, t: 10, b: 24 }
  const max = Math.max(1, ...values)
  const nice = max <= 5 ? 5 : Math.ceil(max / Math.pow(10, Math.floor(Math.log10(max)))) * Math.pow(10, Math.floor(Math.log10(max)))
  const iw = W - pad.l - pad.r
  const ih = H - pad.t - pad.b
  const step = iw / values.length
  const x = (i: number) => pad.l + step * i + step / 2
  const y = (v: number) => pad.t + ih - (v / nice) * ih
  const ticks = [0, nice / 2, nice]
  const every = Math.max(1, Math.ceil(values.length / Math.max(3, Math.floor(iw / 56))))
  const onMove = (e: React.PointerEvent) => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    const i = Math.floor((((e.clientX - r.left) / r.width) * W - pad.l) / step)
    setHover(i >= 0 && i < values.length ? i : null)
  }
  const path = values.map((v, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1)).join(' ')
  return (
    <div className="adm-chart" ref={box}>
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={unit}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line className="adm-grid" x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} />
            <text className="adm-ax" x={pad.l - 6} y={y(t) + 4} textAnchor="end">
              {num(t)}
            </text>
          </g>
        ))}
        {labels.map((l, i) =>
          (i % every === 0 && labels.length - 1 - i >= every / 2) || i === labels.length - 1 ? (
            <text key={i} className="adm-ax" x={x(i)} y={H - 6} textAnchor="middle">
              {l}
            </text>
          ) : null,
        )}
        {hover !== null && <line className="adm-cross" x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ih} />}
        {kind === 'bar'
          ? values.map((v, i) => {
              const bw = Math.max(2, step - 2)
              const h = Math.max(v > 0 ? 2 : 0, pad.t + ih - y(v))
              return (
                <path
                  key={i}
                  className={'adm-bar' + (hover === i ? ' on' : '')}
                  d={`M${x(i) - bw / 2} ${pad.t + ih} v${-Math.max(0, h - Math.min(4, h, bw / 2))} q0 ${-Math.min(4, h, bw / 2)} ${Math.min(4, h, bw / 2)} ${-Math.min(4, h, bw / 2)} h${bw - 2 * Math.min(4, h, bw / 2)} q${Math.min(4, h, bw / 2)} 0 ${Math.min(4, h, bw / 2)} ${Math.min(4, h, bw / 2)} v${Math.max(0, h - Math.min(4, h, bw / 2))}z`}
                />
              )
            })
          : (
            <>
              <path className="adm-area" d={path + ` L${x(values.length - 1)} ${pad.t + ih} L${x(0)} ${pad.t + ih}Z`} />
              <path className="adm-line" d={path} />
              {hover !== null && <circle className="adm-dot" cx={x(hover)} cy={y(values[hover])} r={5} />}
            </>
          )}
      </svg>
      {hover !== null && (
        <div className="adm-tip" style={{ left: `${(x(hover) / W) * 100}%` }}>
          <span>{labels[hover]}</span>
          <b>
            {num(values[hover])} {unit}
          </b>
        </div>
      )}
    </div>
  )
}

function HBars({ rows, total }: { rows: { k: string; n: number }[]; total?: number }) {
  const max = Math.max(1, ...rows.map((r) => r.n))
  return (
    <div className="adm-hbars">
      {rows.map((r) => (
        <div className="adm-hrow" key={r.k} title={`${r.k}: ${num(r.n)}`}>
          <span className="adm-hk">{r.k}</span>
          <span className="adm-htrack">
            <span className="adm-hfill" style={{ width: `${(r.n / max) * 100}%` }} />
          </span>
          <span className="adm-hn">
            {num(r.n)}
            {total ? <small> {total ? Math.round((r.n / total) * 100) : 0}%</small> : null}
          </span>
        </div>
      ))}
      {rows.length === 0 && <p className="adm-empty">Sem dados ainda.</p>}
    </div>
  )
}

class Guard extends Component<{ children: ReactNode; onClose: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="adm" role="dialog" aria-label="Painel de métricas">
        <header className="adm-head">
          <div>
            <h1>Painel Dev English</h1>
            <p>Não consegui carregar as métricas agora. Tente de novo em instantes.</p>
          </div>
          <button className="adm-close" type="button" onClick={this.props.onClose}>
            Fechar
          </button>
        </header>
      </div>
    )
  }
}

// The metrics query lives inside its own error guard: a failure here never takes the app down.
export function AdminDashboard({ onClose }: { onClose: () => void }) {
  return (
    <Guard onClose={onClose}>
      <Loader onClose={onClose} />
    </Guard>
  )
}

function Loader({ onClose }: { onClose: () => void }) {
  const data = useQuery(apiRef.analytics.dashboard, {})
  if (data === undefined)
    return (
      <div className="adm" role="dialog" aria-label="Painel de métricas">
        <p className="adm-note">Carregando métricas…</p>
      </div>
    )
  if (data === null) return null
  return <Dashboard data={data} onClose={onClose} />
}

function Dashboard({ data, onClose }: { data: Dash; onClose: () => void }) {
  const [metric, setMetric] = useState('lesson_done')
  const [showTable, setShowTable] = useState(false)
  const t = data.totals
  const labels = useMemo(() => data.days.map((d) => fmtDay(d.day)), [data.days])
  const get = (d: Day, k: string) => Number((d as Record<string, number | string>)[k] ?? 0)
  const metricLabel = METRICS.find(([k]) => k === metric)?.[1] ?? ''
  const metricTotal = data.days.reduce((s, d) => s + get(d, metric), 0)
  const top = data.funnel[0]?.n || 1
  const aiPct = t.aiCap ? Math.min(100, Math.round((t.aiToday / t.aiCap) * 100)) : 0
  const workout = data.workout

  return (
    <div className="adm" role="dialog" aria-label="Painel de métricas">
      <header className="adm-head">
        <div>
          <h1>Painel Dev English</h1>
          <p>Últimos 30 dias · horário de Brasília · atualiza ao vivo</p>
        </div>
        <button className="adm-close" type="button" onClick={onClose}>
          Fechar
        </button>
      </header>

      <section className="adm-tiles">
        <Tile label="Contas" value={num(t.users)} sub={`+${t.new7} nos últimos 7 dias`} />
        <Tile label="Ativos hoje" value={num(t.dau)} sub="aparelhos" />
        <Tile label="Ativos na semana" value={num(t.wau)} sub={`${num(t.active7)} contas estudaram`} />
        <Tile label="Ativos no mês" value={num(t.mau)} sub="aparelhos" />
        <Tile label="Voltam no dia seguinte" value={pct(data.retention.d1)} sub={`de ${data.retention.d1n} aparelhos novos`} />
        <Tile label="Voltam após 7 dias" value={pct(data.retention.d7)} sub={`de ${data.retention.d7n} aparelhos novos`} />
        <Tile label="Ofensiva média" value={String(t.avgStreak).replace('.', ',')} sub={`recorde: ${t.maxStreak} dias`} />
        <Tile label="XP médio" value={num(t.avgXp)} sub="por conta" />
      </section>

      <div className="adm-grid2">
        {workout && (
          <section className="adm-card wide">
            <h2>Piloto de code review</h2>
            <div className="adm-tiles">
              <Tile label="Viram o convite" value={num(workout.offered)} sub="aparelhos" />
              <Tile label="Começaram o treino" value={num(workout.started)} sub="aparelhos" />
              <Tile label="Enviaram uma resposta" value={num(workout.submitted)} sub="aparelhos" />
              <Tile label="Concluíram o primeiro treino" value={num(workout.completed)} sub="aparelhos" />
              <Tile
                label="Concluíram outro cenário em até 7 dias"
                value={pct(workout.eligible ? workout.returned / workout.eligible : null)}
                sub={`${num(workout.returned)} de ${num(workout.eligible)} aparelhos com 7 dias completos`}
              />
            </div>
          </section>
        )}
        <section className="adm-card wide">
          <h2>Aparelhos ativos por dia</h2>
          <TimeChart kind="line" labels={labels} values={data.days.map((d) => d.devices)} unit="aparelhos" />
        </section>

        <section className="adm-card wide">
          <div className="adm-cardhead">
            <h2>
              {metricLabel} por dia <small>· {num(metricTotal)} no período</small>
            </h2>
            <div className="adm-pills" role="tablist">
              {METRICS.map(([k, l]) => (
                <button key={k} type="button" aria-pressed={metric === k} onClick={() => setMetric(k)}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <TimeChart kind="bar" labels={labels} values={data.days.map((d) => get(d, metric))} unit={metricLabel.toLowerCase()} />
          <button className="adm-link" type="button" onClick={() => setShowTable((v) => !v)}>
            {showTable ? 'Esconder tabela' : 'Ver tabela dia a dia'}
          </button>
          {showTable && (
            <div className="adm-table">
              <table>
                <thead>
                  <tr>
                    <th>Dia</th>
                    <th>Aparelhos</th>
                    {METRICS.map(([k, l]) => (
                      <th key={k}>{l}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...data.days].reverse().map((d) => (
                    <tr key={d.day}>
                      <td>{fmtDay(d.day)}</td>
                      <td>{d.devices}</td>
                      {METRICS.map(([k]) => (
                        <td key={k}>{get(d, k)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="adm-card">
          <h2>Funil de engajamento</h2>
          <HBars rows={data.funnel} total={top} />
        </section>

        <section className="adm-card">
          <h2>Como as pessoas entram</h2>
          <HBars rows={data.methods} total={data.methods.reduce((s, m) => s + m.n, 0)} />
          <h2 className="adm-sub">IA hoje (todos os usuários)</h2>
          <div className="adm-meter" title={`${t.aiToday} de ${t.aiCap}`}>
            <span style={{ width: aiPct + '%' }} />
          </div>
          <p className="adm-note">
            {num(t.aiToday)} de {num(t.aiCap)} mensagens do limite geral ({aiPct}%)
          </p>
        </section>

        <section className="adm-card">
          <h2>Patentes dos alunos</h2>
          <HBars rows={data.ranks} />
        </section>

        <section className="adm-card">
          <h2>Aulas mais concluídas</h2>
          <HBars rows={data.lessons} />
        </section>

        <section className="adm-card wide">
          <h2>Horário de uso</h2>
          <TimeChart
            kind="bar"
            height={150}
            labels={data.hours.map((_, h) => h + 'h')}
            values={data.hours}
            unit="ações"
          />
        </section>

        <section className="adm-card wide">
          <h2>Contas mais recentes</h2>
          <div className="adm-table">
            <table>
              <thead>
                <tr>
                  <th>E-mail</th>
                  <th>Entrou com</th>
                  <th>Criada</th>
                  <th>Último estudo</th>
                  <th>XP</th>
                  <th>Patente</th>
                  <th>Ofensiva</th>
                  <th>Aulas</th>
                  <th>Conversas</th>
                </tr>
              </thead>
              <tbody>
                {data.recent.map((u) => (
                  <tr key={u.email + u.created}>
                    <td className="l">{u.email}</td>
                    <td className="l">{u.via.join(', ') || '—'}</td>
                    <td>{new Date(u.created).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</td>
                    <td>{u.last ? fmtDay(u.last) : '—'}</td>
                    <td>{num(u.xp)}</td>
                    <td className="l">{u.rank}</td>
                    <td>{u.streak}</td>
                    <td>{u.lessons}</td>
                    <td>{u.chats}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
      <p className="adm-foot">
        "Aparelhos" contam cada navegador uma vez (identificador anônimo, sem cookies). Só você vê este painel.
      </p>
    </div>
  )
}

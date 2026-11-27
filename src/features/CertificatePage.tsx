import { useEffect } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { WORLD_NAMES, WORLD_TAGS } from '../gym/worlds'

const TOPICS = [
  'frases do dia a dia de trabalho, daily, pedidos de ajuda e code review',
  'entrevistas, experiência profissional, histórias de projeto e escrita',
  'negociação, explicação de trade-offs, design de sistemas e decisões técnicas',
  'liderança, feedback, influência e comunicação com stakeholders',
  'nuance, estratégia, apresentações e comunicação executiva',
]

// Public, printable certificate at /certificado/CODE.
export function CertificatePage({ code }: { code: string }) {
  const c = useQuery(api.social.certificate, { code })
  useEffect(() => {
    if (c) document.title = `Certificado · ${c.name} · Dev English`
  }, [c])
  const url = `${location.origin}/certificado/${code}`
  if (c === undefined) return <div className="cert-page">Carregando…</div>
  if (c === null)
    return (
      <div className="cert-page">
        <p>Certificado não encontrado. Confira o código.</p>
        <div className="cert-actions">
          <a href="/">Conhecer o Dev English</a>
        </div>
      </div>
    )
  const date = new Date(c.ts).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  const world = WORLD_NAMES[c.world] ?? 'Módulo ' + (c.world + 1)
  const tag = WORLD_TAGS[c.world] ?? ''
  const li =
    'https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=' +
    encodeURIComponent(`Dev English · ${world} (${tag})`) +
    '&organizationName=' +
    encodeURIComponent('Dev English') +
    '&issueYear=' +
    new Date(c.ts).getFullYear() +
    '&issueMonth=' +
    (new Date(c.ts).getMonth() + 1) +
    '&certUrl=' +
    encodeURIComponent(url) +
    '&certId=' +
    encodeURIComponent(c.code)
  return (
    <div className="cert-page">
      <div className="cert">
        <div className="ct-brand">Dev English · Inglês para desenvolvedores</div>
        <h1>Certificado de conclusão</h1>
        <p>Certificamos que</p>
        <div className="ct-name">{c.name}</div>
        <p>
          concluiu o módulo <b>{world}</b> (nível de referência {tag}) do Dev English, com aulas, exercícios, prática de conversa e o desafio final do módulo, cobrindo{' '}
          {TOPICS[c.world] ?? 'inglês para o trabalho em tecnologia'}.
        </p>
        <div className="ct-foot">
          <span>
            Emitido em {date}
            <br />
            Curso livre, sem reconhecimento do MEC
          </span>
          <span style={{ textAlign: 'right' }}>
            Código: <b>{c.code}</b>
            <br />
            Verifique em {url.replace(/^https?:\/\//, '')}
          </span>
        </div>
      </div>
      <div className="cert-actions">
        <button type="button" onClick={() => window.print()}>
          Imprimir ou salvar em PDF
        </button>
        <a href={li} target="_blank" rel="noopener">
          Adicionar ao LinkedIn
        </a>
        <a className="alt" href="/">
          Abrir o Dev English
        </a>
      </div>
    </div>
  )
}

import { shareCaption } from './achievement'
import type { Achievement } from './achievement'

function wrappedLines(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(/\s+/)) {
    const next = line ? line + ' ' + word : word
    if (line && ctx.measureText(next).width > width) {
      lines.push(line)
      line = word
    } else line = next
  }
  lines.push(line)
  return lines
}

function drawLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number,
  lineHeight: number,
): number {
  for (const line of wrappedLines(ctx, text, width)) {
    ctx.fillText(line, x, y, width)
    y += lineHeight
  }
  return y
}

async function loadImage(src: string): Promise<HTMLImageElement | null> {
  const image = new Image()
  image.src = src
  try {
    await image.decode()
    return image
  } catch {
    return null
  }
}

async function createShareImage(card: Achievement): Promise<Blob | null> {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1080
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.fillStyle = '#f6f0ff'
  ctx.fillRect(0, 0, 1080, 1080)
  ctx.fillStyle = '#38126a'
  ctx.fillRect(0, 0, 1080, 12)
  const [logo, portrait] = await Promise.all([
    loadImage('/logo192.png'),
    card.portrait ? loadImage(card.portrait) : null,
  ])
  if (logo) ctx.drawImage(logo, 64, 54, 88, 88)
  if (portrait) {
    ctx.fillStyle = '#e9dcff'
    ctx.beginPath()
    ctx.arc(906, 153, 91, 0, Math.PI * 2)
    ctx.fill()
    ctx.drawImage(portrait, 817, 65, 178, 178)
  }
  ctx.fillStyle = '#38126a'
  ctx.font = '800 37px system-ui'
  ctx.fillText('Dev English Gym', 171, 113)
  ctx.fillStyle = '#230e3f'
  ctx.font = '800 68px system-ui'
  let y = drawLines(ctx, card.title, 72, 218, portrait ? 710 : 936, 75)
  ctx.fillStyle = '#4b3068'
  ctx.font = '600 39px system-ui'
  y = drawLines(ctx, card.description, 72, y + 6, 936, 53)

  if (card.result) {
    ctx.font = '800 30px system-ui'
    ctx.fillStyle = '#ffd965'
    ctx.beginPath()
    ctx.roundRect(72, y - 8, Math.min(ctx.measureText(card.result).width + 52, 936), 62, 22)
    ctx.fill()
    ctx.fillStyle = '#38126a'
    ctx.fillText(card.result, 98, y + 33, 884)
    y += 80
  }
  if (card.topics.length) {
    const topicTop = y + 8
    const topicBottom = card.technique ? 768 : 972
    ctx.fillStyle = '#e9dcff'
    ctx.beginPath()
    ctx.roundRect(72, topicTop, 936, topicBottom - topicTop, 28)
    ctx.fill()
    ctx.fillStyle = '#38126a'
    ctx.font = '800 32px system-ui'
    ctx.fillText('O que pratiquei', 111, topicTop + 49)
    y = topicTop + 98
    const gap = card.technique ? 8 : 16
    let size = card.technique ? 32 : 37
    ctx.font = `600 ${size}px system-ui`
    while (size > 23) {
      const height = card.topics.reduce((sum, topic) => sum + wrappedLines(ctx, topic, 815).length * (size + 9) + gap, 0)
      if (y + height <= topicBottom + size) break
      ctx.font = `600 ${--size}px system-ui`
    }
    for (const topic of card.topics) {
      ctx.fillText('•', 112, y)
      y = drawLines(ctx, topic, 147, y, 815, size + 9) + gap
    }
  }
  if (card.technique) {
    const top = card.topics.length ? 785 : y + 10
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.roundRect(72, top, 936, 198, 26)
    ctx.fill()
    ctx.fillStyle = '#38126a'
    ctx.font = '800 25px system-ui'
    ctx.fillText('Estrutura em inglês', 110, top + 45)
    ctx.font = '800 33px system-ui'
    const exampleY = drawLines(ctx, card.technique.pattern, 110, top + 90, 850, 40) + 6
    ctx.fillStyle = '#4b3068'
    ctx.font = 'italic 31px system-ui'
    drawLines(ctx, `“${card.technique.example}”`, 110, exampleY, 850, 37)
  }
  ctx.fillStyle = '#4b3068'
  ctx.font = '600 26px system-ui'
  ctx.fillText('dev-english-br.vercel.app', 72, 1026)
  return new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
}

export function mountAchievementShare(root: HTMLElement) {
  const dialog = document.createElement('dialog')
  dialog.className = 'achievement-share'
  dialog.setAttribute('aria-labelledby', 'achievement-share-title')
  dialog.innerHTML = `
    <header class="achievement-share-header">
      <h2 id="achievement-share-title">Compartilhar conquista</h2>
      <form method="dialog"><button class="x" aria-label="Fechar" autofocus>×</button></form>
    </header>
    <img class="achievement-preview" alt="Prévia do card de conquista" hidden>
    <label class="sr-only" for="achievement-caption">Legenda da conquista</label>
    <textarea id="achievement-caption" readonly rows="4"></textarea>
    <p class="note" role="status"></p>
    <div class="achievement-share-actions">
      <button class="btn" data-share-native>Compartilhar</button>
      <button class="btn alt" data-share-copy>Copiar legenda</button>
      <button class="btn alt" data-share-download disabled>Baixar imagem</button>
    </div>`
  root.append(dialog)

  const preview = dialog.querySelector<HTMLImageElement>('.achievement-preview')!
  const caption = dialog.querySelector<HTMLTextAreaElement>('textarea')!
  const status = dialog.querySelector<HTMLElement>('[role="status"]')!
  const native = dialog.querySelector<HTMLButtonElement>('[data-share-native]')!
  const copy = dialog.querySelector<HTMLButtonElement>('[data-share-copy]')!
  const download = dialog.querySelector<HTMLButtonElement>('[data-share-download]')!
  let version = 0
  let file: File | null = null
  let previewUrl = ''
  let trigger: HTMLElement | null = null

  function resetImage() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    previewUrl = ''
    file = null
    preview.removeAttribute('src')
    preview.hidden = true
    download.disabled = true
  }

  async function copyCaption() {
    const requested = version
    try {
      await navigator.clipboard.writeText(caption.value)
      if (dialog.open && requested === version) status.textContent = 'Legenda copiada.'
    } catch {
      if (!dialog.open || requested !== version) return
      caption.focus()
      caption.select()
      status.textContent = 'Selecione e copie a legenda para compartilhar.'
    }
  }

  native.addEventListener('click', async () => {
    const requested = version
    const text = caption.value
    try {
      if (file && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ text, files: [file] })
      } else {
        await navigator.share({ text })
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return
      if (dialog.open && requested === version) status.textContent = 'Use a legenda ou baixe a imagem para compartilhar.'
    }
  })
  copy.addEventListener('click', () => void copyCaption())
  download.addEventListener('click', () => {
    if (!previewUrl) return
    const link = document.createElement('a')
    link.href = previewUrl
    link.download = 'dev-english-conquista.png'
    link.click()
  })
  dialog.addEventListener('close', () => {
    version++
    resetImage()
    trigger?.focus({ preventScroll: true })
    trigger = null
  })

  return {
    open(card: Achievement, source: HTMLElement) {
      const requested = ++version
      trigger = source
      resetImage()
      caption.value = shareCaption(card)
      status.textContent = ''
      native.hidden = typeof navigator.share !== 'function'
      native.disabled = true
      dialog.showModal()
      void createShareImage(card).then(blob => {
        if (!dialog.open || requested !== version) return
        if (!blob) {
          status.textContent = 'A imagem não está disponível. Você pode copiar a legenda.'
          return
        }
        file = new File([blob], 'dev-english-conquista.png', { type: 'image/png' })
        previewUrl = URL.createObjectURL(file)
        preview.src = previewUrl
        preview.hidden = false
        download.disabled = false
      }).catch(() => {
        if (dialog.open && requested === version) status.textContent = 'A imagem não está disponível. Você pode copiar a legenda.'
      }).finally(() => {
        if (dialog.open && requested === version) native.disabled = false
      })
    },
    close() {
      if (dialog.open) dialog.close()
    },
    destroy() {
      version++
      resetImage()
      dialog.remove()
    },
  }
}

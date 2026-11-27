export const APP_HOME = '/app'

export const APP_TABS = {
  board: APP_HOME,
  learn: '/app/mundos',
  chat: '/app/conversa',
  book: '/app/frases',
  me: '/app/perfil',
} as const

export const APP_PANELS: Readonly<Record<string, string>> = {
  interview: '/app/entrevista',
  tools: '/app/corretor',
  league: '/app/liga',
  report: '/app/relatorio',
  invite: '/app/convite',
  certs: '/app/certificados',
}

export const APP_ADMIN = '/app/admin'

export function normalizedPath(path: string) {
  return path.replace(/\/+$/, '') || '/'
}

export function legacyAppPath(path: string) {
  const target = APP_HOME + normalizedPath(path)
  return [...Object.values(APP_TABS), ...Object.values(APP_PANELS), APP_ADMIN].find(route => route === target)
}

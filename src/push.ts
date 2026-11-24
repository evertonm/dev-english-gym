// Browser side of daily reminders (web push). See convex/push.ts.
export type PushStatus = 'on' | 'off' | 'denied' | 'unsupported' | 'ios-install'

const HOUR_KEY = 'devenglish-push-hour'
export const pushHour = () => {
  try {
    return Number(localStorage.getItem(HOUR_KEY) || 20)
  } catch {
    return 20
  }
}

const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent)
const standalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true

export function pushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export async function registerSW(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  try {
    return await navigator.serviceWorker.register('/sw.js')
  } catch {
    return null
  }
}

async function currentSub(): Promise<PushSubscription | null> {
  if (!pushSupported()) return null
  const reg = await navigator.serviceWorker.getRegistration('/')
  return reg ? reg.pushManager.getSubscription() : null
}

export async function pushStatus(): Promise<PushStatus> {
  if (isIOS() && !standalone()) return 'ios-install' // iPhone: only works from the Home Screen app
  if (!pushSupported()) return 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  return (await currentSub()) ? 'on' : 'off'
}

function urlB64ToUint8Array(b64: string): Uint8Array<ArrayBuffer> {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4)
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  const out = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

type Save = (a: { endpoint: string; p256dh: string; auth: string; anon: string; tz: number; hour: number }) => Promise<unknown>

export async function enablePush(publicKey: string, anon: string, hour: number, save: Save): Promise<PushStatus> {
  if (!pushSupported()) return 'unsupported'
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') return perm === 'denied' ? 'denied' : 'off'
  const reg = (await registerSW()) ?? (await navigator.serviceWorker.ready)
  await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8Array(publicKey) })
  const j = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }
  try {
    localStorage.setItem(HOUR_KEY, String(hour))
  } catch {
    /* ignore */
  }
  await save({ endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth, anon, tz: -new Date().getTimezoneOffset(), hour })
  return 'on'
}

export async function disablePush(remove: (a: { endpoint: string }) => Promise<unknown>): Promise<PushStatus> {
  const sub = await currentSub()
  if (sub) {
    await remove({ endpoint: sub.endpoint }).catch(() => undefined)
    await sub.unsubscribe().catch(() => undefined)
  }
  return 'off'
}

let lastSent = ''
export async function reportState(last: string, streak: number, send: (a: { endpoint: string; last: string; streak: number }) => Promise<unknown>) {
  const key = last + '|' + streak
  if (key === lastSent) return
  const sub = await currentSub()
  if (!sub) return
  lastSent = key
  await send({ endpoint: sub.endpoint, last, streak }).catch(() => {
    lastSent = ''
  })
}

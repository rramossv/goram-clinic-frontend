import { apiFetch } from '@/lib/api'

// Avisos push del navegador: el service worker (/sw.js) los recibe aunque la
// app este cerrada. Solo funcionan en https (o en localhost durante desarrollo).

export function registrarServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // sin service worker la app funciona igual, solo sin avisos
    })
  })
}

export const esIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent)
export const esAppInstalada = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true

export type EstadoPush = 'no-soportado' | 'requiere-instalar' | 'bloqueado' | 'inactivo' | 'activo'

export async function estadoPush(): Promise<EstadoPush> {
  // En iPhone los avisos web solo existen dentro de la app instalada en inicio.
  if (esIOS() && !esAppInstalada()) return 'requiere-instalar'
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return 'no-soportado'
  if (Notification.permission === 'denied') return 'bloqueado'
  const registro = await navigator.serviceWorker.getRegistration()
  const suscripcion = await registro?.pushManager.getSubscription()
  return suscripcion && Notification.permission === 'granted' ? 'activo' : 'inactivo'
}

function aBytes(base64url: string) {
  const relleno = '='.repeat((4 - (base64url.length % 4)) % 4)
  const binario = atob((base64url + relleno).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(binario, (c) => c.charCodeAt(0))
}

function nombreDispositivo() {
  const ua = navigator.userAgent
  const sistema = /android/i.test(ua) ? 'Android' : esIOS() ? 'iPhone' : /windows/i.test(ua) ? 'Windows' : /mac/i.test(ua) ? 'Mac' : 'Equipo'
  const navegador = /edg\//i.test(ua) ? 'Edge' : /chrome|crios/i.test(ua) ? 'Chrome' : /firefox/i.test(ua) ? 'Firefox' : /safari/i.test(ua) ? 'Safari' : 'navegador'
  return `${sistema} · ${navegador}`
}

/** Pide permiso (debe llamarse desde un clic) y registra este dispositivo. */
export async function activarPush() {
  const permiso = await Notification.requestPermission()
  if (permiso !== 'granted') throw new Error(permiso === 'denied' ? 'bloqueado' : 'cancelado')
  const registro = await navigator.serviceWorker.register('/sw.js')
  await navigator.serviceWorker.ready
  const { clave } = await apiFetch<{ clave: string }>('/api/v1/push/clave-publica')
  const suscripcion =
    (await registro.pushManager.getSubscription()) ??
    (await registro.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: aBytes(clave) }))
  const json = suscripcion.toJSON()
  await apiFetch('/api/v1/push/suscripciones', {
    method: 'POST',
    body: { endpoint: json.endpoint, keys: json.keys, dispositivo: nombreDispositivo() },
  })
}

export async function desactivarPush() {
  const registro = await navigator.serviceWorker.getRegistration()
  const suscripcion = await registro?.pushManager.getSubscription()
  if (!suscripcion) return
  await apiFetch('/api/v1/push/suscripciones', { method: 'DELETE', body: { endpoint: suscripcion.endpoint } }).catch(() => {})
  await suscripcion.unsubscribe()
}

// --- instalar como app (Android, Chrome y Edge de escritorio) ---

interface EventoInstalacion extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let eventoInstalacion: EventoInstalacion | null = null
const oyentes = new Set<() => void>()

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    eventoInstalacion = e as EventoInstalacion
    oyentes.forEach((f) => f())
  })
  window.addEventListener('appinstalled', () => {
    eventoInstalacion = null
    oyentes.forEach((f) => f())
  })
}

export const puedeInstalar = () => eventoInstalacion !== null

export function alCambiarInstalable(f: () => void) {
  oyentes.add(f)
  return () => {
    oyentes.delete(f)
  }
}

export async function instalarApp() {
  if (!eventoInstalacion) return false
  await eventoInstalacion.prompt()
  const { outcome } = await eventoInstalacion.userChoice
  eventoInstalacion = null
  oyentes.forEach((f) => f())
  return outcome === 'accepted'
}

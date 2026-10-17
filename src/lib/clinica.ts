import type { SignosVitales } from '@/types'

/** Edad en anios cumplidos a partir de "AAAA-MM-DD". */
export function edadDe(fechaNacimiento: string | null, referencia = new Date()) {
  if (!fechaNacimiento) return null
  const [anio, mes, dia] = fechaNacimiento.split('-').map(Number)
  let edad = referencia.getFullYear() - anio
  if (referencia < new Date(referencia.getFullYear(), mes - 1, dia)) edad -= 1
  return edad
}

export function edadLegible(fechaNacimiento: string | null) {
  const edad = edadDe(fechaNacimiento)
  return edad === null ? null : `${edad} ${edad === 1 ? 'año' : 'años'}`
}

// "Ninguna", "No", "Niega"... no ameritan la alerta roja de alergias.
export function tieneAlergias(texto: string | null) {
  if (!texto) return false
  return !/^\s*(ninguna|ninguno|no|niega|n\/a|sin alergias)\b/i.test(texto)
}

export function imc(pesoKg: number | null, tallaCm: number | null) {
  if (!pesoKg || !tallaCm) return null
  const m = tallaCm / 100
  return Math.round((pesoKg / (m * m)) * 10) / 10
}

// Clasificacion de la OMS para adultos.
export function clasificacionImc(valor: number) {
  if (valor < 18.5) return { etiqueta: 'Bajo peso', tono: 'aviso' as const }
  if (valor < 25) return { etiqueta: 'Normal', tono: 'normal' as const }
  if (valor < 30) return { etiqueta: 'Sobrepeso', tono: 'aviso' as const }
  return { etiqueta: 'Obesidad', tono: 'alerta' as const }
}

export type Tono = 'normal' | 'aviso' | 'alerta'

/**
 * Marca valores fuera de rango en adultos. Es una ayuda visual: no reemplaza
 * el criterio clinico (en ninos los rangos son otros y no se marca nada).
 */
export function evaluarSigno(campo: keyof SignosVitales, s: Partial<SignosVitales>, edad: number | null): Tono {
  if (edad !== null && edad < 15) return 'normal'
  const v = s[campo]
  if (v === null || v === undefined) return 'normal'
  switch (campo) {
    case 'presionSistolica':
      return v >= 180 ? 'alerta' : v >= 140 || v < 90 ? 'aviso' : 'normal'
    case 'presionDiastolica':
      return v >= 120 ? 'alerta' : v >= 90 || v < 60 ? 'aviso' : 'normal'
    case 'frecuenciaCardiaca':
      return v > 130 || v < 45 ? 'alerta' : v > 100 || v < 60 ? 'aviso' : 'normal'
    case 'frecuenciaRespiratoria':
      return v > 28 || v < 8 ? 'alerta' : v > 20 || v < 12 ? 'aviso' : 'normal'
    case 'temperatura':
      return v >= 39.5 || v < 35 ? 'alerta' : v >= 37.8 ? 'aviso' : 'normal'
    case 'saturacionO2':
      return v < 90 ? 'alerta' : v < 95 ? 'aviso' : 'normal'
    case 'glucosaMgDl':
      return v >= 250 || v < 60 ? 'alerta' : v >= 126 || v < 70 ? 'aviso' : 'normal'
    default:
      return 'normal'
  }
}

export const presion = (s: Partial<SignosVitales>) =>
  s.presionSistolica && s.presionDiastolica ? `${s.presionSistolica}/${s.presionDiastolica}` : null

export function tieneSignos(s: Partial<SignosVitales>) {
  return [s.presionSistolica, s.frecuenciaCardiaca, s.frecuenciaRespiratoria, s.temperatura, s.saturacionO2, s.pesoKg, s.tallaCm, s.glucosaMgDl].some(
    (v) => v !== null && v !== undefined,
  )
}

// Una sola forma de escribir fechas en todo el panel.
export const fechaCorta = (iso: string) =>
  new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString('es-SV', { day: 'numeric', month: 'short', year: 'numeric' })

export const fechaLarga = (iso: string) =>
  new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString('es-SV', { day: 'numeric', month: 'long', year: 'numeric' })

export const fechaHora = (iso: string) =>
  new Date(iso).toLocaleString('es-SV', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })

export const hora = (iso: string) => new Date(iso).toLocaleTimeString('es-SV', { hour: 'numeric', minute: '2-digit' })

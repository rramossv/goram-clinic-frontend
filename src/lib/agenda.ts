import type { BloqueoAgenda, HorarioFranja } from '@/types'

export const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

/** getDay() de JS empieza en domingo = 0; el backend usa ISO (lunes = 1). */
export const diaIso = (fecha: Date) => ((fecha.getDay() + 6) % 7) + 1

export const aMinutos = (hora: string) => {
  const [h, m] = hora.split(':').map(Number)
  return h * 60 + m
}

export function esMismoDia(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

/** Franjas [inicio, fin) en minutos del dia para ese medico y fecha. null = sin horario configurado. */
export function franjasDelDia(horarios: HorarioFranja[], doctorId: string, fecha: Date): [number, number][] | null {
  const delMedico = horarios.filter((h) => h.doctorId === doctorId)
  if (delMedico.length === 0) return null
  const dia = diaIso(fecha)
  return delMedico.filter((h) => h.diaSemana === dia).map((h) => [aMinutos(h.horaInicio), aMinutos(h.horaFin)])
}

/** Tramos bloqueados de ese dia, en minutos, recortados al dia. */
export function bloqueosDelDia(bloqueos: BloqueoAgenda[], doctorId: string, fecha: Date) {
  const inicioDia = new Date(fecha)
  inicioDia.setHours(0, 0, 0, 0)
  const finDia = new Date(inicioDia)
  finDia.setDate(finDia.getDate() + 1)
  return bloqueos
    .filter((b) => b.doctorId === doctorId && new Date(b.desde) < finDia && new Date(b.hasta) > inicioDia)
    .map((b) => {
      const desde = Math.max(0, (new Date(b.desde).getTime() - inicioDia.getTime()) / 60000)
      const hasta = Math.min(24 * 60, (new Date(b.hasta).getTime() - inicioDia.getTime()) / 60000)
      return { bloqueo: b, desde, hasta }
    })
}

export function horaLegible(minutos: number) {
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  const periodo = h < 12 ? 'a. m.' : 'p. m.'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${periodo}`
}

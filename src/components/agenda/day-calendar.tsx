import { useEffect, useRef } from 'react'
import type { BloqueoAgenda, CitaResponse, HorarioFranja } from '@/types'
import { useScrollShadows } from '@/hooks/use-scroll-shadows'
import { bloqueosDelDia, esMismoDia, franjasDelDia, horaLegible } from '@/lib/agenda'
import { CodigoPaciente } from '@/components/codigo-paciente'
import { etiquetaEstado } from '@/components/estado-chip'
import { cn } from '@/lib/utils'
import { Ban } from 'lucide-react'

const HORA_INICIO = 7
const HORA_FIN = 20
const SLOT_MINUTOS = 30
const TOTAL_SLOTS = ((HORA_FIN - HORA_INICIO) * 60) / SLOT_MINUTOS
const ALTO_SLOT_REM = 3

const COLOR_ESTADO: Record<string, string> = {
  PROGRAMADA: 'bg-info-suave text-info ring-info/25',
  CONFIRMADA: 'bg-exito-suave text-exito ring-exito/30',
  EN_ESPERA: 'bg-aviso-suave text-aviso ring-aviso/40',
  EN_CONSULTA: 'bg-info-suave text-info ring-info/50 ring-2',
  COMPLETADA: 'bg-muted text-muted-foreground ring-border',
  CANCELADA: 'bg-peligro-suave text-destructive ring-destructive/20 line-through',
  NO_ASISTIO: 'bg-aviso-suave text-aviso ring-aviso/25',
}

/** Una columna de la agenda: un medico en un dia (vista diaria) o un dia de un medico (vista semanal). */
export interface ColumnaAgenda {
  clave: string
  titulo: React.ReactNode
  doctorId: string
  fecha: Date
  resaltada?: boolean
}

interface Props {
  columnas: ColumnaAgenda[]
  citas: CitaResponse[]
  horarios: HorarioFranja[]
  bloqueos: BloqueoAgenda[]
  onCeldaVacia: (doctorId: string, fechaHora: Date) => void
  onCita: (cita: CitaResponse) => void
  onBloqueo?: (bloqueo: BloqueoAgenda) => void
  /** ancho minimo de columna; la vista semanal usa columnas mas angostas */
  anchoColumna?: string
}

export function AgendaGrid({ columnas, citas, horarios, bloqueos, onCeldaVacia, onCita, onBloqueo, anchoColumna = '10rem' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const { puedeScrollIzq, puedeScrollDer, alHacerScroll } = useScrollShadows(containerRef, gridRef)

  const ahora = new Date()
  const columnaDeHoy = columnas.find((c) => esMismoDia(c.fecha, ahora))
  const clave = columnas.map((c) => c.clave).join('|')

  // Abre donde importa: hoy, una hora antes de la actual; si no, media hora
  // antes de la primera cita visible (o a las 8:00 si esta libre).
  const primeraCita = citas
    .filter((c) => columnas.some((col) => col.doctorId === c.doctorId && esMismoDia(new Date(c.fechaHora), col.fecha)))
    .reduce<number | null>((min, c) => {
      const d = new Date(c.fechaHora)
      const m = d.getHours() * 60 + d.getMinutes()
      return min === null || m < min ? m : min
    }, null)
  useEffect(() => {
    const contenedor = containerRef.current
    if (!contenedor) return
    const objetivo = columnaDeHoy ? ahora.getHours() * 60 - 60 : primeraCita !== null ? primeraCita - 30 : 8 * 60
    const filas = Math.max(0, (objetivo - HORA_INICIO * 60) / SLOT_MINUTOS)
    const remPx = parseFloat(getComputedStyle(document.documentElement).fontSize)
    contenedor.scrollTop = filas * ALTO_SLOT_REM * remPx
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, primeraCita])

  if (columnas.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        No hay médicos registrados. Agregá uno en Personal para poder agendar citas.
      </div>
    )
  }

  const filaDe = (minutos: number) => 2 + (minutos - HORA_INICIO * 60) / SLOT_MINUTOS
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes()
  const filaAhora = columnaDeHoy ? filaDe(minutosAhora) : null
  const mismoDia = columnas.every((c) => esMismoDia(c.fecha, columnas[0].fecha))

  const columnasTemplate = `5.25rem repeat(${columnas.length}, minmax(${anchoColumna}, 1fr))`
  const filasTemplate = `2.75rem repeat(${TOTAL_SLOTS}, ${ALTO_SLOT_REM}rem)`

  return (
    <div className="relative">
      <div ref={containerRef} onScroll={alHacerScroll} className="max-h-[calc(100vh-15rem)] min-h-[24rem] overflow-auto rounded-lg border bg-card">
        <div ref={gridRef} className="grid" style={{ gridTemplateColumns: columnasTemplate, gridTemplateRows: filasTemplate }}>
          <div className="sticky top-0 left-0 z-30 border-b bg-carton" style={{ gridColumn: 1, gridRow: 1 }} />
          {columnas.map((col, i) => (
            <div
              key={col.clave}
              className={cn(
                'sticky top-0 z-20 flex items-center justify-center border-b border-l px-2 text-center text-sm font-semibold text-tinta',
                col.resaltada ? 'bg-info-suave' : 'bg-carton',
              )}
              style={{ gridColumn: i + 2, gridRow: 1 }}
            >
              {col.titulo}
            </div>
          ))}

          {Array.from({ length: TOTAL_SLOTS }).map((_, s) => (
            <div
              key={`hora-${s}`}
              className="sticky left-0 z-10 flex items-start justify-end border-b bg-carton pt-1 pr-2.5 text-[11px] font-medium whitespace-nowrap text-carton-foreground [font-variant-numeric:tabular-nums]"
              style={{ gridColumn: 1, gridRow: s + 2 }}
            >
              {s % 2 === 0 ? horaLegible(HORA_INICIO * 60 + s * SLOT_MINUTOS) : null}
            </div>
          ))}

          {columnas.flatMap((col, i) => {
            const franjas = franjasDelDia(horarios, col.doctorId, col.fecha)
            return Array.from({ length: TOTAL_SLOTS }).map((_, s) => {
              const minutos = HORA_INICIO * 60 + s * SLOT_MINUTOS
              const celda = new Date(col.fecha)
              celda.setHours(0, minutos, 0, 0)
              const yaPaso = celda.getTime() < ahora.getTime()
              const fueraDeHorario = franjas !== null && !franjas.some(([a, b]) => minutos >= a && minutos < b)
              return (
                <button
                  key={`celda-${col.clave}-${s}`}
                  type="button"
                  disabled={yaPaso}
                  title={yaPaso ? 'Este horario ya pasó' : fueraDeHorario ? 'Fuera del horario de atención' : undefined}
                  aria-label={yaPaso ? undefined : `Agendar ${horaLegible(minutos)}`}
                  className={cn(
                    'border-b border-l',
                    yaPaso
                      ? 'cursor-not-allowed bg-[repeating-linear-gradient(135deg,transparent,transparent_6px,var(--border)_6px,var(--border)_7px)]'
                      : 'transition-colors hover:bg-accent/70',
                    !yaPaso && fueraDeHorario && 'bg-carton/55',
                  )}
                  style={{ gridColumn: i + 2, gridRow: s + 2 }}
                  onClick={() => onCeldaVacia(col.doctorId, celda)}
                />
              )
            })
          })}

          {columnas.flatMap((col, i) =>
            bloqueosDelDia(bloqueos, col.doctorId, col.fecha).map(({ bloqueo, desde, hasta }) => {
              const inicio = Math.max(desde, HORA_INICIO * 60)
              const fin = Math.min(hasta, HORA_FIN * 60)
              if (fin <= inicio) return null
              return (
                <button
                  key={`${col.clave}-${bloqueo.id}`}
                  type="button"
                  onClick={() => onBloqueo?.(bloqueo)}
                  className="z-[5] m-0.5 flex flex-col justify-start rounded-[5px] bg-[repeating-linear-gradient(135deg,var(--muted),var(--muted)_8px,var(--card)_8px,var(--card)_14px)] px-2 py-1.5 text-left text-xs text-muted-foreground ring-1 ring-border ring-inset"
                  style={{ gridColumn: i + 2, gridRow: `${Math.floor(filaDe(inicio))} / ${Math.ceil(filaDe(fin))}` }}
                >
                  {/* la etiqueta acompana el scroll: un bloqueo de dias completos sigue diciendo por que */}
                  <span className="sticky top-[3.25rem] flex flex-col items-start gap-0.5">
                    <span className="inline-flex items-center gap-1 rounded bg-card/95 px-1 font-semibold text-tinta">
                      <Ban className="size-3" />
                      No atiende
                    </span>
                    {bloqueo.motivo && <span className="rounded bg-card/95 px-1">{bloqueo.motivo}</span>}
                  </span>
                </button>
              )
            }),
          )}

          {columnas.flatMap((col, i) =>
            citas
              .filter((c) => c.doctorId === col.doctorId && esMismoDia(new Date(c.fechaHora), col.fecha))
              .map((cita) => {
                const inicio = new Date(cita.fechaHora)
                const minutos = inicio.getHours() * 60 + inicio.getMinutes()
                const filaInicio = Math.max(2, Math.round(filaDe(minutos)))
                const filaSpan = Math.max(1, Math.round(cita.duracionMinutos / SLOT_MINUTOS))
                return (
                  <button
                    key={cita.id}
                    type="button"
                    onClick={() => onCita(cita)}
                    className={`z-10 m-0.5 overflow-hidden rounded-[5px] px-2 py-1 text-left text-xs shadow-[0_1px_2px_rgb(16_38_59/0.08)] ring-1 transition-shadow ring-inset hover:shadow-[0_4px_12px_-4px_rgb(16_38_59/0.3)] ${COLOR_ESTADO[cita.estado] ?? ''}`}
                    style={{ gridColumn: i + 2, gridRow: `${filaInicio} / span ${filaSpan}` }}
                  >
                    <span className="flex items-center gap-1.5">
                      <CodigoPaciente id={cita.pacienteId} />
                      <span className="truncate font-semibold text-tinta">{cita.pacienteNombre}</span>
                    </span>
                    <span className="mt-0.5 block truncate">
                      {inicio.toLocaleTimeString('es-SV', { hour: 'numeric', minute: '2-digit' })}
                      {' · '}
                      {['EN_ESPERA', 'EN_CONSULTA'].includes(cita.estado) ? etiquetaEstado(cita.estado) : cita.motivo || etiquetaEstado(cita.estado)}
                    </span>
                  </button>
                )
              }),
          )}

          {filaAhora !== null && filaAhora >= 2 && filaAhora <= TOTAL_SLOTS + 2 && (
            <div
              className="pointer-events-none z-20 flex items-center"
              style={{
                // vista diaria: cruza todos los medicos; semanal: solo la columna de hoy
                gridColumn: mismoDia ? `1 / span ${columnas.length + 1}` : `${columnas.indexOf(columnaDeHoy!) + 2}`,
                gridRow: 2,
                marginTop: `${(filaAhora - 2) * ALTO_SLOT_REM}rem`,
              }}
            >
              <div className="size-2 shrink-0 rounded-full bg-aviso" style={{ marginLeft: mismoDia ? '5rem' : '-0.25rem' }} />
              <div className="h-0.5 flex-1 bg-aviso" />
            </div>
          )}
        </div>
      </div>
      {puedeScrollIzq && <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-card to-transparent" />}
      {puedeScrollDer && <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-card to-transparent" />}
    </div>
  )
}

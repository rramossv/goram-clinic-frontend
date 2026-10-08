import { useEffect, useRef } from 'react'
import type { CitaResponse, UsuarioResumen } from '@/types'
import { useScrollShadows } from '@/hooks/use-scroll-shadows'
import { CodigoPaciente } from '@/components/codigo-paciente'
import { etiquetaEstado } from '@/components/estado-chip'

const HORA_INICIO = 7
const HORA_FIN = 19
const SLOT_MINUTOS = 30
const TOTAL_SLOTS = ((HORA_FIN - HORA_INICIO) * 60) / SLOT_MINUTOS

const COLOR_ESTADO: Record<string, string> = {
  PROGRAMADA: 'bg-info-suave text-info ring-info/25',
  CONFIRMADA: 'bg-exito-suave text-exito ring-exito/30',
  COMPLETADA: 'bg-muted text-muted-foreground ring-border',
  CANCELADA: 'bg-peligro-suave text-destructive ring-destructive/20 line-through',
  NO_ASISTIO: 'bg-aviso-suave text-aviso ring-aviso/25',
}

function etiquetaHora(minutosDesdeMedianoche: number) {
  const h = Math.floor(minutosDesdeMedianoche / 60)
  const m = minutosDesdeMedianoche % 60
  const periodo = h < 12 ? 'a. m.' : 'p. m.'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${periodo}`
}

function esMismoDia(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

interface DayCalendarProps {
  fecha: Date
  doctores: UsuarioResumen[]
  citas: CitaResponse[]
  onCeldaVacia: (doctorId: string, fechaHora: Date) => void
  onCita: (cita: CitaResponse) => void
}

export function DayCalendar({ fecha, doctores, citas, onCeldaVacia, onCita }: DayCalendarProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const { puedeScrollIzq, puedeScrollDer, alHacerScroll } = useScrollShadows(containerRef, gridRef)

  // Al abrir el dia de hoy, la grilla arranca una hora antes de la actual en
  // vez de mostrar la manana ya transcurrida.
  const esHoyFecha = esMismoDia(fecha, new Date())
  useEffect(() => {
    const contenedor = containerRef.current
    if (!contenedor || !esHoyFecha) return
    const minutos = new Date().getHours() * 60 - 60 - HORA_INICIO * 60
    const filas = Math.max(0, minutos / SLOT_MINUTOS)
    const remPx = parseFloat(getComputedStyle(document.documentElement).fontSize)
    contenedor.scrollTop = filas * 3 * remPx
  }, [esHoyFecha, doctores.length])

  if (doctores.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        No hay doctores registrados. Agrega uno en la seccion Personal para poder agendar citas.
      </div>
    )
  }

  const ahora = new Date()
  const esHoy = esMismoDia(fecha, ahora)
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes()

  function posicion(cita: CitaResponse) {
    const inicio = new Date(cita.fechaHora)
    const minutosDelDia = inicio.getHours() * 60 + inicio.getMinutes()
    const minutosDesdeInicio = minutosDelDia - HORA_INICIO * 60
    const filaInicio = Math.max(2, Math.round(minutosDesdeInicio / SLOT_MINUTOS) + 2)
    const filaSpan = Math.max(1, Math.round(cita.duracionMinutos / SLOT_MINUTOS))
    return { filaInicio, filaSpan }
  }

  const columnasTemplate = `5.25rem repeat(${doctores.length}, minmax(10rem, 1fr))`
  const filasTemplate = `2.5rem repeat(${TOTAL_SLOTS}, 3rem)`

  // fila (fraccional) donde cae la hora actual, para la linea indicadora
  const filaAhora = esHoy ? 2 + (minutosAhora - HORA_INICIO * 60) / SLOT_MINUTOS : null

  return (
    <div className="relative">
      <div
        ref={containerRef}
        onScroll={alHacerScroll}
        className="max-h-[calc(100vh-15rem)] overflow-auto rounded-lg border bg-card"
      >
      <div
        ref={gridRef}
        className="grid"
        style={{ gridTemplateColumns: columnasTemplate, gridTemplateRows: filasTemplate }}
      >
        <div className="sticky top-0 left-0 z-30 border-b bg-carton" style={{ gridColumn: 1, gridRow: 1 }} />
        {doctores.map((doctor, indice) => (
          <div
            key={doctor.id}
            className="sticky top-0 z-20 flex items-center justify-center border-b border-l bg-carton px-2 text-sm font-semibold text-tinta"
            style={{ gridColumn: indice + 2, gridRow: 1 }}
          >
            {doctor.nombre}
          </div>
        ))}

        {Array.from({ length: TOTAL_SLOTS }).map((_, indiceSlot) => {
          const minutos = HORA_INICIO * 60 + indiceSlot * SLOT_MINUTOS
          return (
            <div
              key={`hora-${indiceSlot}`}
              className="sticky left-0 z-10 flex items-start justify-end border-b bg-carton pr-2.5 pt-1 text-[11px] font-medium whitespace-nowrap text-carton-foreground [font-variant-numeric:tabular-nums]"
              style={{ gridColumn: 1, gridRow: indiceSlot + 2 }}
            >
              {indiceSlot % 2 === 0 ? etiquetaHora(minutos) : null}
            </div>
          )
        })}

        {doctores.flatMap((doctor, indiceDoctor) =>
          Array.from({ length: TOTAL_SLOTS }).map((_, indiceSlot) => {
            const minutos = HORA_INICIO * 60 + indiceSlot * SLOT_MINUTOS
            const celda = new Date(fecha)
            celda.setHours(0, minutos, 0, 0)
            const yaPaso = celda.getTime() < ahora.getTime()

            return (
              <button
                key={`celda-${doctor.id}-${indiceSlot}`}
                type="button"
                disabled={yaPaso}
                title={yaPaso ? 'Este horario ya paso' : undefined}
                className={
                  yaPaso
                    ? 'border-b border-l bg-[repeating-linear-gradient(135deg,transparent,transparent_6px,var(--border)_6px,var(--border)_7px)] cursor-not-allowed'
                    : 'border-b border-l transition-colors hover:bg-accent/70'
                }
                style={{ gridColumn: indiceDoctor + 2, gridRow: indiceSlot + 2 }}
                onClick={() => onCeldaVacia(doctor.id, celda)}
              />
            )
          }),
        )}

        {doctores.flatMap((doctor, indiceDoctor) =>
          citas
            .filter((cita) => cita.doctorId === doctor.id && esMismoDia(new Date(cita.fechaHora), fecha))
            .map((cita) => {
              const { filaInicio, filaSpan } = posicion(cita)
              return (
                <button
                  key={cita.id}
                  type="button"
                  onClick={() => onCita(cita)}
                  className={`z-10 m-0.5 overflow-hidden rounded-[5px] px-2 py-1 text-left text-xs ring-1 ring-inset shadow-[0_1px_2px_rgb(16_38_59/0.08)] transition-shadow hover:shadow-[0_4px_12px_-4px_rgb(16_38_59/0.3)] ${COLOR_ESTADO[cita.estado] ?? ''}`}
                  style={{ gridColumn: indiceDoctor + 2, gridRow: `${filaInicio} / span ${filaSpan}` }}
                >
                  <span className="flex items-center gap-1.5">
                    <CodigoPaciente id={cita.pacienteId} />
                    <span className="truncate font-semibold text-tinta">{cita.pacienteNombre}</span>
                  </span>
                  <span className="mt-0.5 block truncate">
                    {new Date(cita.fechaHora).toLocaleTimeString('es-SV', { hour: 'numeric', minute: '2-digit' })}
                    {' · '}
                    {cita.motivo || etiquetaEstado(cita.estado)}
                  </span>
                </button>
              )
            }),
        )}

        {filaAhora !== null && filaAhora >= 2 && filaAhora <= TOTAL_SLOTS + 2 && (
          <div
            className="pointer-events-none z-20 flex items-center"
            style={{ gridColumn: `1 / span ${doctores.length + 1}`, gridRow: 2, marginTop: `${(filaAhora - 2) * 3}rem` }}
          >
            <div className="h-2 w-2 shrink-0 rounded-full bg-aviso" style={{ marginLeft: '5rem' }} />
            <div className="h-0.5 flex-1 bg-aviso" />
          </div>
        )}
      </div>
      </div>
      {puedeScrollIzq && (
        <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-card to-transparent" />
      )}
      {puedeScrollDer && (
        <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-card to-transparent" />
      )}
    </div>
  )
}

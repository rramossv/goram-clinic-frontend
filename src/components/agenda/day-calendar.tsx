import type { CitaResponse, UsuarioResumen } from '@/types'

const HORA_INICIO = 7
const HORA_FIN = 19
const SLOT_MINUTOS = 30
const TOTAL_SLOTS = ((HORA_FIN - HORA_INICIO) * 60) / SLOT_MINUTOS

const COLOR_ESTADO: Record<string, string> = {
  PROGRAMADA: 'bg-blue-100 border-blue-300 text-blue-900 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-100',
  CONFIRMADA:
    'bg-emerald-100 border-emerald-300 text-emerald-900 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-100',
  COMPLETADA: 'bg-muted border-border text-muted-foreground',
  CANCELADA:
    'bg-red-50 border-red-200 text-red-800 line-through dark:bg-red-950 dark:border-red-900 dark:text-red-200',
  NO_ASISTIO:
    'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-950 dark:border-orange-900 dark:text-orange-200',
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
  if (doctores.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-muted-foreground">
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

  const columnasTemplate = `4rem repeat(${doctores.length}, minmax(10rem, 1fr))`
  const filasTemplate = `2.5rem repeat(${TOTAL_SLOTS}, 3rem)`

  // fila (fraccional) donde cae la hora actual, para la linea indicadora
  const filaAhora = esHoy ? 2 + (minutosAhora - HORA_INICIO * 60) / SLOT_MINUTOS : null

  return (
    <div className="relative max-h-[calc(100vh-14rem)] overflow-auto rounded-md border">
      <div className="grid" style={{ gridTemplateColumns: columnasTemplate, gridTemplateRows: filasTemplate }}>
        <div className="sticky top-0 left-0 z-30 border-b bg-background" style={{ gridColumn: 1, gridRow: 1 }} />
        {doctores.map((doctor, indice) => (
          <div
            key={doctor.id}
            className="sticky top-0 z-20 flex items-center justify-center border-b border-l bg-background px-2 text-sm font-medium"
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
              className="sticky left-0 z-10 flex items-start justify-end border-b bg-background pr-2 pt-1 text-xs text-muted-foreground"
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
                    ? 'border-b border-l bg-[repeating-linear-gradient(135deg,transparent,transparent_6px,var(--muted)_6px,var(--muted)_7px)] cursor-not-allowed'
                    : 'border-b border-l hover:bg-accent/50'
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
                  className={`z-10 m-0.5 overflow-hidden rounded-md border px-2 py-1 text-left text-xs shadow-sm transition-shadow hover:shadow-md ${COLOR_ESTADO[cita.estado] ?? ''}`}
                  style={{ gridColumn: indiceDoctor + 2, gridRow: `${filaInicio} / span ${filaSpan}` }}
                >
                  <p className="truncate font-medium">{cita.pacienteNombre}</p>
                  <p className="truncate opacity-80">{cita.motivo || cita.estado}</p>
                </button>
              )
            }),
        )}

        {filaAhora !== null && filaAhora >= 2 && filaAhora <= TOTAL_SLOTS + 2 && (
          <div
            className="pointer-events-none z-20 flex items-center"
            style={{ gridColumn: `1 / span ${doctores.length + 1}`, gridRow: 2, marginTop: `${(filaAhora - 2) * 3}rem` }}
          >
            <div className="h-2 w-2 shrink-0 rounded-full bg-destructive" style={{ marginLeft: '3.75rem' }} />
            <div className="h-px flex-1 bg-destructive" />
          </div>
        )}
      </div>
    </div>
  )
}

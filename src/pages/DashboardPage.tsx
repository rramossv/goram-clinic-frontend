import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { esConsultorio, etiquetaRol, useAuth } from '@/lib/auth-context'
import { apiFetch } from '@/lib/api'
import type { CitaResponse, FacturaResponse, PacienteResponse, SuscripcionResponse } from '@/types'
import { PageHeader, Seccion } from '@/components/page-header'
import { CodigoPaciente } from '@/components/codigo-paciente'
import { EstadoChip } from '@/components/estado-chip'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowRight, CalendarPlus } from 'lucide-react'
import { cn } from '@/lib/utils'

function esHoy(fechaIso: string) {
  const fecha = new Date(fechaIso)
  const ahora = new Date()
  return (
    fecha.getFullYear() === ahora.getFullYear() &&
    fecha.getMonth() === ahora.getMonth() &&
    fecha.getDate() === ahora.getDate()
  )
}

function esEsteMes(fechaIso: string) {
  const fecha = new Date(fechaIso)
  const ahora = new Date()
  return fecha.getFullYear() === ahora.getFullYear() && fecha.getMonth() === ahora.getMonth()
}

function saludo() {
  const hora = new Date().getHours()
  if (hora < 12) return 'Buenos días'
  if (hora < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

const dinero = (valor: number) =>
  `$${valor.toLocaleString('es-SV', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const hora = (iso: string) => new Date(iso).toLocaleTimeString('es-SV', { hour: 'numeric', minute: '2-digit' })

function FilaResumen({ etiqueta, valor, detalle }: { etiqueta: string; valor: string; detalle?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b py-3 last:border-b-0">
      <div>
        <p className="text-sm text-foreground">{etiqueta}</p>
        {detalle && <p className="text-xs text-muted-foreground">{detalle}</p>}
      </div>
      <p className="text-lg font-semibold text-tinta [font-variant-numeric:tabular-nums]">{valor}</p>
    </div>
  )
}

export function DashboardPage() {
  const { sesion } = useAuth()
  const consultorio = esConsultorio(sesion)
  const [citasHoy, setCitasHoy] = useState<CitaResponse[]>([])
  const [citasMes, setCitasMes] = useState(0)
  const [ingresosMes, setIngresosMes] = useState(0)
  const [pacientesNuevos, setPacientesNuevos] = useState(0)
  const [totalPacientes, setTotalPacientes] = useState(0)
  const [suscripcion, setSuscripcion] = useState<SuscripcionResponse | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (sesion?.rol === 'SUPER_ADMIN') {
      setCargando(false)
      return
    }

    Promise.all([
      apiFetch<CitaResponse[]>('/api/v1/citas'),
      apiFetch<FacturaResponse[]>('/api/v1/facturas'),
      apiFetch<PacienteResponse[]>('/api/v1/pacientes'),
      apiFetch<SuscripcionResponse>('/api/v1/suscripciones/actual'),
    ])
      .then(([citas, facturas, pacientes, suscripcionData]) => {
        setCitasHoy(citas.filter((c) => esHoy(c.fechaHora)).sort((a, b) => a.fechaHora.localeCompare(b.fechaHora)))
        setCitasMes(citas.filter((c) => esEsteMes(c.fechaHora) && c.estado !== 'CANCELADA').length)
        setIngresosMes(
          facturas
            .filter((f) => f.estado === 'EMITIDA' && esEsteMes(f.creadoEn))
            .reduce((suma, f) => suma + f.total, 0),
        )
        setPacientesNuevos(pacientes.filter((p) => esEsteMes(p.creadoEn)).length)
        setTotalPacientes(pacientes.filter((p) => p.activo).length)
        setSuscripcion(suscripcionData)
      })
      .catch(() => {})
      .finally(() => setCargando(false))
  }, [sesion])

  const ahora = Date.now()
  // la siguiente cita aun por atender: se resalta como el folder que sigue
  const siguienteId = citasHoy.find(
    (c) => new Date(c.fechaHora).getTime() + c.duracionMinutos * 60000 > ahora && ['PROGRAMADA', 'CONFIRMADA'].includes(c.estado),
  )?.id
  const pendientesHoy = citasHoy.filter((c) => ['PROGRAMADA', 'CONFIRMADA'].includes(c.estado)).length
  const mes = new Date().toLocaleDateString('es-SV', { month: 'long' })

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        titulo={`${saludo()}, ${sesion?.nombre ?? ''}`}
        descripcion={
          cargando
            ? etiquetaRol(sesion)
            : citasHoy.length === 0
              ? 'No tenés citas agendadas para hoy.'
              : `${citasHoy.length} ${citasHoy.length === 1 ? 'cita' : 'citas'} hoy, ${pendientesHoy} por atender.`
        }
        acciones={
          <Button asChild>
            <Link to="/agenda">
              <CalendarPlus />
              Agendar cita
            </Link>
          </Button>
        }
      />

      {sesion?.rol !== 'SUPER_ADMIN' && (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
          <Seccion
            titulo={consultorio ? 'Mis pacientes de hoy' : 'Agenda de hoy'}
            accion={
              <Link to="/agenda" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                Ver agenda completa
                <ArrowRight className="size-3.5" />
              </Link>
            }
          >
            <div className="overflow-hidden rounded-lg border bg-card">
              {cargando ? (
                <div className="flex flex-col divide-y">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-4 px-4 py-3.5">
                      <Skeleton className="h-4 w-14" />
                      <Skeleton className="h-4 w-8" />
                      <Skeleton className="h-4 flex-1" />
                    </div>
                  ))}
                </div>
              ) : citasHoy.length === 0 ? (
                <div className="flex flex-col items-start gap-3 px-5 py-8">
                  <p className="font-medium text-tinta">Tu agenda de hoy está libre.</p>
                  <p className="max-w-md text-sm text-muted-foreground">
                    Las citas que agendes para hoy aparecerán aquí en orden de hora, con el código de color de cada
                    paciente para reconocerlo de un vistazo.
                  </p>
                  <Button asChild variant="outline" size="sm" className="mt-1">
                    <Link to="/agenda">Abrir la agenda</Link>
                  </Button>
                </div>
              ) : (
                <ol className="divide-y">
                  {citasHoy.map((cita) => {
                    const esSiguiente = cita.id === siguienteId
                    return (
                      <li
                        key={cita.id}
                        className={cn(
                          'grid grid-cols-[5.25rem_minmax(0,1fr)] items-center gap-x-4 gap-y-2 px-4 py-3 sm:grid-cols-[5.5rem_auto_minmax(0,1fr)_auto]',
                          esSiguiente && 'bg-info-suave/60',
                        )}
                      >
                        <div className="flex flex-col">
                          <time className="text-[15px] font-semibold whitespace-nowrap text-tinta">{hora(cita.fechaHora)}</time>
                          <span className="text-xs text-muted-foreground">{cita.duracionMinutos} min</span>
                        </div>
                        <CodigoPaciente id={cita.pacienteId} className="hidden sm:inline-flex" />
                        <div className="min-w-0">
                          <Link
                            to={`/pacientes/${cita.pacienteId}`}
                            className="block truncate font-medium text-tinta hover:underline"
                          >
                            {cita.pacienteNombre}
                          </Link>
                          <p className="truncate text-sm text-muted-foreground">
                            {cita.motivo || 'Sin motivo registrado'}
                            {!consultorio && ` · ${cita.doctorNombre}`}
                          </p>
                        </div>
                        <div className="col-start-2 flex items-center gap-2 sm:col-start-auto">
                          {esSiguiente && (
                            <span className="text-xs font-semibold tracking-wide text-info uppercase">Siguiente</span>
                          )}
                          <EstadoChip estado={cita.estado} />
                        </div>
                      </li>
                    )
                  })}
                </ol>
              )}
            </div>
          </Seccion>

          <div className="flex flex-col gap-8">
            <Seccion titulo={`Resumen de ${mes}`}>
              <div className="rounded-lg border bg-card px-4">
                {cargando ? (
                  <div className="flex flex-col gap-3 py-4">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                  </div>
                ) : (
                  <>
                    <FilaResumen etiqueta="Ingresos facturados" valor={dinero(ingresosMes)} detalle="Facturas emitidas" />
                    <FilaResumen etiqueta="Citas del mes" valor={String(citasMes)} detalle="Sin contar canceladas" />
                    <FilaResumen
                      etiqueta="Pacientes nuevos"
                      valor={String(pacientesNuevos)}
                      detalle={`${totalPacientes} pacientes activos en total`}
                    />
                  </>
                )}
              </div>
            </Seccion>

            {suscripcion && (
              <Seccion
                titulo="Suscripción"
                accion={
                  <Link to="/suscripcion" className="text-sm font-medium text-primary hover:underline">
                    Detalle
                  </Link>
                }
              >
                <div className="flex flex-col gap-3 rounded-lg border bg-carton/60 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-tinta">Plan {suscripcion.planNombre}</p>
                    <EstadoChip estado={suscripcion.estado} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Próximo cobro el{' '}
                    <time className="text-foreground">
                      {new Date(suscripcion.proximaFechaCobro).toLocaleDateString('es-SV', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </time>
                  </p>
                </div>
              </Seccion>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

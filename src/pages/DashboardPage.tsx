import { useEffect, useState, type ComponentType } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { apiFetch } from '@/lib/api'
import type { CitaResponse, FacturaResponse, PacienteResponse, SuscripcionResponse } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, DollarSign, UserPlus } from 'lucide-react'

const VARIANTE_ESTADO: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PROGRAMADA: 'outline',
  CONFIRMADA: 'default',
  COMPLETADA: 'secondary',
  CANCELADA: 'destructive',
  NO_ASISTIO: 'destructive',
}

function StatTile({
  icono: Icono,
  etiqueta,
  valor,
}: {
  icono: ComponentType<{ className?: string }>
  etiqueta: string
  valor: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icono className="size-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{etiqueta}</p>
          <p className="text-2xl font-semibold">{valor}</p>
        </div>
      </CardContent>
    </Card>
  )
}

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

export function DashboardPage() {
  const { sesion } = useAuth()
  const [citasHoy, setCitasHoy] = useState<CitaResponse[]>([])
  const [ingresosMes, setIngresosMes] = useState(0)
  const [pacientesNuevos, setPacientesNuevos] = useState(0)
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
        setIngresosMes(
          facturas
            .filter((f) => f.estado === 'EMITIDA' && esEsteMes(f.creadoEn))
            .reduce((suma, f) => suma + f.total, 0),
        )
        setPacientesNuevos(pacientes.filter((p) => esEsteMes(p.creadoEn)).length)
        setSuscripcion(suscripcionData)
      })
      .catch(() => {})
      .finally(() => setCargando(false))
  }, [sesion])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Hola, {sesion?.nombre}</h1>
        <p className="text-muted-foreground">{sesion?.rol}</p>
      </div>

      {!cargando && sesion?.rol !== 'SUPER_ADMIN' && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatTile icono={CalendarDays} etiqueta="Citas de hoy" valor={String(citasHoy.length)} />
            <StatTile
              icono={DollarSign}
              etiqueta="Ingresos este mes"
              valor={`$${ingresosMes.toLocaleString('es-SV', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            />
            <StatTile icono={UserPlus} etiqueta="Pacientes nuevos este mes" valor={String(pacientesNuevos)} />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Agenda de hoy</CardTitle>
                <CardDescription>
                  <Link to="/agenda" className="underline-offset-2 hover:underline">
                    Ver calendario completo
                  </Link>
                </CardDescription>
              </CardHeader>
              <CardContent>
                {citasHoy.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay citas agendadas para hoy.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {citasHoy.map((cita) => (
                      <div
                        key={cita.id}
                        className="flex items-center justify-between rounded-md border p-3 text-sm"
                      >
                        <div>
                          <p className="font-medium">{cita.pacienteNombre}</p>
                          <p className="text-muted-foreground">
                            {new Date(cita.fechaHora).toLocaleTimeString('es-SV', { timeStyle: 'short' })} con{' '}
                            {cita.doctorNombre}
                          </p>
                        </div>
                        <Badge variant={VARIANTE_ESTADO[cita.estado] ?? 'outline'}>{cita.estado}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {suscripcion && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Suscripcion</CardTitle>
                  <CardDescription>Plan {suscripcion.planNombre}</CardDescription>
                </CardHeader>
                <CardContent className="text-sm">
                  <p>
                    Estado: <span className="font-medium">{suscripcion.estado}</span>
                  </p>
                  <p className="text-muted-foreground">
                    Proximo cobro: {new Date(suscripcion.proximaFechaCobro).toLocaleDateString('es-SV')}
                  </p>
                  <Link to="/suscripcion" className="mt-2 inline-block text-sm underline-offset-2 hover:underline">
                    Ver detalle
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  )
}

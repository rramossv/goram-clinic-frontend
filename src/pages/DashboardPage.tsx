import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { apiFetch } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface SuscripcionActual {
  id: string
  planCodigo: string
  planNombre: string
  estado: string
  fechaInicio: string
  proximaFechaCobro: string
}

export function DashboardPage() {
  const { sesion } = useAuth()
  const [suscripcion, setSuscripcion] = useState<SuscripcionActual | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (sesion?.rol === 'SUPER_ADMIN') {
      setCargando(false)
      return
    }
    apiFetch<SuscripcionActual>('/api/v1/suscripciones/actual')
      .then(setSuscripcion)
      .catch(() => setSuscripcion(null))
      .finally(() => setCargando(false))
  }, [sesion])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Hola, {sesion?.nombre}</h1>
        <p className="text-muted-foreground">{sesion?.rol}</p>
      </div>

      {!cargando && suscripcion && (
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle>Suscripcion</CardTitle>
            <CardDescription>Plan {suscripcion.planNombre}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <p>
              Estado: <span className="font-medium">{suscripcion.estado}</span>
            </p>
            <p className="text-muted-foreground">
              Proximo cobro: {new Date(suscripcion.proximaFechaCobro).toLocaleDateString('es-SV')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { apiFetch, ApiRequestError } from '@/lib/api'
import type { SuscripcionResponse } from '@/types'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/page-header'
import { EstadoChip } from '@/components/estado-chip'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export function SuscripcionPage() {
  const [suscripcion, setSuscripcion] = useState<SuscripcionResponse | null>(null)
  const [cargando, setCargando] = useState(true)
  const [pagando, setPagando] = useState(false)

  async function cargar() {
    setCargando(true)
    try {
      const data = await apiFetch<SuscripcionResponse>('/api/v1/suscripciones/actual')
      setSuscripcion(data)
    } catch {
      toast.error('No se pudo cargar la suscripción')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  async function pagar() {
    setPagando(true)
    try {
      await apiFetch('/api/v1/suscripciones/pagar', { method: 'POST' })
      toast.success('Pago procesado, suscripción activa')
      cargar()
    } catch (err) {
      if (err instanceof ApiRequestError) {
        toast.error(err.body?.message ?? 'No se pudo procesar el pago')
      } else {
        toast.error('No se pudo conectar con el servidor')
      }
    } finally {
      setPagando(false)
    }
  }

  if (cargando) {
    return <p className="text-sm text-muted-foreground">Cargando...</p>
  }

  if (!suscripcion) {
    return <p className="text-sm text-muted-foreground">No se encontro información de suscripción.</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader titulo="Suscripción" descripcion="Tu plan de GoRam Clinic y su próximo cobro." />

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Plan {suscripcion.planNombre}</CardTitle>
          <CardDescription>
            <EstadoChip estado={suscripcion.estado} className="mt-1" />
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Inicio</span>
            <span>{new Date(suscripcion.fechaInicio).toLocaleDateString('es-SV')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Próximo cobro</span>
            <span>{new Date(suscripcion.proximaFechaCobro).toLocaleDateString('es-SV')}</span>
          </div>

          {suscripcion.estado === 'PENDIENTE_PAGO' && (
            <Button onClick={pagar} disabled={pagando} className="mt-2">
              {pagando ? 'Procesando...' : 'Pagar ahora'}
            </Button>
          )}

          {suscripcion.estado === 'SUSPENDIDA' && (
            <p className="text-sm text-destructive">
              Tu clínica está suspendida por falta de pago. Realiza el pago para reactivarla.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

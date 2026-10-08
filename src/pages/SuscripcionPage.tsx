import { useEffect, useState } from 'react'
import { apiFetch, ApiRequestError } from '@/lib/api'
import type { PlanResponse, SuscripcionResponse } from '@/types'
import { PageHeader, Seccion } from '@/components/page-header'
import { EstadoChip } from '@/components/estado-chip'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const fechaLarga = (iso: string) => new Date(iso).toLocaleDateString('es-SV', { day: 'numeric', month: 'long', year: 'numeric' })

function caracteristicas(plan: PlanResponse) {
  return [
    plan.limiteDoctores === null ? 'Médicos ilimitados' : plan.limiteDoctores === 1 ? '1 médico' : `Hasta ${plan.limiteDoctores} médicos`,
    plan.limiteUsuarios === null ? 'Usuarios ilimitados' : `${plan.limiteUsuarios} usuarios en total`,
    plan.limitePacientes === null ? 'Pacientes ilimitados' : `Hasta ${plan.limitePacientes} pacientes`,
    plan.incluyeFacturacionElectronica ? 'Facturación electrónica DTE' : 'Factura interna',
  ]
}

export function SuscripcionPage() {
  const [suscripcion, setSuscripcion] = useState<SuscripcionResponse | null>(null)
  const [planes, setPlanes] = useState<PlanResponse[]>([])
  const [cargando, setCargando] = useState(true)
  const [pagando, setPagando] = useState(false)
  const [planElegido, setPlanElegido] = useState<PlanResponse | null>(null)
  const [cambiando, setCambiando] = useState(false)

  async function cargar() {
    setCargando(true)
    try {
      const [s, p] = await Promise.all([
        apiFetch<SuscripcionResponse>('/api/v1/suscripciones/actual'),
        apiFetch<PlanResponse[]>('/api/v1/planes', { auth: false }),
      ])
      setSuscripcion(s)
      setPlanes(p)
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
      toast.error(err instanceof ApiRequestError ? (err.body?.message ?? 'No se pudo procesar el pago') : 'No se pudo conectar con el servidor')
    } finally {
      setPagando(false)
    }
  }

  async function cambiarPlan() {
    if (!planElegido) return
    setCambiando(true)
    try {
      await apiFetch('/api/v1/suscripciones/cambiar-plan', { method: 'POST', body: { planCodigo: planElegido.codigo } })
      toast.success(`Ahora estás en el plan ${planElegido.nombre}`)
      setPlanElegido(null)
      cargar()
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? (err.body?.message ?? 'No se pudo cambiar el plan') : 'No se pudo conectar con el servidor')
      setPlanElegido(null)
    } finally {
      setCambiando(false)
    }
  }

  if (cargando && !suscripcion) {
    return <Skeleton className="h-64 w-full" />
  }

  if (!suscripcion) {
    return <p className="text-sm text-muted-foreground">No se encontró información de suscripción.</p>
  }

  const actual = planes.find((p) => p.codigo === suscripcion.planCodigo)

  return (
    <div className="flex flex-col gap-8">
      <PageHeader titulo="Suscripción" descripcion="Tu plan de GoRam Clinic, su próximo cobro y los planes disponibles." />

      <Seccion titulo="Plan actual">
        <div className="flex flex-col gap-4 rounded-lg border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <p className="text-lg font-semibold text-tinta">Plan {suscripcion.planNombre}</p>
              <EstadoChip estado={suscripcion.estado} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {actual && `$${Number(actual.precioMensual).toFixed(2)} al mes · `}
              Desde el {fechaLarga(suscripcion.fechaInicio)} · Próximo cobro el {fechaLarga(suscripcion.proximaFechaCobro)}
            </p>
          </div>
          {suscripcion.estado === 'PENDIENTE_PAGO' && (
            <Button onClick={pagar} disabled={pagando}>
              {pagando ? 'Procesando...' : 'Pagar ahora'}
            </Button>
          )}
        </div>
        {suscripcion.estado === 'SUSPENDIDA' && (
          <p role="alert" className="rounded-md bg-peligro-suave px-4 py-3 text-sm text-destructive">
            Tu cuenta está suspendida por falta de pago. Realizá el pago para reactivarla.
          </p>
        )}
      </Seccion>

      <Seccion titulo="Cambiar de plan">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {planes.map((plan) => {
            const esActual = plan.codigo === suscripcion.planCodigo
            return (
              <div
                key={plan.id}
                className={cn('flex flex-col rounded-lg border bg-card p-5', esActual && 'border-primary ring-1 ring-primary')}
              >
                <p className="font-semibold text-tinta">{plan.nombre}</p>
                <p className="mt-2 text-2xl font-semibold text-tinta [font-variant-numeric:tabular-nums]">
                  ${Number(plan.precioMensual).toFixed(0)}
                  <span className="text-sm font-normal text-muted-foreground"> /mes</span>
                </p>
                <ul className="mt-4 flex flex-1 flex-col gap-2 text-sm">
                  {caracteristicas(plan).map((c) => (
                    <li key={c} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-exito" />
                      {c}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-5"
                  variant={esActual ? 'outline' : 'default'}
                  disabled={esActual}
                  onClick={() => setPlanElegido(plan)}
                >
                  {esActual ? 'Tu plan actual' : `Cambiar a ${plan.nombre}`}
                </Button>
              </div>
            )
          })}
        </div>
        <p className="text-sm text-muted-foreground">
          El cambio se aplica de inmediato. El nuevo precio se cobra a partir de tu próxima renovación.
        </p>
      </Seccion>

      <AlertDialog open={planElegido !== null} onOpenChange={(o) => !o && setPlanElegido(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cambiar al plan {planElegido?.nombre}</AlertDialogTitle>
            <AlertDialogDescription>
              Pasarás a pagar ${Number(planElegido?.precioMensual ?? 0).toFixed(2)} al mes desde tu próximo cobro (
              {fechaLarga(suscripcion.proximaFechaCobro)}). Los límites del nuevo plan aplican desde ahora.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={cambiarPlan} disabled={cambiando}>
              Confirmar cambio
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

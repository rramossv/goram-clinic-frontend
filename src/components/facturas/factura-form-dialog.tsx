import { useEffect, useState, type FormEvent } from 'react'
import { apiFetch, ApiRequestError } from '@/lib/api'
import type { FacturaResponse, PlanResponse, ServicioResponse, SuscripcionResponse } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PacienteSelector } from '@/components/pacientes/paciente-selector'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'

interface ItemFormulario {
  descripcion: string
  cantidad: string
  precioUnitario: string
}

const ITEM_VACIO: ItemFormulario = { descripcion: '', cantidad: '1', precioUnitario: '' }

export function abrirImpresionFactura(facturaId: string) {
  window.open(`/imprimir/factura/${facturaId}`, '_blank', 'noopener')
}

interface FacturaFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGuardado: () => void
  /** Pre-selecciona el paciente cuando se abre desde su ficha o desde una cita. */
  pacientePreseleccionado?: string | null
}

export function FacturaFormDialog({
  open,
  onOpenChange,
  onGuardado,
  pacientePreseleccionado,
}: FacturaFormDialogProps) {
  const [pacienteId, setPacienteId] = useState('')
  const [tipoDte, setTipoDte] = useState<'SIMPLE' | 'FE'>('SIMPLE')
  const [permiteFe, setPermiteFe] = useState(false)
  const [servicios, setServicios] = useState<ServicioResponse[]>([])
  const [items, setItems] = useState<ItemFormulario[]>([{ ...ITEM_VACIO }])
  const [imprimir, setImprimir] = useState(true)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!open) return
    setPacienteId(pacientePreseleccionado ?? '')
    setTipoDte('SIMPLE')
    setItems([{ ...ITEM_VACIO }])

    apiFetch<ServicioResponse[]>('/api/v1/servicios')
      .then((data) => setServicios(data.filter((s) => s.activo)))
      .catch(() => setServicios([]))

    Promise.all([
      apiFetch<SuscripcionResponse>('/api/v1/suscripciones/actual'),
      apiFetch<PlanResponse[]>('/api/v1/planes', { auth: false }),
    ])
      .then(([suscripcion, planes]) => {
        const plan = planes.find((p) => p.codigo === suscripcion.planCodigo)
        setPermiteFe(Boolean(plan?.incluyeFacturacionElectronica))
      })
      .catch(() => setPermiteFe(false))
  }, [open, pacientePreseleccionado])

  function actualizarItem(indice: number, campo: keyof ItemFormulario, valor: string) {
    setItems((anteriores) => anteriores.map((item, i) => (i === indice ? { ...item, [campo]: valor } : item)))
  }

  function agregarItem() {
    setItems((anteriores) => [...anteriores, { ...ITEM_VACIO }])
  }

  // Un servicio del catalogo llena la primera linea vacia o agrega una nueva.
  function agregarServicio(servicioId: string) {
    const servicio = servicios.find((s) => s.id === servicioId)
    if (!servicio) return
    const linea = { descripcion: servicio.nombre, cantidad: '1', precioUnitario: String(servicio.precio) }
    setItems((anteriores) => {
      const vacia = anteriores.findIndex((i) => !i.descripcion && !i.precioUnitario)
      return vacia >= 0 ? anteriores.map((item, i) => (i === vacia ? linea : item)) : [...anteriores, linea]
    })
  }

  function quitarItem(indice: number) {
    setItems((anteriores) => anteriores.filter((_, i) => i !== indice))
  }

  const subtotal = items.reduce(
    (acumulado, item) => acumulado + (Number(item.cantidad) || 0) * (Number(item.precioUnitario) || 0),
    0,
  )
  const iva = Math.round(subtotal * 0.13 * 100) / 100
  const total = subtotal + iva

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setEnviando(true)
    // La pestana de impresion se abre YA, dentro del clic: abrirla despues del
    // await la bloquean los navegadores como ventana emergente.
    const ventana = imprimir ? window.open('', '_blank') : null
    try {
      const factura = await apiFetch<FacturaResponse>('/api/v1/facturas', {
        method: 'POST',
        body: {
          pacienteId,
          tipoDte,
          items: items.map((item) => ({
            descripcion: item.descripcion.trim(),
            cantidad: Number(item.cantidad),
            precioUnitario: Number(item.precioUnitario),
          })),
        },
      })
      toast.success(tipoDte === 'FE' ? 'Factura creada; emití el DTE desde Facturación' : 'Factura emitida')
      if (ventana) ventana.location.href = `/imprimir/factura/${factura.id}`
      onGuardado()
    } catch (err) {
      ventana?.close()
      toast.error(err instanceof ApiRequestError ? (err.body?.message ?? 'No se pudo crear la factura') : 'No se pudo conectar con el servidor')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Nueva factura</DialogTitle>
            <DialogDescription>Los precios van sin IVA; el 13% se suma automáticamente.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-5 py-4">
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_14rem]">
              <div className="flex min-w-0 flex-col gap-2">
                <Label htmlFor="paciente">Paciente</Label>
                <PacienteSelector id="paciente" value={pacienteId} onChange={setPacienteId} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="tipoDte">Tipo de documento</Label>
                <Select value={tipoDte} onValueChange={(v) => setTipoDte(v as 'SIMPLE' | 'FE')}>
                  <SelectTrigger id="tipoDte" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SIMPLE">Factura interna</SelectItem>
                    <SelectItem value="FE" disabled={!permiteFe}>
                      Factura electrónica (DTE)
                    </SelectItem>
                  </SelectContent>
                </Select>
                {!permiteFe && (
                  <p className="text-xs text-muted-foreground">Tu plan no incluye facturación electrónica.</p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label>Detalle</Label>
                <div className="flex flex-wrap gap-2">
                  {servicios.length > 0 && (
                    <Select value="" onValueChange={agregarServicio}>
                      <SelectTrigger size="sm" className="w-52">
                        <SelectValue placeholder="Agregar servicio..." />
                      </SelectTrigger>
                      <SelectContent>
                        {servicios.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.nombre} · ${Number(s.precio).toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <Button type="button" variant="outline" size="sm" onClick={agregarItem}>
                    <Plus />
                    Línea libre
                  </Button>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {items.map((item, indice) => (
                  <div key={indice} className="grid grid-cols-[minmax(0,1fr)_4.5rem_6.5rem_auto] items-end gap-2">
                    <div className="flex min-w-0 flex-col gap-1">
                      {indice === 0 && <span className="text-xs text-muted-foreground">Descripción</span>}
                      <Input
                        required
                        aria-label="Descripción"
                        value={item.descripcion}
                        onChange={(e) => actualizarItem(indice, 'descripcion', e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      {indice === 0 && <span className="text-xs text-muted-foreground">Cant.</span>}
                      <Input
                        type="number"
                        min={1}
                        required
                        aria-label="Cantidad"
                        value={item.cantidad}
                        onChange={(e) => actualizarItem(indice, 'cantidad', e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      {indice === 0 && <span className="text-xs text-muted-foreground">Precio</span>}
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        required
                        aria-label="Precio unitario"
                        value={item.precioUnitario}
                        onChange={(e) => actualizarItem(indice, 'precioUnitario', e.target.value)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Quitar línea"
                      disabled={items.length === 1}
                      onClick={() => quitarItem(indice)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ))}
              </div>
              {servicios.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Tip: cargá tus servicios y tarifas en Configuración para llenar la factura con un clic.
                </p>
              )}
            </div>

            <div className="flex flex-col items-end gap-1 rounded-md bg-carton/60 p-3 text-sm [font-variant-numeric:tabular-nums]">
              <div className="flex w-52 justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex w-52 justify-between">
                <span className="text-muted-foreground">IVA (13%)</span>
                <span>${iva.toFixed(2)}</span>
              </div>
              <div className="flex w-52 justify-between border-t pt-1 text-base font-semibold text-tinta">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <DialogFooter className="items-center sm:justify-between">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" className="size-4 accent-primary" checked={imprimir} onChange={(e) => setImprimir(e.target.checked)} />
              Imprimir al crear
            </label>
            <Button type="submit" disabled={enviando || !pacienteId}>
              {enviando ? 'Creando...' : 'Crear factura'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

import { useEffect, useState, type FormEvent } from 'react'
import { apiFetch, ApiRequestError } from '@/lib/api'
import type { PacienteResponse, PlanResponse, SuscripcionResponse } from '@/types'
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
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'

interface ItemFormulario {
  descripcion: string
  cantidad: string
  precioUnitario: string
}

const ITEM_VACIO: ItemFormulario = { descripcion: '', cantidad: '1', precioUnitario: '' }

interface FacturaFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGuardado: () => void
}

export function FacturaFormDialog({ open, onOpenChange, onGuardado }: FacturaFormDialogProps) {
  const [pacientes, setPacientes] = useState<PacienteResponse[]>([])
  const [pacienteId, setPacienteId] = useState('')
  const [tipoDte, setTipoDte] = useState<'SIMPLE' | 'FE'>('SIMPLE')
  const [permiteFe, setPermiteFe] = useState(false)
  const [items, setItems] = useState<ItemFormulario[]>([{ ...ITEM_VACIO }])
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!open) return
    setPacienteId('')
    setTipoDte('SIMPLE')
    setItems([{ ...ITEM_VACIO }])

    apiFetch<PacienteResponse[]>('/api/v1/pacientes')
      .then(setPacientes)
      .catch(() => {})

    Promise.all([
      apiFetch<SuscripcionResponse>('/api/v1/suscripciones/actual'),
      apiFetch<PlanResponse[]>('/api/v1/planes', { auth: false }),
    ])
      .then(([suscripcion, planes]) => {
        const plan = planes.find((p) => p.codigo === suscripcion.planCodigo)
        setPermiteFe(Boolean(plan?.incluyeFacturacionElectronica))
      })
      .catch(() => setPermiteFe(false))
  }, [open])

  function actualizarItem(indice: number, campo: keyof ItemFormulario, valor: string) {
    setItems((anteriores) => anteriores.map((item, i) => (i === indice ? { ...item, [campo]: valor } : item)))
  }

  function agregarItem() {
    setItems((anteriores) => [...anteriores, { ...ITEM_VACIO }])
  }

  function quitarItem(indice: number) {
    setItems((anteriores) => anteriores.filter((_, i) => i !== indice))
  }

  const subtotal = items.reduce(
    (acumulado, item) => acumulado + (Number(item.cantidad) || 0) * (Number(item.precioUnitario) || 0),
    0,
  )
  const iva = subtotal * 0.13
  const total = subtotal + iva

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setEnviando(true)
    try {
      await apiFetch('/api/v1/facturas', {
        method: 'POST',
        body: {
          pacienteId,
          tipoDte,
          items: items.map((item) => ({
            descripcion: item.descripcion,
            cantidad: Number(item.cantidad),
            precioUnitario: Number(item.precioUnitario),
          })),
        },
      })
      toast.success('Factura creada')
      onGuardado()
    } catch (err) {
      if (err instanceof ApiRequestError) {
        toast.error(err.body?.message ?? 'No se pudo crear la factura')
      } else {
        toast.error('No se pudo conectar con el servidor')
      }
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
            <DialogDescription>El IVA (13%) se calcula automaticamente sobre el subtotal.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="paciente">Paciente</Label>
                <Select value={pacienteId} onValueChange={setPacienteId}>
                  <SelectTrigger id="paciente" className="w-full">
                    <SelectValue placeholder="Selecciona un paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {pacientes.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="tipoDte">Tipo</Label>
                <Select value={tipoDte} onValueChange={(v) => setTipoDte(v as 'SIMPLE' | 'FE')}>
                  <SelectTrigger id="tipoDte" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SIMPLE">Simple (interna)</SelectItem>
                    <SelectItem value="FE" disabled={!permiteFe}>
                      Factura Electronica (DTE)
                    </SelectItem>
                  </SelectContent>
                </Select>
                {!permiteFe && (
                  <p className="text-xs text-muted-foreground">
                    Tu plan actual no incluye facturacion electronica.
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label>Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={agregarItem}>
                  <Plus />
                  Agregar item
                </Button>
              </div>
              <div className="flex flex-col gap-2">
                {items.map((item, indice) => (
                  <div key={indice} className="flex items-end gap-2">
                    <div className="flex flex-1 flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">Descripcion</Label>
                      <Input
                        required
                        value={item.descripcion}
                        onChange={(e) => actualizarItem(indice, 'descripcion', e.target.value)}
                      />
                    </div>
                    <div className="flex w-20 flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">Cant.</Label>
                      <Input
                        type="number"
                        min={1}
                        required
                        value={item.cantidad}
                        onChange={(e) => actualizarItem(indice, 'cantidad', e.target.value)}
                      />
                    </div>
                    <div className="flex w-28 flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">Precio</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        required
                        value={item.precioUnitario}
                        onChange={(e) => actualizarItem(indice, 'precioUnitario', e.target.value)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={items.length === 1}
                      onClick={() => quitarItem(indice)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 rounded-md border p-3 text-sm">
              <div className="flex w-48 justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex w-48 justify-between">
                <span className="text-muted-foreground">IVA (13%)</span>
                <span>${iva.toFixed(2)}</span>
              </div>
              <div className="flex w-48 justify-between font-medium">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={enviando || !pacienteId}>
              {enviando ? 'Creando...' : 'Crear factura'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

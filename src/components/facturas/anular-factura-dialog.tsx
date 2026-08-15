import { useEffect, useState, type FormEvent } from 'react'
import { apiFetch, ApiRequestError } from '@/lib/api'
import type { FacturaResponse } from '@/types'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface AnularFacturaDialogProps {
  factura: FacturaResponse | null
  onOpenChange: (open: boolean) => void
  onAnulada: () => void
}

export function AnularFacturaDialog({ factura, onOpenChange, onAnulada }: AnularFacturaDialogProps) {
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    setMotivo('')
  }, [factura])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!factura) return
    setEnviando(true)
    try {
      await apiFetch('/api/v1/notas-credito', {
        method: 'POST',
        body: { facturaId: factura.id, motivo },
      })
      toast.success('Factura anulada')
      onAnulada()
    } catch (err) {
      if (err instanceof ApiRequestError) {
        toast.error(err.body?.message ?? 'No se pudo anular la factura')
      } else {
        toast.error('No se pudo conectar con el servidor')
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Dialog open={factura !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Anular factura</DialogTitle>
            <DialogDescription>
              Se generara una nota de credito por el monto total (${factura?.total.toFixed(2)}). Esta accion
              no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-4">
            <Label htmlFor="motivo">Motivo</Label>
            <Textarea
              id="motivo"
              required
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" variant="destructive" disabled={enviando}>
              {enviando ? 'Anulando...' : 'Anular factura'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

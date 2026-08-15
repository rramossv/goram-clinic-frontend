import { useEffect, useState } from 'react'
import { apiFetch, ApiRequestError } from '@/lib/api'
import type { FacturaResponse } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FacturaFormDialog } from '@/components/facturas/factura-form-dialog'
import { AnularFacturaDialog } from '@/components/facturas/anular-factura-dialog'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'

const VARIANTE_ESTADO: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PENDIENTE: 'outline',
  EMITIDA: 'default',
  RECHAZADA: 'destructive',
  ANULADA: 'secondary',
}

export function FacturasPage() {
  const [facturas, setFacturas] = useState<FacturaResponse[]>([])
  const [cargando, setCargando] = useState(true)
  const [dialogAbierto, setDialogAbierto] = useState(false)
  const [facturaAnular, setFacturaAnular] = useState<FacturaResponse | null>(null)
  const [emitiendo, setEmitiendo] = useState<string | null>(null)

  async function cargar() {
    setCargando(true)
    try {
      const data = await apiFetch<FacturaResponse[]>('/api/v1/facturas')
      setFacturas(data)
    } catch {
      toast.error('No se pudieron cargar las facturas')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  async function emitirDte(facturaId: string) {
    setEmitiendo(facturaId)
    try {
      await apiFetch(`/api/v1/facturas/${facturaId}/dte/emitir`, { method: 'POST' })
      toast.success('DTE emitido')
      cargar()
    } catch (err) {
      if (err instanceof ApiRequestError) {
        toast.error(err.body?.message ?? 'No se pudo emitir el DTE')
      } else {
        toast.error('No se pudo conectar con el servidor')
      }
    } finally {
      setEmitiendo(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Facturacion</h1>
        <Button onClick={() => setDialogAbierto(true)}>
          <Plus />
          Nueva factura
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!cargando && facturas.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Todavia no hay facturas.
                </TableCell>
              </TableRow>
            )}
            {facturas.map((factura) => (
              <TableRow key={factura.id}>
                <TableCell>{new Date(factura.creadoEn).toLocaleDateString('es-SV')}</TableCell>
                <TableCell className="font-medium">{factura.pacienteNombre}</TableCell>
                <TableCell>{factura.tipoDte === 'FE' ? 'Electronica' : 'Simple'}</TableCell>
                <TableCell>${factura.total.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={VARIANTE_ESTADO[factura.estado] ?? 'outline'}>{factura.estado}</Badge>
                </TableCell>
                <TableCell className="space-x-2 text-right">
                  {factura.tipoDte === 'FE' && factura.estado === 'PENDIENTE' && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={emitiendo === factura.id}
                      onClick={() => emitirDte(factura.id)}
                    >
                      {emitiendo === factura.id ? 'Emitiendo...' : 'Emitir DTE'}
                    </Button>
                  )}
                  {factura.estado === 'EMITIDA' && (
                    <Button size="sm" variant="ghost" onClick={() => setFacturaAnular(factura)}>
                      Anular
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <FacturaFormDialog
        open={dialogAbierto}
        onOpenChange={setDialogAbierto}
        onGuardado={() => {
          setDialogAbierto(false)
          cargar()
        }}
      />

      <AnularFacturaDialog
        factura={facturaAnular}
        onOpenChange={(open) => !open && setFacturaAnular(null)}
        onAnulada={() => {
          setFacturaAnular(null)
          cargar()
        }}
      />
    </div>
  )
}

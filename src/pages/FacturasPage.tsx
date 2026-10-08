import { useEffect, useMemo, useState } from 'react'
import { apiFetch, ApiRequestError } from '@/lib/api'
import type { FacturaResponse } from '@/types'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/page-header'
import { CodigoPaciente } from '@/components/codigo-paciente'
import { EstadoChip } from '@/components/estado-chip'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FacturaFormDialog } from '@/components/facturas/factura-form-dialog'
import { AnularFacturaDialog } from '@/components/facturas/anular-factura-dialog'
import { PaginationControls } from '@/components/pagination-controls'
import { toast } from 'sonner'
import { Plus, Search } from 'lucide-react'

const TAMANO_PAGINA = 10

export function FacturasPage() {
  const [facturas, setFacturas] = useState<FacturaResponse[]>([])
  const [cargando, setCargando] = useState(true)
  const [dialogAbierto, setDialogAbierto] = useState(false)
  const [facturaAnular, setFacturaAnular] = useState<FacturaResponse | null>(null)
  const [emitiendo, setEmitiendo] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)

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

  const filtradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase()
    if (!termino) return facturas
    return facturas.filter((f) => f.pacienteNombre.toLowerCase().includes(termino))
  }, [facturas, busqueda])

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / TAMANO_PAGINA))
  const paginaActual = Math.min(pagina, totalPaginas)
  const visibles = filtradas.slice((paginaActual - 1) * TAMANO_PAGINA, paginaActual * TAMANO_PAGINA)

  function alBuscar(valor: string) {
    setBusqueda(valor)
    setPagina(1)
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        titulo="Facturación"
        descripcion="Facturas internas y documentos tributarios electrónicos (DTE)."
        acciones={
          <Button onClick={() => setDialogAbierto(true)}>
            <Plus />
            Nueva factura
          </Button>
        }
      />

      <div className="relative w-full max-w-sm">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por paciente..."
          className="pl-9"
          value={busqueda}
          onChange={(e) => alBuscar(e.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!cargando && visibles.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  {busqueda ? 'Ninguna factura coincide con la búsqueda.' : 'Todavía no hay facturas.'}
                </TableCell>
              </TableRow>
            )}
            {visibles.map((factura) => (
              <TableRow key={factura.id}>
                <TableCell>{new Date(factura.creadoEn).toLocaleDateString('es-SV')}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <CodigoPaciente id={factura.pacienteId} />
                    <span className="font-medium text-tinta">{factura.pacienteNombre}</span>
                  </div>
                </TableCell>
                <TableCell>{factura.tipoDte === 'FE' ? 'Electrónica' : 'Simple'}</TableCell>
                <TableCell className="text-right font-semibold text-tinta">${factura.total.toFixed(2)}</TableCell>
                <TableCell>
                  <EstadoChip estado={factura.estado} />
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

      <PaginationControls
        pagina={paginaActual}
        totalPaginas={totalPaginas}
        totalItems={filtradas.length}
        tamanoPagina={TAMANO_PAGINA}
        onCambiarPagina={setPagina}
      />

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

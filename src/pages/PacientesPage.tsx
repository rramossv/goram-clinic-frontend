import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '@/lib/api'
import type { PacienteResponse } from '@/types'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/page-header'
import { CodigoPaciente } from '@/components/codigo-paciente'
import { EstadoChip } from '@/components/estado-chip'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PacienteFormDialog } from '@/components/pacientes/paciente-form-dialog'
import { PaginationControls } from '@/components/pagination-controls'
import { toast } from 'sonner'
import { Plus, ChevronRight, Search } from 'lucide-react'

const TAMANO_PAGINA = 10

export function PacientesPage() {
  const navigate = useNavigate()
  const [pacientes, setPacientes] = useState<PacienteResponse[]>([])
  const [cargando, setCargando] = useState(true)
  const [dialogAbierto, setDialogAbierto] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)

  async function cargar() {
    setCargando(true)
    try {
      const data = await apiFetch<PacienteResponse[]>('/api/v1/pacientes')
      setPacientes(data)
    } catch {
      toast.error('No se pudieron cargar los pacientes')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  const filtrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase()
    if (!termino) return pacientes
    return pacientes.filter(
      (p) =>
        p.nombre.toLowerCase().includes(termino) ||
        (p.documentoIdentidad ?? '').toLowerCase().includes(termino) ||
        (p.telefono ?? '').toLowerCase().includes(termino) ||
        (p.email ?? '').toLowerCase().includes(termino),
    )
  }, [pacientes, busqueda])

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / TAMANO_PAGINA))
  const paginaActual = Math.min(pagina, totalPaginas)
  const visibles = filtrados.slice((paginaActual - 1) * TAMANO_PAGINA, paginaActual * TAMANO_PAGINA)

  function alBuscar(valor: string) {
    setBusqueda(valor)
    setPagina(1)
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        titulo="Pacientes"
        descripcion={cargando ? 'Cargando expedientes...' : `${pacientes.filter((p) => p.activo).length} expedientes activos`}
        acciones={
          <Button onClick={() => setDialogAbierto(true)}>
            <Plus />
            Nuevo paciente
          </Button>
        }
      />

      <div className="relative w-full max-w-sm">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, documento, teléfono o email..."
          className="pl-9"
          value={busqueda}
          onChange={(e) => alBuscar(e.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {!cargando && visibles.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  {busqueda ? 'Ningún paciente coincide con la búsqueda.' : 'Todavía no hay pacientes registrados.'}
                </TableCell>
              </TableRow>
            )}
            {visibles.map((paciente) => (
              <TableRow
                key={paciente.id}
                className="cursor-pointer"
                onClick={() => navigate(`/pacientes/${paciente.id}`)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <CodigoPaciente id={paciente.id} />
                    <span className="font-medium text-tinta">{paciente.nombre}</span>
                  </div>
                </TableCell>
                <TableCell>{paciente.documentoIdentidad ?? '-'}</TableCell>
                <TableCell>{paciente.telefono ?? '-'}</TableCell>
                <TableCell>{paciente.email ?? '-'}</TableCell>
                <TableCell>
                  <EstadoChip estado={paciente.activo ? 'ACTIVO' : 'INACTIVO'} />
                </TableCell>
                <TableCell className="w-8 text-muted-foreground">
                  <ChevronRight className="size-4" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PaginationControls
        pagina={paginaActual}
        totalPaginas={totalPaginas}
        totalItems={filtrados.length}
        tamanoPagina={TAMANO_PAGINA}
        onCambiarPagina={setPagina}
      />

      <PacienteFormDialog
        open={dialogAbierto}
        onOpenChange={setDialogAbierto}
        paciente={null}
        onGuardado={() => {
          setDialogAbierto(false)
          cargar()
        }}
      />
    </div>
  )
}

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import type { PacienteResponse } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PacienteFormDialog } from '@/components/pacientes/paciente-form-dialog'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'

export function PacientesPage() {
  const [pacientes, setPacientes] = useState<PacienteResponse[]>([])
  const [cargando, setCargando] = useState(true)
  const [dialogAbierto, setDialogAbierto] = useState(false)
  const [pacienteEditando, setPacienteEditando] = useState<PacienteResponse | null>(null)

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

  function abrirNuevo() {
    setPacienteEditando(null)
    setDialogAbierto(true)
  }

  function abrirEditar(paciente: PacienteResponse) {
    setPacienteEditando(paciente)
    setDialogAbierto(true)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Pacientes</h1>
        <Button onClick={abrirNuevo}>
          <Plus />
          Nuevo paciente
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Telefono</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!cargando && pacientes.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Todavia no hay pacientes registrados.
                </TableCell>
              </TableRow>
            )}
            {pacientes.map((paciente) => (
              <TableRow key={paciente.id}>
                <TableCell className="font-medium">{paciente.nombre}</TableCell>
                <TableCell>{paciente.documentoIdentidad ?? '-'}</TableCell>
                <TableCell>{paciente.telefono ?? '-'}</TableCell>
                <TableCell>{paciente.email ?? '-'}</TableCell>
                <TableCell>
                  <Badge variant={paciente.activo ? 'default' : 'secondary'}>
                    {paciente.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => abrirEditar(paciente)}>
                    Editar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PacienteFormDialog
        open={dialogAbierto}
        onOpenChange={setDialogAbierto}
        paciente={pacienteEditando}
        onGuardado={() => {
          setDialogAbierto(false)
          cargar()
        }}
      />
    </div>
  )
}

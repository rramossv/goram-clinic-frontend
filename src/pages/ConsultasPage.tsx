import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import type { CitaResponse } from '@/types'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/page-header'
import { CodigoPaciente } from '@/components/codigo-paciente'
import { EstadoChip } from '@/components/estado-chip'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ConsultaDialog } from '@/components/consultas/consulta-dialog'
import { toast } from 'sonner'

export function ConsultasPage() {
  const [citas, setCitas] = useState<CitaResponse[]>([])
  const [cargando, setCargando] = useState(true)
  const [citaSeleccionada, setCitaSeleccionada] = useState<CitaResponse | null>(null)
  const [dialogAbierto, setDialogAbierto] = useState(false)

  useEffect(() => {
    apiFetch<CitaResponse[]>('/api/v1/citas')
      .then(setCitas)
      .catch(() => toast.error('No se pudieron cargar las citas'))
      .finally(() => setCargando(false))
  }, [])

  function abrirConsulta(cita: CitaResponse) {
    setCitaSeleccionada(cita)
    setDialogAbierto(true)
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        titulo="Consultas"
        descripcion="Selecciona una cita para ver o registrar su consulta clínica."
      />

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha y hora</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Doctor</TableHead>
              <TableHead>Estado de la cita</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!cargando && citas.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Todavía no hay citas para documentar.
                </TableCell>
              </TableRow>
            )}
            {citas.map((cita) => (
              <TableRow key={cita.id}>
                <TableCell>
                  {new Date(cita.fechaHora).toLocaleString('es-SV', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <CodigoPaciente id={cita.pacienteId} />
                    <span className="font-medium text-tinta">{cita.pacienteNombre}</span>
                  </div>
                </TableCell>
                <TableCell>{cita.doctorNombre}</TableCell>
                <TableCell>
                  <EstadoChip estado={cita.estado} />
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => abrirConsulta(cita)}>
                    Ver / registrar consulta
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ConsultaDialog
        open={dialogAbierto}
        onOpenChange={setDialogAbierto}
        cita={citaSeleccionada}
        onGuardada={() => apiFetch<CitaResponse[]>('/api/v1/citas').then(setCitas).catch(() => {})}
      />
    </div>
  )
}

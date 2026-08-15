import { useEffect, useState } from 'react'
import { apiFetch, ApiRequestError } from '@/lib/api'
import type { CitaResponse } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CitaFormDialog } from '@/components/agenda/cita-form-dialog'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'

const ESTADOS = ['PROGRAMADA', 'CONFIRMADA', 'COMPLETADA', 'CANCELADA', 'NO_ASISTIO']

const VARIANTE_ESTADO: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PROGRAMADA: 'outline',
  CONFIRMADA: 'default',
  COMPLETADA: 'secondary',
  CANCELADA: 'destructive',
  NO_ASISTIO: 'destructive',
}

export function AgendaPage() {
  const [citas, setCitas] = useState<CitaResponse[]>([])
  const [cargando, setCargando] = useState(true)
  const [dialogAbierto, setDialogAbierto] = useState(false)

  async function cargar() {
    setCargando(true)
    try {
      const data = await apiFetch<CitaResponse[]>('/api/v1/citas')
      setCitas(data)
    } catch {
      toast.error('No se pudieron cargar las citas')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  async function cambiarEstado(citaId: string, estado: string) {
    try {
      await apiFetch(`/api/v1/citas/${citaId}/estado`, { method: 'PATCH', body: { estado } })
      toast.success('Estado actualizado')
      cargar()
    } catch (err) {
      if (err instanceof ApiRequestError) {
        toast.error(err.body?.message ?? 'No se pudo cambiar el estado')
      } else {
        toast.error('No se pudo conectar con el servidor')
      }
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Agenda</h1>
        <Button onClick={() => setDialogAbierto(true)}>
          <Plus />
          Nueva cita
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha y hora</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Doctor</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!cargando && citas.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Todavia no hay citas agendadas.
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
                <TableCell className="font-medium">{cita.pacienteNombre}</TableCell>
                <TableCell>{cita.doctorNombre}</TableCell>
                <TableCell className="max-w-48 truncate">{cita.motivo ?? '-'}</TableCell>
                <TableCell>
                  <Select value={cita.estado} onValueChange={(valor) => cambiarEstado(cita.id, valor)}>
                    <SelectTrigger className="w-40">
                      <SelectValue>
                        <Badge variant={VARIANTE_ESTADO[cita.estado] ?? 'outline'}>{cita.estado}</Badge>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS.map((estado) => (
                        <SelectItem key={estado} value={estado}>
                          {estado}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <CitaFormDialog
        open={dialogAbierto}
        onOpenChange={setDialogAbierto}
        onGuardado={() => {
          setDialogAbierto(false)
          cargar()
        }}
      />
    </div>
  )
}

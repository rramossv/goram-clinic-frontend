import { useState } from 'react'
import { apiFetch, ApiRequestError } from '@/lib/api'
import type { CitaResponse } from '@/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ConsultaDialog } from '@/components/consultas/consulta-dialog'
import { toast } from 'sonner'

const ESTADOS = ['PROGRAMADA', 'CONFIRMADA', 'COMPLETADA', 'CANCELADA', 'NO_ASISTIO']

interface CitaDetailDialogProps {
  cita: CitaResponse | null
  onOpenChange: (open: boolean) => void
  onActualizada: () => void
}

export function CitaDetailDialog({ cita, onOpenChange, onActualizada }: CitaDetailDialogProps) {
  const [consultaAbierta, setConsultaAbierta] = useState(false)
  const [citaParaConsulta, setCitaParaConsulta] = useState<CitaResponse | null>(null)
  const [actualizando, setActualizando] = useState(false)

  async function cambiarEstado(estado: string) {
    if (!cita) return
    setActualizando(true)
    try {
      await apiFetch(`/api/v1/citas/${cita.id}/estado`, { method: 'PATCH', body: { estado } })
      toast.success('Estado actualizado')
      onActualizada()
    } catch (err) {
      if (err instanceof ApiRequestError) {
        toast.error(err.body?.message ?? 'No se pudo cambiar el estado')
      } else {
        toast.error('No se pudo conectar con el servidor')
      }
    } finally {
      setActualizando(false)
    }
  }

  function abrirConsulta() {
    if (!cita) return
    setCitaParaConsulta(cita)
    onOpenChange(false)
    setConsultaAbierta(true)
  }

  return (
    <>
      <Dialog open={cita !== null} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{cita?.pacienteNombre}</DialogTitle>
            <DialogDescription>
              {cita &&
                new Date(cita.fechaHora).toLocaleString('es-SV', { dateStyle: 'full', timeStyle: 'short' })}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Doctor</span>
              <span>{cita?.doctorNombre}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duracion</span>
              <span>{cita?.duracionMinutos} min</span>
            </div>
            {cita?.motivo && (
              <div>
                <p className="text-muted-foreground">Motivo</p>
                <p>{cita.motivo}</p>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Estado</span>
              <Select value={cita?.estado} onValueChange={cambiarEstado} disabled={actualizando}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS.map((estado) => (
                    <SelectItem key={estado} value={estado}>
                      {estado}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={abrirConsulta}>
              Ver / registrar consulta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConsultaDialog open={consultaAbierta} onOpenChange={setConsultaAbierta} cita={citaParaConsulta} />
    </>
  )
}

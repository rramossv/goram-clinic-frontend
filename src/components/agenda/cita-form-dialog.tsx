import { useEffect, useState, type FormEvent } from 'react'
import { apiFetch, ApiRequestError } from '@/lib/api'
import type { PacienteResponse, UsuarioResumen } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

function aDatetimeLocal(fecha: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}T${pad(fecha.getHours())}:${pad(fecha.getMinutes())}`
}

interface CitaFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGuardado: () => void
  /** Pre-llena doctor y horario cuando se abre desde un clic en el calendario. */
  prefill?: { doctorId: string; fechaHora: Date } | null
}

export function CitaFormDialog({ open, onOpenChange, onGuardado, prefill }: CitaFormDialogProps) {
  const [pacientes, setPacientes] = useState<PacienteResponse[]>([])
  const [doctores, setDoctores] = useState<UsuarioResumen[]>([])
  const [pacienteId, setPacienteId] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [fechaHora, setFechaHora] = useState('')
  const [duracionMinutos, setDuracionMinutos] = useState('30')
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (open) {
      setPacienteId('')
      setDoctorId(prefill?.doctorId ?? '')
      setFechaHora(prefill ? aDatetimeLocal(prefill.fechaHora) : '')
      setDuracionMinutos('30')
      setMotivo('')

      apiFetch<PacienteResponse[]>('/api/v1/pacientes')
        .then(setPacientes)
        .catch(() => {})
      apiFetch<UsuarioResumen[]>('/api/v1/usuarios')
        .then((usuarios) => setDoctores(usuarios.filter((u) => u.rol === 'DOCTOR')))
        .catch(() => {})
    }
  }, [open, prefill])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setEnviando(true)
    try {
      await apiFetch('/api/v1/citas', {
        method: 'POST',
        body: {
          pacienteId,
          doctorId,
          fechaHora: new Date(fechaHora).toISOString(),
          duracionMinutos: Number(duracionMinutos),
          motivo: motivo || null,
        },
      })
      toast.success('Cita agendada')
      onGuardado()
    } catch (err) {
      if (err instanceof ApiRequestError) {
        toast.error(err.body?.message ?? 'No se pudo agendar la cita')
      } else {
        toast.error('No se pudo conectar con el servidor')
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Nueva cita</DialogTitle>
            <DialogDescription>Agenda una cita para un paciente.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
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
              <Label htmlFor="doctor">Doctor</Label>
              <Select value={doctorId} onValueChange={setDoctorId}>
                <SelectTrigger id="doctor" className="w-full">
                  <SelectValue placeholder="Selecciona un doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctores.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {doctores.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No hay doctores registrados. Agrega uno en la seccion Personal.
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="fechaHora">Fecha y hora</Label>
              <Input
                id="fechaHora"
                type="datetime-local"
                required
                value={fechaHora}
                onChange={(e) => setFechaHora(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="duracion">Duracion (minutos)</Label>
              <Input
                id="duracion"
                type="number"
                min={5}
                max={480}
                required
                value={duracionMinutos}
                onChange={(e) => setDuracionMinutos(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="motivo">Motivo</Label>
              <Textarea id="motivo" rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={enviando || !pacienteId || !doctorId}>
              {enviando ? 'Agendando...' : 'Agendar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

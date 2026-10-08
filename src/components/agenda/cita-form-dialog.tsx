import { useEffect, useState, type FormEvent } from 'react'
import { apiFetch, ApiRequestError } from '@/lib/api'
import { atiendePacientes, type CitaResponse, type UsuarioResumen } from '@/types'
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
import { PacienteSelector } from '@/components/pacientes/paciente-selector'
import { toast } from 'sonner'

function aDatetimeLocal(fecha: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}T${pad(fecha.getHours())}:${pad(fecha.getMinutes())}`
}

const DURACIONES = ['15', '20', '30', '45', '60', '90']

interface CitaFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGuardado: () => void
  /** Pre-llena doctor y horario cuando se abre desde un clic en el calendario. */
  prefill?: { doctorId?: string; fechaHora?: Date; pacienteId?: string } | null
  /** Cita a reprogramar; si viene, el formulario edita en vez de crear. */
  cita?: CitaResponse | null
}

export function CitaFormDialog({ open, onOpenChange, onGuardado, prefill, cita }: CitaFormDialogProps) {
  // null mientras carga: el Select de Radix vacia su valor si se monta sin
  // opciones, asi que no se renderiza hasta tener la lista.
  const [doctores, setDoctores] = useState<UsuarioResumen[] | null>(null)
  const [pacienteId, setPacienteId] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [fechaHora, setFechaHora] = useState('')
  const [duracionMinutos, setDuracionMinutos] = useState('30')
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const editando = Boolean(cita)

  useEffect(() => {
    if (!open) return
    setPacienteId(cita?.pacienteId ?? prefill?.pacienteId ?? '')
    setDoctorId(cita?.doctorId ?? prefill?.doctorId ?? '')
    const fecha = cita ? new Date(cita.fechaHora) : prefill?.fechaHora
    setFechaHora(fecha ? aDatetimeLocal(fecha) : '')
    setDuracionMinutos(String(cita?.duracionMinutos ?? 30))
    setMotivo(cita?.motivo ?? '')
    setDoctores(null)

    apiFetch<UsuarioResumen[]>('/api/v1/usuarios')
      .then((usuarios) => {
        const lista = usuarios.filter((u) => u.activo && atiendePacientes(u))
        setDoctores(lista)
        // Con un solo medico (consultorio individual) no hay nada que elegir.
        if (lista.length === 1 && !cita && !prefill?.doctorId) setDoctorId(lista[0].id)
      })
      .catch(() => {})
  }, [open, prefill, cita])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const inicio = new Date(fechaHora)
    if (inicio.getTime() <= Date.now()) {
      toast.error('Elegí una fecha y hora que todavía no haya pasado')
      return
    }
    setEnviando(true)
    try {
      const body = {
        pacienteId,
        doctorId,
        fechaHora: inicio.toISOString(),
        duracionMinutos: Number(duracionMinutos),
        motivo: motivo.trim() || null,
      }
      if (cita) {
        await apiFetch(`/api/v1/citas/${cita.id}`, { method: 'PUT', body })
        toast.success('Cita reprogramada')
      } else {
        await apiFetch('/api/v1/citas', { method: 'POST', body })
        toast.success('Cita agendada')
      }
      onGuardado()
    } catch (err) {
      if (err instanceof ApiRequestError) {
        toast.error(err.body?.message ?? 'No se pudo guardar la cita')
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
            <DialogTitle>{editando ? 'Reprogramar cita' : 'Nueva cita'}</DialogTitle>
            <DialogDescription>
              {editando
                ? 'Cambiá la fecha, la hora o los detalles. El recordatorio se vuelve a enviar.'
                : 'Buscá al paciente o registralo si es su primera visita.'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="paciente">Paciente</Label>
              <PacienteSelector id="paciente" value={pacienteId} onChange={setPacienteId} />
            </div>
            {/* Con un solo medico (consultorio individual) no se muestra: la cita es suya. */}
            {doctores && doctores.length !== 1 && (
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
                    No hay doctores registrados. Agrega uno en la sección Personal.
                  </p>
                )}
              </div>
            )}
            <div className="grid grid-cols-[minmax(0,1fr)_7.5rem] gap-3">
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
                <Label htmlFor="duracion">Duración</Label>
                <Select value={duracionMinutos} onValueChange={setDuracionMinutos}>
                  <SelectTrigger id="duracion" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(DURACIONES.includes(duracionMinutos) ? DURACIONES : [...DURACIONES, duracionMinutos]).map((d) => (
                      <SelectItem key={d} value={d}>
                        {d} min
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="motivo">Motivo</Label>
              <Textarea
                id="motivo"
                rows={2}
                placeholder="Ej. control de presión, primera consulta..."
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={enviando || !pacienteId || !doctorId || !fechaHora}>
              {enviando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Agendar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

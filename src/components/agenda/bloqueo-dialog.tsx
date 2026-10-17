import { useEffect, useState, type FormEvent } from 'react'
import { apiFetch, ApiRequestError } from '@/lib/api'
import type { UsuarioResumen } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

const hoyIso = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  doctores: UsuarioResumen[]
  doctorInicial?: string
  onGuardado: () => void
}

/** Vacaciones, congresos, cirugias: tiempo en que no se pueden agendar citas. */
export function BloqueoDialog({ open, onOpenChange, doctores, doctorInicial, onGuardado }: Props) {
  const [doctorId, setDoctorId] = useState('')
  const [diasCompletos, setDiasCompletos] = useState(true)
  const [desdeFecha, setDesdeFecha] = useState(hoyIso())
  const [hastaFecha, setHastaFecha] = useState(hoyIso())
  const [desdeHora, setDesdeHora] = useState('08:00')
  const [hastaHora, setHastaHora] = useState('12:00')
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!open) return
    setDoctorId(doctorInicial ?? doctores[0]?.id ?? '')
    setDiasCompletos(true)
    setDesdeFecha(hoyIso())
    setHastaFecha(hoyIso())
    setMotivo('')
  }, [open, doctorInicial, doctores])

  async function guardar(e: FormEvent) {
    e.preventDefault()
    const desde = new Date(`${desdeFecha}T${diasCompletos ? '00:00' : desdeHora}:00`)
    const hasta = diasCompletos ? new Date(`${hastaFecha}T00:00:00`) : new Date(`${diasCompletos ? hastaFecha : desdeFecha}T${hastaHora}:00`)
    if (diasCompletos) hasta.setDate(hasta.getDate() + 1)
    if (hasta <= desde) {
      toast.error('El final tiene que ser después del inicio')
      return
    }
    setEnviando(true)
    try {
      await apiFetch('/api/v1/bloqueos', { method: 'POST', body: { doctorId, desde: desde.toISOString(), hasta: hasta.toISOString(), motivo: motivo.trim() || null } })
      toast.success('Tiempo bloqueado; no se podrán agendar citas en ese rango')
      onGuardado()
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? (err.body?.message ?? 'No se pudo bloquear') : 'No se pudo conectar con el servidor')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={guardar}>
          <DialogHeader>
            <DialogTitle>Bloquear tiempo en la agenda</DialogTitle>
            <DialogDescription>Vacaciones, congresos o compromisos: nadie podrá agendar citas en ese rango.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            {doctores.length > 1 && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="bloqueo-doctor">Médico</Label>
                <Select value={doctorId} onValueChange={setDoctorId}>
                  <SelectTrigger id="bloqueo-doctor" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {doctores.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="inline-flex self-start rounded-md bg-carton p-0.5" role="group">
              {[
                [true, 'Días completos'],
                [false, 'Unas horas'],
              ].map(([valor, etiqueta]) => (
                <button
                  key={String(valor)}
                  type="button"
                  onClick={() => setDiasCompletos(valor as boolean)}
                  className={`rounded px-3 py-1.5 text-sm font-medium ${diasCompletos === valor ? 'bg-background text-tinta shadow-sm' : 'text-carton-foreground'}`}
                >
                  {etiqueta as string}
                </button>
              ))}
            </div>
            {diasCompletos ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="bloqueo-desde">Desde</Label>
                  <Input id="bloqueo-desde" type="date" required value={desdeFecha} onChange={(e) => setDesdeFecha(e.target.value)} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="bloqueo-hasta">Hasta (inclusive)</Label>
                  <Input id="bloqueo-hasta" type="date" required min={desdeFecha} value={hastaFecha} onChange={(e) => setHastaFecha(e.target.value)} />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="bloqueo-dia">Día</Label>
                  <Input id="bloqueo-dia" type="date" required value={desdeFecha} onChange={(e) => setDesdeFecha(e.target.value)} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="bloqueo-hi">De</Label>
                  <Input id="bloqueo-hi" type="time" required value={desdeHora} onChange={(e) => setDesdeHora(e.target.value)} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="bloqueo-hf">A</Label>
                  <Input id="bloqueo-hf" type="time" required value={hastaHora} onChange={(e) => setHastaHora(e.target.value)} />
                </div>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="bloqueo-motivo">Motivo (opcional)</Label>
              <Input id="bloqueo-motivo" maxLength={200} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej. Vacaciones, congreso, cirugía" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={enviando || !doctorId}>
              {enviando ? 'Guardando…' : 'Bloquear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

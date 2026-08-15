import { useEffect, useState, type FormEvent } from 'react'
import { apiFetch, ApiRequestError } from '@/lib/api'
import type { CitaResponse, ConsultaResponse } from '@/types'
import { Button } from '@/components/ui/button'
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
import { toast } from 'sonner'

interface ConsultaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cita: CitaResponse | null
}

export function ConsultaDialog({ open, onOpenChange, cita }: ConsultaDialogProps) {
  const [cargando, setCargando] = useState(true)
  const [consulta, setConsulta] = useState<ConsultaResponse | null>(null)
  const [notas, setNotas] = useState('')
  const [diagnostico, setDiagnostico] = useState('')
  const [receta, setReceta] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!open || !cita) return
    setCargando(true)
    setConsulta(null)
    setNotas('')
    setDiagnostico('')
    setReceta('')

    apiFetch<ConsultaResponse>(`/api/v1/consultas/por-cita/${cita.id}`)
      .then((data) => setConsulta(data))
      .catch((err) => {
        if (!(err instanceof ApiRequestError && err.status === 404)) {
          toast.error('No se pudo cargar la consulta')
        }
      })
      .finally(() => setCargando(false))
  }, [open, cita])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!cita) return
    setEnviando(true)
    try {
      const nueva = await apiFetch<ConsultaResponse>('/api/v1/consultas', {
        method: 'POST',
        body: {
          citaId: cita.id,
          notas: notas || null,
          diagnostico: diagnostico || null,
          receta: receta || null,
        },
      })
      toast.success('Consulta registrada')
      setConsulta(nueva)
    } catch (err) {
      if (err instanceof ApiRequestError) {
        toast.error(err.body?.message ?? 'No se pudo registrar la consulta')
      } else {
        toast.error('No se pudo conectar con el servidor')
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Consulta - {cita?.pacienteNombre}</DialogTitle>
          <DialogDescription>
            {cita &&
              new Date(cita.fechaHora).toLocaleString('es-SV', { dateStyle: 'medium', timeStyle: 'short' })}
            {' con '}
            {cita?.doctorNombre}
          </DialogDescription>
        </DialogHeader>

        {cargando && <p className="py-4 text-sm text-muted-foreground">Cargando...</p>}

        {!cargando && consulta && (
          <div className="flex flex-col gap-4 py-4 text-sm">
            <div>
              <p className="font-medium">Notas</p>
              <p className="whitespace-pre-wrap text-muted-foreground">{consulta.notas || 'Sin notas'}</p>
            </div>
            <div>
              <p className="font-medium">Diagnostico</p>
              <p className="whitespace-pre-wrap text-muted-foreground">
                {consulta.diagnostico || 'Sin diagnostico'}
              </p>
            </div>
            <div>
              <p className="font-medium">Receta</p>
              <p className="whitespace-pre-wrap text-muted-foreground">{consulta.receta || 'Sin receta'}</p>
            </div>
          </div>
        )}

        {!cargando && !consulta && (
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="notas">Notas</Label>
                <Textarea id="notas" rows={3} value={notas} onChange={(e) => setNotas(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="diagnostico">Diagnostico</Label>
                <Textarea
                  id="diagnostico"
                  rows={2}
                  value={diagnostico}
                  onChange={(e) => setDiagnostico(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="receta">Receta</Label>
                <Textarea id="receta" rows={2} value={receta} onChange={(e) => setReceta(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={enviando}>
                {enviando ? 'Guardando...' : 'Registrar consulta'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

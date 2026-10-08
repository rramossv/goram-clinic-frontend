import { useEffect, useRef, useState, type FormEvent } from 'react'
import { apiFetch, ApiRequestError } from '@/lib/api'
import type { CitaResponse, ConsultaResponse } from '@/types'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ConsultarFarmaciasBoton } from '@/components/farmacias/farmacias'
import { toast } from 'sonner'
import { Pencil, Printer } from 'lucide-react'

interface ConsultaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cita: CitaResponse | null
  /** Se llama tras guardar: la cita pasa a "Atendida" y la lista debe recargarse. */
  onGuardada?: () => void
}

export function abrirImpresionReceta(citaId: string) {
  window.open(`/imprimir/receta/${citaId}`, '_blank', 'noopener')
}

function Bloque({ titulo, texto, vacio }: { titulo: string; texto: string | null; vacio: string }) {
  return (
    <div className="border-b pb-3 last:border-b-0 last:pb-0">
      <p className="text-xs font-semibold tracking-[0.04em] text-muted-foreground uppercase">{titulo}</p>
      <p className={`mt-1 whitespace-pre-wrap ${texto ? 'text-foreground' : 'text-muted-foreground italic'}`}>{texto || vacio}</p>
    </div>
  )
}

export function ConsultaDialog({ open, onOpenChange, cita, onGuardada }: ConsultaDialogProps) {
  const [cargando, setCargando] = useState(true)
  const [consulta, setConsulta] = useState<ConsultaResponse | null>(null)
  const [editando, setEditando] = useState(false)
  const [notas, setNotas] = useState('')
  const [diagnostico, setDiagnostico] = useState('')
  const [receta, setReceta] = useState('')
  const [enviando, setEnviando] = useState(false)
  const recetaRef = useRef<HTMLTextAreaElement>(null)

  // Lo seleccionado en la receta, o el nombre del medicamento de la linea
  // donde esta el cursor (hasta el primer numero: "Amoxicilina 500 mg" -> "Amoxicilina").
  function terminoDeReceta() {
    const area = recetaRef.current
    if (!area) return ''
    const seleccion = area.value.slice(area.selectionStart, area.selectionEnd).trim()
    if (seleccion) return seleccion
    const antes = area.value.slice(0, area.selectionStart)
    const linea = area.value.split('\n')[antes.split('\n').length - 1] ?? ''
    return linea.split(/\d/)[0].replace(/[,;:-]+$/, '').trim()
  }

  useEffect(() => {
    if (!open || !cita) return
    setCargando(true)
    setConsulta(null)
    setEditando(false)
    setNotas('')
    setDiagnostico('')
    setReceta('')

    apiFetch<ConsultaResponse>(`/api/v1/consultas/por-cita/${cita.id}`)
      .then((data) => setConsulta(data))
      .catch((err) => {
        if (!(err instanceof ApiRequestError && err.status === 404)) {
          toast.error(err instanceof ApiRequestError && err.status === 403 ? 'No tenés acceso a las notas clínicas' : 'No se pudo cargar la consulta')
        }
      })
      .finally(() => setCargando(false))
  }, [open, cita])

  function empezarEdicion() {
    if (!consulta) return
    setNotas(consulta.notas ?? '')
    setDiagnostico(consulta.diagnostico ?? '')
    setReceta(consulta.receta ?? '')
    setEditando(true)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!cita) return
    setEnviando(true)
    const body = {
      citaId: cita.id,
      notas: notas.trim() || null,
      diagnostico: diagnostico.trim() || null,
      receta: receta.trim() || null,
    }
    try {
      const guardada = consulta
        ? await apiFetch<ConsultaResponse>(`/api/v1/consultas/${consulta.id}`, { method: 'PUT', body })
        : await apiFetch<ConsultaResponse>('/api/v1/consultas', { method: 'POST', body })
      toast.success(consulta ? 'Consulta actualizada' : 'Consulta registrada; la cita quedó como atendida')
      setConsulta(guardada)
      setEditando(false)
      onGuardada?.()
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? (err.body?.message ?? 'No se pudo guardar la consulta') : 'No se pudo conectar con el servidor')
    } finally {
      setEnviando(false)
    }
  }

  const mostrarFormulario = !cargando && (!consulta || editando)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Consulta de {cita?.pacienteNombre}</DialogTitle>
          <DialogDescription>
            {cita && new Date(cita.fechaHora).toLocaleString('es-SV', { dateStyle: 'medium', timeStyle: 'short' })}
            {' · '}
            {cita?.doctorNombre}
          </DialogDescription>
        </DialogHeader>

        {cargando && (
          <div className="flex flex-col gap-3 py-4">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}

        {!cargando && consulta && !editando && (
          <>
            <div className="flex flex-col gap-3 py-3 text-sm">
              <Bloque titulo="Notas" texto={consulta.notas} vacio="Sin notas" />
              <Bloque titulo="Diagnóstico" texto={consulta.diagnostico} vacio="Sin diagnóstico" />
              <Bloque titulo="Receta" texto={consulta.receta} vacio="Sin receta" />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={empezarEdicion}>
                <Pencil />
                Editar
              </Button>
              <Button onClick={() => abrirImpresionReceta(consulta.citaId)} disabled={!consulta.receta}>
                <Printer />
                Imprimir receta
              </Button>
            </DialogFooter>
          </>
        )}

        {mostrarFormulario && (
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="notas">Notas de la consulta</Label>
                <Textarea id="notas" rows={3} placeholder="Síntomas, signos vitales, examen físico..." value={notas} onChange={(e) => setNotas(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="diagnostico">Diagnóstico</Label>
                <Textarea id="diagnostico" rows={2} value={diagnostico} onChange={(e) => setDiagnostico(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="receta">Receta</Label>
                  <ConsultarFarmaciasBoton terminoInicial={terminoDeReceta} />
                </div>
                <Textarea
                  ref={recetaRef}
                  id="receta"
                  rows={4}
                  placeholder={'Un medicamento por línea, con dosis y frecuencia.\nEj. Amoxicilina 500 mg, 1 cápsula cada 8 horas por 7 días'}
                  value={receta}
                  onChange={(e) => setReceta(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              {editando && (
                <Button type="button" variant="ghost" onClick={() => setEditando(false)}>
                  Cancelar
                </Button>
              )}
              <Button type="submit" disabled={enviando}>
                {enviando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Registrar consulta'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

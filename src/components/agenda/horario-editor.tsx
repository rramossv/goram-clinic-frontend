import { useEffect, useState } from 'react'
import { apiFetch, ApiRequestError } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { atiendePacientes, type HorarioFranja, type UsuarioResumen } from '@/types'
import { DIAS_SEMANA } from '@/lib/agenda'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Copy, Plus, X } from 'lucide-react'

type Franja = { inicio: string; fin: string }
type Semana = Franja[][] // indice 0 = lunes

const corta = (hora: string) => hora.slice(0, 5)

function aSemana(horarios: HorarioFranja[], doctorId: string): Semana {
  const semana: Semana = Array.from({ length: 7 }, () => [])
  horarios.filter((h) => h.doctorId === doctorId).forEach((h) => semana[h.diaSemana - 1].push({ inicio: corta(h.horaInicio), fin: corta(h.horaFin) }))
  return semana
}

const SUGERIDO: Semana = [
  ...Array.from({ length: 5 }, () => [
    { inicio: '08:00', fin: '12:00' },
    { inicio: '14:00', fin: '18:00' },
  ]),
  [{ inicio: '08:00', fin: '12:00' }],
  [],
]

/**
 * Horario semanal de atencion. Un administrador elige el medico; un medico
 * (en su perfil) edita solo el suyo.
 */
export function HorarioEditor({ soloPropio = false }: { soloPropio?: boolean }) {
  const { sesion } = useAuth()
  const [medicos, setMedicos] = useState<UsuarioResumen[] | null>(null)
  const [doctorId, setDoctorId] = useState('')
  const [todos, setTodos] = useState<HorarioFranja[]>([])
  const [semana, setSemana] = useState<Semana>(Array.from({ length: 7 }, () => []))
  const [guardando, setGuardando] = useState(false)
  const [cambios, setCambios] = useState(false)

  useEffect(() => {
    Promise.all([apiFetch<UsuarioResumen[]>('/api/v1/usuarios'), apiFetch<HorarioFranja[]>('/api/v1/horarios')])
      .then(([usuarios, horarios]) => {
        const lista = usuarios.filter((u) => u.activo && atiendePacientes(u) && (!soloPropio || u.id === sesion?.usuarioId))
        setMedicos(lista)
        setTodos(horarios)
        const inicial = lista.find((m) => m.id === sesion?.usuarioId)?.id ?? lista[0]?.id ?? ''
        setDoctorId(inicial)
        setSemana(aSemana(horarios, inicial))
      })
      .catch(() => toast.error('No se pudo cargar el horario'))
  }, [soloPropio, sesion?.usuarioId])

  function editar(nueva: Semana) {
    setSemana(nueva)
    setCambios(true)
  }

  function setFranja(dia: number, i: number, campo: keyof Franja, valor: string) {
    editar(semana.map((franjas, d) => (d === dia ? franjas.map((f, j) => (j === i ? { ...f, [campo]: valor } : f)) : franjas)))
  }

  async function guardar() {
    const franjas = semana.flatMap((fs, d) => fs.map((f) => ({ diaSemana: d + 1, horaInicio: f.inicio, horaFin: f.fin })))
    if (franjas.some((f) => f.horaInicio >= f.horaFin)) {
      toast.error('Cada franja tiene que terminar después de empezar')
      return
    }
    setGuardando(true)
    try {
      const guardado = await apiFetch<HorarioFranja[]>(`/api/v1/horarios/${doctorId}`, { method: 'PUT', body: franjas })
      setTodos((t) => [...t.filter((h) => h.doctorId !== doctorId), ...guardado])
      setCambios(false)
      toast.success(franjas.length ? 'Horario guardado; la agenda ya lo muestra' : 'Horario quitado: se puede agendar a cualquier hora')
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? (err.body?.message ?? 'No se pudo guardar el horario') : 'No se pudo conectar con el servidor')
    } finally {
      setGuardando(false)
    }
  }

  if (!medicos) return <Skeleton className="h-80 w-full" />
  if (medicos.length === 0) return <p className="rounded-lg border bg-card p-5 text-sm text-muted-foreground">No hay médicos activos para configurar.</p>

  const vacio = semana.every((d) => d.length === 0)

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {medicos.length > 1 ? (
          <Select
            value={doctorId}
            onValueChange={(id) => {
              setDoctorId(id)
              setSemana(aSemana(todos, id))
              setCambios(false)
            }}
          >
            <SelectTrigger className="w-64" aria-label="Médico">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {medicos.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <p className="text-sm text-muted-foreground">Fuera de este horario la agenda pide confirmación antes de agendar.</p>
        )}
        {vacio && (
          <Button type="button" variant="outline" size="sm" onClick={() => editar(SUGERIDO.map((d) => d.map((f) => ({ ...f }))))}>
            Usar horario sugerido (L-V 8-12 y 2-6, sáb. 8-12)
          </Button>
        )}
      </div>

      <ul className="divide-y rounded-md border">
        {DIAS_SEMANA.map((nombre, d) => {
          const franjas = semana[d]
          const atiende = franjas.length > 0
          return (
            <li key={nombre} className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center">
              <label className="flex w-36 shrink-0 items-center gap-2.5 text-sm font-medium">
                <input
                  type="checkbox"
                  className="size-4 accent-[var(--primary)]"
                  checked={atiende}
                  onChange={(e) => editar(semana.map((fs, i) => (i === d ? (e.target.checked ? [{ inicio: '08:00', fin: '12:00' }] : []) : fs)))}
                />
                <span className={cn(atiende ? 'text-tinta' : 'text-muted-foreground')}>{nombre}</span>
              </label>
              {atiende ? (
                <div className="flex flex-1 flex-wrap items-center gap-2">
                  {franjas.map((f, i) => (
                    <span key={i} className="inline-flex items-center gap-1 rounded-md bg-carton/70 py-1 pr-1 pl-2">
                      <input type="time" aria-label={`${nombre} desde`} value={f.inicio} onChange={(e) => setFranja(d, i, 'inicio', e.target.value)} className="bg-transparent text-sm tabular-nums outline-none" />
                      <span className="text-muted-foreground">–</span>
                      <input type="time" aria-label={`${nombre} hasta`} value={f.fin} onChange={(e) => setFranja(d, i, 'fin', e.target.value)} className="bg-transparent text-sm tabular-nums outline-none" />
                      <button type="button" aria-label="Quitar franja" className="rounded p-0.5 text-muted-foreground hover:bg-background hover:text-destructive" onClick={() => editar(semana.map((fs, x) => (x === d ? fs.filter((_, j) => j !== i) : fs)))}>
                        <X className="size-3.5" />
                      </button>
                    </span>
                  ))}
                  {franjas.length < 3 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => editar(semana.map((fs, x) => (x === d ? [...fs, { inicio: '14:00', fin: '18:00' }] : fs)))}>
                      <Plus />
                      Franja
                    </Button>
                  )}
                  {d === 0 && (
                    <Button type="button" variant="ghost" size="sm" className="sm:ml-auto" onClick={() => editar(semana.map((fs, x) => (x >= 1 && x <= 4 ? franjas.map((f) => ({ ...f })) : fs)))}>
                      <Copy />
                      Copiar a martes–viernes
                    </Button>
                  )}
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">No atiende</span>
              )}
            </li>
          )
        })}
      </ul>

      <div className="flex justify-end">
        <Button type="button" onClick={guardar} disabled={guardando || !cambios}>
          {guardando ? 'Guardando…' : 'Guardar horario'}
        </Button>
      </div>
    </div>
  )
}

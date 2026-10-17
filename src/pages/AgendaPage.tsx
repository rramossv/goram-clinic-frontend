import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { atiendePacientes, type BloqueoAgenda, type CitaResponse, type HorarioFranja, type UsuarioResumen } from '@/types'
import { esMismoDia } from '@/lib/agenda'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/page-header'
import { AgendaGrid, type ColumnaAgenda } from '@/components/agenda/day-calendar'
import { CitaFormDialog } from '@/components/agenda/cita-form-dialog'
import { CitaDetailDialog } from '@/components/agenda/cita-detail-dialog'
import { BloqueoDialog } from '@/components/agenda/bloqueo-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Ban, ChevronLeft, ChevronRight, Plus } from 'lucide-react'

type Vista = 'dia' | 'semana'

function inicioDelDia(fecha: Date) {
  const copia = new Date(fecha)
  copia.setHours(0, 0, 0, 0)
  return copia
}

function lunesDe(fecha: Date) {
  const d = inicioDelDia(fecha)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d
}

function leerVista(): Vista {
  try {
    return localStorage.getItem('goram_vista_agenda') === 'semana' ? 'semana' : 'dia'
  } catch {
    return 'dia'
  }
}

const isoDia = (f: Date) => `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`

export function AgendaPage() {
  const { sesion } = useAuth()
  const [fecha, setFecha] = useState(() => inicioDelDia(new Date()))
  const [vista, setVista] = useState<Vista>(leerVista)
  const [citas, setCitas] = useState<CitaResponse[]>([])
  const [doctores, setDoctores] = useState<UsuarioResumen[]>([])
  const [horarios, setHorarios] = useState<HorarioFranja[]>([])
  const [bloqueos, setBloqueos] = useState<BloqueoAgenda[]>([])
  const [doctorSemana, setDoctorSemana] = useState('')
  const [cargando, setCargando] = useState(true)
  const [dialogCrearAbierto, setDialogCrearAbierto] = useState(false)
  const [prefill, setPrefill] = useState<{ doctorId: string; fechaHora: Date } | null>(null)
  const [citaDetalle, setCitaDetalle] = useState<CitaResponse | null>(null)
  const [bloqueoAbierto, setBloqueoAbierto] = useState(false)
  const [bloqueoAQuitar, setBloqueoAQuitar] = useState<BloqueoAgenda | null>(null)

  async function cargar() {
    try {
      const [citasData, usuariosData, horariosData, bloqueosData] = await Promise.all([
        apiFetch<CitaResponse[]>('/api/v1/citas'),
        apiFetch<UsuarioResumen[]>('/api/v1/usuarios'),
        apiFetch<HorarioFranja[]>('/api/v1/horarios').catch(() => []),
        apiFetch<BloqueoAgenda[]>('/api/v1/bloqueos').catch(() => []),
      ])
      const medicos = usuariosData.filter((u) => u.activo && atiendePacientes(u))
      setCitas(citasData)
      setDoctores(medicos)
      setHorarios(horariosData)
      setBloqueos(bloqueosData)
      setDoctorSemana((actual) => actual || medicos.find((m) => m.id === sesion?.usuarioId)?.id || medicos[0]?.id || '')
    } catch {
      toast.error('No se pudo cargar la agenda')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function cambiarVista(v: Vista) {
    setVista(v)
    try {
      localStorage.setItem('goram_vista_agenda', v)
    } catch {
      // preferencia opcional
    }
  }

  function mover(dias: number) {
    setFecha((actual) => {
      const nueva = new Date(actual)
      nueva.setDate(nueva.getDate() + dias)
      return nueva
    })
  }

  const hoy = new Date()
  const columnas: ColumnaAgenda[] = useMemo(() => {
    if (vista === 'dia') {
      return doctores.map((d) => ({ clave: d.id, titulo: d.nombre, doctorId: d.id, fecha }))
    }
    const lunes = lunesDe(fecha)
    return Array.from({ length: 7 }, (_, i) => {
      const dia = new Date(lunes)
      dia.setDate(lunes.getDate() + i)
      return {
        clave: `${doctorSemana}-${i}`,
        titulo: (
          <span className="flex flex-col leading-tight">
            <span className="text-[11px] font-medium text-muted-foreground capitalize">{dia.toLocaleDateString('es-SV', { weekday: 'short' })}</span>
            <span>{dia.getDate()}</span>
          </span>
        ),
        doctorId: doctorSemana,
        fecha: dia,
        resaltada: esMismoDia(dia, hoy),
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vista, doctores, fecha, doctorSemana])

  const titulo =
    vista === 'dia'
      ? fecha.toLocaleDateString('es-SV', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      : (() => {
          const l = lunesDe(fecha)
          const d = new Date(l)
          d.setDate(l.getDate() + 6)
          return `Semana del ${l.toLocaleDateString('es-SV', { day: 'numeric', month: 'long' })} al ${d.toLocaleDateString('es-SV', { day: 'numeric', month: 'long', year: 'numeric' })}`
        })()

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        titulo="Agenda"
        descripcion={<span className="first-letter:uppercase">{titulo}</span>}
        acciones={
          <>
            <Button variant="outline" onClick={() => setBloqueoAbierto(true)} disabled={doctores.length === 0}>
              <Ban />
              Bloquear tiempo
            </Button>
            <Button
              onClick={() => {
                setPrefill(null)
                setDialogCrearAbierto(true)
              }}
            >
              <Plus />
              Nueva cita
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg bg-carton p-1" role="tablist" aria-label="Vista de la agenda">
          {(
            [
              ['dia', 'Día'],
              ['semana', 'Semana'],
            ] as const
          ).map(([v, etiqueta]) => (
            <button
              key={v}
              role="tab"
              aria-selected={vista === v}
              onClick={() => cambiarVista(v)}
              className={cn('rounded-md px-3.5 py-1.5 text-sm font-medium', vista === v ? 'bg-background text-tinta shadow-sm' : 'text-carton-foreground hover:text-tinta')}
            >
              {etiqueta}
            </button>
          ))}
        </div>
        <Button variant="outline" size="icon" aria-label={vista === 'dia' ? 'Día anterior' : 'Semana anterior'} onClick={() => mover(vista === 'dia' ? -1 : -7)}>
          <ChevronLeft />
        </Button>
        <Button variant="outline" onClick={() => setFecha(inicioDelDia(new Date()))}>
          Hoy
        </Button>
        <Button variant="outline" size="icon" aria-label={vista === 'dia' ? 'Día siguiente' : 'Semana siguiente'} onClick={() => mover(vista === 'dia' ? 1 : 7)}>
          <ChevronRight />
        </Button>
        <Input
          type="date"
          aria-label="Ir a una fecha"
          className="w-[9.5rem]"
          value={isoDia(fecha)}
          onChange={(e) => {
            if (!e.target.value) return
            const [a, m, d] = e.target.value.split('-').map(Number)
            setFecha(new Date(a, m - 1, d))
          }}
        />
        {vista === 'semana' && doctores.length > 1 && (
          <Select value={doctorSemana} onValueChange={setDoctorSemana}>
            <SelectTrigger className="w-56" aria-label="Médico">
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
        )}
        {horarios.length > 0 && (
          <span className="ml-auto hidden items-center gap-2 text-xs text-muted-foreground md:inline-flex">
            <span className="size-3 rounded-sm bg-carton ring-1 ring-border" />
            Fuera del horario de atención
          </span>
        )}
      </div>

      {cargando ? (
        <Skeleton className="h-[32rem] w-full" />
      ) : (
        <AgendaGrid
          columnas={columnas}
          citas={citas}
          horarios={horarios}
          bloqueos={bloqueos}
          anchoColumna={vista === 'semana' ? '7.5rem' : '10rem'}
          onCeldaVacia={(doctorId, fechaHora) => {
            setPrefill({ doctorId, fechaHora })
            setDialogCrearAbierto(true)
          }}
          onCita={setCitaDetalle}
          onBloqueo={setBloqueoAQuitar}
        />
      )}

      <CitaFormDialog
        open={dialogCrearAbierto}
        onOpenChange={setDialogCrearAbierto}
        prefill={prefill}
        onGuardado={() => {
          setDialogCrearAbierto(false)
          cargar()
        }}
      />

      <CitaDetailDialog cita={citaDetalle} onOpenChange={(open) => !open && setCitaDetalle(null)} onActualizada={cargar} />

      <BloqueoDialog
        open={bloqueoAbierto}
        onOpenChange={setBloqueoAbierto}
        doctores={doctores}
        doctorInicial={vista === 'semana' ? doctorSemana : undefined}
        onGuardado={() => {
          setBloqueoAbierto(false)
          cargar()
        }}
      />

      <AlertDialog open={bloqueoAQuitar !== null} onOpenChange={(o) => !o && setBloqueoAQuitar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Quitar este bloqueo?</AlertDialogTitle>
            <AlertDialogDescription>
              {bloqueoAQuitar &&
                `${bloqueoAQuitar.doctorNombre} · ${new Date(bloqueoAQuitar.desde).toLocaleString('es-SV', { dateStyle: 'medium', timeStyle: 'short' })} a ${new Date(bloqueoAQuitar.hasta).toLocaleString('es-SV', { dateStyle: 'medium', timeStyle: 'short' })}${bloqueoAQuitar.motivo ? ` · ${bloqueoAQuitar.motivo}` : ''}. Se podrá volver a agendar en ese tiempo.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Mantener</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!bloqueoAQuitar) return
                try {
                  await apiFetch(`/api/v1/bloqueos/${bloqueoAQuitar.id}`, { method: 'DELETE' })
                  toast.success('Bloqueo quitado')
                  cargar()
                } catch {
                  toast.error('No se pudo quitar el bloqueo')
                }
              }}
            >
              Quitar bloqueo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

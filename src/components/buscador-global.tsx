import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '@/lib/api'
import { puede, useAuth } from '@/lib/auth-context'
import type { PacienteResponse } from '@/types'
import { normalizar } from '@/lib/cie10'
import { edadLegible } from '@/lib/clinica'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { CodigoPaciente } from '@/components/codigo-paciente'
import { CitaFormDialog } from '@/components/agenda/cita-form-dialog'
import { PacienteFormDialog } from '@/components/pacientes/paciente-form-dialog'
import { AlertTriangle, CalendarDays, CalendarPlus, CornerDownLeft, LayoutDashboard, Receipt, Search, Stethoscope, UserPlus, Users } from 'lucide-react'

interface Opcion {
  clave: string
  grupo: string
  titulo: string
  detalle?: string
  icono?: React.ReactNode
  alerta?: boolean
  accion: () => void
}

/** Ctrl+K desde cualquier pantalla: un paciente o una accion en dos segundos. */
export function BuscadorGlobal({ abierto, onAbiertoChange }: { abierto: boolean; onAbiertoChange: (v: boolean) => void }) {
  const navigate = useNavigate()
  const { sesion } = useAuth()
  const [texto, setTexto] = useState('')
  const [pacientes, setPacientes] = useState<PacienteResponse[] | null>(null)
  const [activo, setActivo] = useState(0)
  const [nuevaCita, setNuevaCita] = useState(false)
  const [nuevoPaciente, setNuevoPaciente] = useState(false)
  const listaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!abierto) return
    setTexto('')
    setActivo(0)
    apiFetch<PacienteResponse[]>('/api/v1/pacientes')
      .then((p) => setPacientes(p.filter((x) => x.activo)))
      .catch(() => setPacientes([]))
  }, [abierto])

  const opciones = useMemo<Opcion[]>(() => {
    const ir = (ruta: string) => () => {
      onAbiertoChange(false)
      navigate(ruta)
    }
    const q = normalizar(texto)
    const qDigitos = texto.replace(/\D/g, '')
    const encontrados = (pacientes ?? [])
      .filter((p) => {
        if (!q) return false
        if (normalizar(p.nombre).split(/\s+/).some((parte) => parte.startsWith(q)) || normalizar(p.nombre).includes(q)) return true
        if (qDigitos.length >= 3 && ((p.documentoIdentidad ?? '').replace(/\D/g, '').includes(qDigitos) || (p.telefono ?? '').replace(/\D/g, '').includes(qDigitos))) return true
        return false
      })
      .slice(0, 7)
      .map<Opcion>((p) => ({
        clave: `p-${p.id}`,
        grupo: 'Pacientes',
        titulo: p.nombre,
        detalle: [edadLegible(p.fechaNacimiento), p.documentoIdentidad, p.telefono].filter(Boolean).join(' · '),
        icono: <CodigoPaciente id={p.id} />,
        alerta: !!p.alergias && !/^\s*(ninguna|ninguno|no|niega|n\/a|sin alergias)\b/i.test(p.alergias),
        accion: ir(`/pacientes/${p.id}`),
      }))

    const acciones: Opcion[] = [
      {
        clave: 'a-cita',
        grupo: 'Acciones',
        titulo: 'Agendar cita',
        icono: <CalendarPlus className="size-4" />,
        accion: () => {
          onAbiertoChange(false)
          setNuevaCita(true)
        },
      },
      {
        clave: 'a-paciente',
        grupo: 'Acciones',
        titulo: q ? `Registrar a «${texto.trim()}» como paciente nuevo` : 'Registrar paciente nuevo',
        icono: <UserPlus className="size-4" />,
        accion: () => {
          onAbiertoChange(false)
          setNuevoPaciente(true)
        },
      },
      { clave: 'n-hoy', grupo: 'Ir a', titulo: 'Hoja del día', icono: <LayoutDashboard className="size-4" />, accion: ir('/panel') },
      { clave: 'n-agenda', grupo: 'Ir a', titulo: 'Agenda', icono: <CalendarDays className="size-4" />, accion: ir('/agenda') },
      { clave: 'n-pacientes', grupo: 'Ir a', titulo: 'Pacientes', icono: <Users className="size-4" />, accion: ir('/pacientes') },
      ...(puede(sesion, 'clinico') ? [{ clave: 'n-consultas', grupo: 'Ir a', titulo: 'Consultas por atender', icono: <Stethoscope className="size-4" />, accion: ir('/consultas') }] : []),
      { clave: 'n-facturas', grupo: 'Ir a', titulo: 'Facturación', icono: <Receipt className="size-4" />, accion: ir('/facturas') },
    ].filter((o) => !q || o.grupo === 'Acciones' || normalizar(o.titulo).includes(q))

    return [...encontrados, ...acciones]
  }, [texto, pacientes, sesion, navigate, onAbiertoChange])

  useEffect(() => {
    listaRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [activo])

  let grupoAnterior = ''

  return (
    <>
      <Dialog open={abierto} onOpenChange={onAbiertoChange}>
        <DialogContent showCloseButton={false} className="top-[12vh] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-xl">
          <DialogTitle className="sr-only">Buscar</DialogTitle>
          <div className="flex items-center gap-3 border-b px-4">
            <Search className="size-5 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={texto}
              onChange={(e) => {
                setTexto(e.target.value)
                setActivo(0)
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  setActivo((a) => Math.min(a + 1, opciones.length - 1))
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  setActivo((a) => Math.max(a - 1, 0))
                } else if (e.key === 'Enter') {
                  e.preventDefault()
                  opciones[activo]?.accion()
                }
              }}
              placeholder="Buscar paciente por nombre, DUI o teléfono…"
              aria-label="Buscar"
              className="h-14 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
            />
            <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground sm:inline">Esc</kbd>
          </div>
          <div ref={listaRef} role="listbox" className="max-h-[55vh] overflow-y-auto p-2">
            {texto && pacientes !== null && !opciones.some((o) => o.grupo === 'Pacientes') && (
              <p className="px-3 py-3 text-sm text-muted-foreground">Ningún paciente coincide con «{texto}».</p>
            )}
            {opciones.map((o, i) => {
              const encabezado = o.grupo !== grupoAnterior ? o.grupo : null
              grupoAnterior = o.grupo
              return (
                <div key={o.clave}>
                  {encabezado && <p className="px-3 pt-2.5 pb-1 text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">{encabezado}</p>}
                  <button
                    type="button"
                    role="option"
                    aria-selected={i === activo}
                    onMouseMove={() => setActivo(i)}
                    onClick={o.accion}
                    className={cn('flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left', i === activo && 'bg-accent')}
                  >
                    <span className="flex w-8 shrink-0 justify-center text-muted-foreground">{o.icono}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-tinta">{o.titulo}</span>
                        {o.alerta && (
                          <span className="inline-flex items-center gap-1 rounded bg-peligro-suave px-1.5 text-[11px] font-medium text-destructive">
                            <AlertTriangle className="size-3" />
                            Alergias
                          </span>
                        )}
                      </span>
                      {o.detalle && <span className="block truncate text-xs text-muted-foreground">{o.detalle}</span>}
                    </span>
                    {i === activo && <CornerDownLeft className="size-4 shrink-0 text-muted-foreground" />}
                  </button>
                </div>
              )
            })}
          </div>
          <div className="hidden items-center gap-4 border-t bg-muted/40 px-4 py-2 text-[11px] text-muted-foreground sm:flex">
            <span>↑ ↓ para moverte</span>
            <span>Enter para abrir</span>
            <span className="ml-auto">Ctrl K desde cualquier pantalla</span>
          </div>
        </DialogContent>
      </Dialog>
      <CitaFormDialog open={nuevaCita} onOpenChange={setNuevaCita} onGuardado={() => setNuevaCita(false)} />
      <PacienteFormDialog
        open={nuevoPaciente}
        onOpenChange={setNuevoPaciente}
        paciente={null}
        onGuardado={() => {
          setNuevoPaciente(false)
          navigate('/pacientes')
        }}
      />
    </>
  )
}

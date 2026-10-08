import { useEffect, useMemo, useRef, useState } from 'react'
import { apiFetch, ApiRequestError } from '@/lib/api'
import type { PacienteResponse } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CodigoPaciente } from '@/components/codigo-paciente'
import { ChevronsUpDown, Search, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const MAX_RESULTADOS = 50

interface PacienteSelectorProps {
  id?: string
  value: string
  onChange: (pacienteId: string) => void
}

/**
 * Buscador de pacientes con alta rapida: la recepcion escribe el nombre y,
 * si el paciente aun no existe, lo crea ahi mismo sin salir del formulario.
 */
export function PacienteSelector({ id, value, onChange }: PacienteSelectorProps) {
  const [pacientes, setPacientes] = useState<PacienteResponse[]>([])
  const [abierto, setAbierto] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [creando, setCreando] = useState(false)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoTelefono, setNuevoTelefono] = useState('')
  const [nuevoDocumento, setNuevoDocumento] = useState('')
  const [guardando, setGuardando] = useState(false)
  const nombreRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    apiFetch<PacienteResponse[]>('/api/v1/pacientes')
      .then((data) => setPacientes(data.filter((p) => p.activo)))
      .catch(() => toast.error('No se pudieron cargar los pacientes'))
  }, [])

  useEffect(() => {
    if (creando) nombreRef.current?.focus()
  }, [creando])

  const seleccionado = pacientes.find((p) => p.id === value)

  const resultados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase()
    const lista = termino
      ? pacientes.filter(
          (p) =>
            p.nombre.toLowerCase().includes(termino) ||
            (p.documentoIdentidad ?? '').toLowerCase().includes(termino) ||
            (p.telefono ?? '').includes(termino),
        )
      : pacientes
    return lista.slice(0, MAX_RESULTADOS)
  }, [pacientes, busqueda])

  function elegir(paciente: PacienteResponse) {
    onChange(paciente.id)
    setAbierto(false)
    setBusqueda('')
  }

  function empezarAlta() {
    setNuevoNombre(busqueda.trim())
    setNuevoTelefono('')
    setNuevoDocumento('')
    setAbierto(false)
    setCreando(true)
  }

  async function crear() {
    if (!nuevoNombre.trim()) return
    setGuardando(true)
    try {
      const creado = await apiFetch<PacienteResponse>('/api/v1/pacientes', {
        method: 'POST',
        body: {
          nombre: nuevoNombre.trim(),
          telefono: nuevoTelefono.trim() || null,
          documentoIdentidad: nuevoDocumento.trim() || null,
        },
      })
      setPacientes((anteriores) => [...anteriores, creado].sort((a, b) => a.nombre.localeCompare(b.nombre)))
      onChange(creado.id)
      setCreando(false)
      setBusqueda('')
      toast.success(`Paciente ${creado.nombre} registrado`)
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? (err.body?.message ?? 'No se pudo crear el paciente') : 'No se pudo conectar con el servidor')
    } finally {
      setGuardando(false)
    }
  }

  if (creando) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border bg-carton/50 p-3">
        <p className="text-sm font-semibold text-tinta">Nuevo paciente</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="nuevo-paciente-nombre" className="text-xs">Nombre completo</Label>
            <Input
              id="nuevo-paciente-nombre"
              ref={nombreRef}
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  crear()
                }
              }}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nuevo-paciente-telefono" className="text-xs">Teléfono</Label>
            <Input id="nuevo-paciente-telefono" inputMode="tel" value={nuevoTelefono} onChange={(e) => setNuevoTelefono(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nuevo-paciente-documento" className="text-xs">DUI (opcional)</Label>
            <Input id="nuevo-paciente-documento" value={nuevoDocumento} onChange={(e) => setNuevoDocumento(e.target.value)} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Podés completar el resto del expediente después, desde su ficha.</p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => setCreando(false)}>
            Cancelar
          </Button>
          <Button type="button" size="sm" disabled={guardando || !nuevoNombre.trim()} onClick={crear}>
            {guardando ? 'Guardando...' : 'Crear y seleccionar'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={abierto}
          className="flex h-9 w-full items-center gap-2 rounded-md border border-input bg-card px-3 text-left text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {seleccionado ? (
            <>
              <CodigoPaciente id={seleccionado.id} />
              <span className="truncate font-medium text-tinta">{seleccionado.nombre}</span>
            </>
          ) : (
            <span className="text-muted-foreground">Buscar o registrar paciente...</span>
          )}
          <ChevronsUpDown className="ml-auto size-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] min-w-72 p-0">
        <div className="flex items-center gap-2 border-b px-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                if (resultados[0]) elegir(resultados[0])
                else empezarAlta()
              }
            }}
            placeholder="Nombre, DUI o teléfono"
            className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {resultados.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">
              {busqueda ? 'Ningún paciente coincide.' : 'Todavía no hay pacientes registrados.'}
            </p>
          ) : (
            resultados.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => elegir(p)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-sm px-2 py-2 text-left text-sm hover:bg-accent',
                  p.id === value && 'bg-accent',
                )}
              >
                <CodigoPaciente id={p.id} />
                <span className="min-w-0 flex-1 truncate font-medium text-tinta">{p.nombre}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{p.documentoIdentidad ?? p.telefono ?? ''}</span>
              </button>
            ))
          )}
        </div>
        <div className="border-t p-1">
          <button
            type="button"
            onClick={empezarAlta}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm font-medium text-primary hover:bg-accent"
          >
            <UserPlus className="size-4" />
            {busqueda.trim() ? `Registrar a "${busqueda.trim()}" como paciente nuevo` : 'Registrar paciente nuevo'}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

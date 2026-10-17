import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiFetch } from '@/lib/api'
import { ESTADOS_POR_ATENDER, type CitaResponse, type ConsultaResponse } from '@/types'
import { fechaCorta, fechaHora, hora } from '@/lib/clinica'
import { normalizar } from '@/lib/cie10'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/page-header'
import { CodigoPaciente } from '@/components/codigo-paciente'
import { EstadoChip } from '@/components/estado-chip'
import { PaginationControls } from '@/components/pagination-controls'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { ChevronRight, ClipboardList, Pill, Search, Stethoscope } from 'lucide-react'

type Vista = 'pendientes' | 'historial'
const POR_PAGINA = 15

function finDeHoy() {
  const d = new Date()
  d.setHours(23, 59, 59, 999)
  return d
}

export function ConsultasPage() {
  const navigate = useNavigate()
  const [vista, setVista] = useState<Vista>('pendientes')
  const [citas, setCitas] = useState<CitaResponse[]>([])
  const [consultas, setConsultas] = useState<ConsultaResponse[]>([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)

  useEffect(() => {
    Promise.all([apiFetch<CitaResponse[]>('/api/v1/citas'), apiFetch<ConsultaResponse[]>('/api/v1/consultas')])
      .then(([c, h]) => {
        setCitas(c)
        setConsultas(h)
      })
      .catch(() => toast.error('No se pudieron cargar las consultas'))
      .finally(() => setCargando(false))
  }, [])

  const pendientes = useMemo(() => {
    const limite = finDeHoy()
    return citas
      .filter((c) => ESTADOS_POR_ATENDER.includes(c.estado) && new Date(c.fechaHora) <= limite)
      .sort((a, b) => a.fechaHora.localeCompare(b.fechaHora))
  }, [citas])

  const historialFiltrado = useMemo(() => {
    const q = normalizar(busqueda)
    if (!q) return consultas
    return consultas.filter((c) =>
      normalizar([c.pacienteNombre, c.doctorNombre, c.motivoConsulta, c.diagnostico, ...c.diagnosticos.flatMap((d) => [d.codigo, d.descripcion]), ...c.recetaItems.map((r) => r.medicamento)].filter(Boolean).join(' ')).includes(q),
    )
  }, [consultas, busqueda])

  const totalPaginas = Math.max(1, Math.ceil(historialFiltrado.length / POR_PAGINA))
  const paginaActual = historialFiltrado.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)
  const hoy = new Date().toDateString()

  return (
    <div className="flex flex-col gap-5">
      <PageHeader titulo="Consultas" descripcion="Pacientes por atender y el historial clínico de todas las consultas registradas." />

      <div className="inline-flex self-start rounded-lg bg-carton p-1" role="tablist">
        {(
          [
            ['pendientes', 'Por atender', pendientes.length],
            ['historial', 'Historial', consultas.length],
          ] as const
        ).map(([valor, etiqueta, cuenta]) => (
          <button
            key={valor}
            role="tab"
            aria-selected={vista === valor}
            onClick={() => setVista(valor)}
            className={cn(
              'inline-flex items-center gap-2 rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors',
              vista === valor ? 'bg-background text-tinta shadow-sm' : 'text-carton-foreground hover:text-tinta',
            )}
          >
            {etiqueta}
            <span className={cn('rounded px-1.5 text-xs tabular-nums', vista === valor ? 'bg-carton text-carton-foreground' : 'bg-background/60')}>{cargando ? '·' : cuenta}</span>
          </button>
        ))}
      </div>

      {cargando && <Skeleton className="h-72 w-full" />}

      {!cargando && vista === 'pendientes' && (
        <div className="overflow-hidden rounded-lg border bg-card">
          {pendientes.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
              <Stethoscope className="size-8 text-muted-foreground/60" />
              <p className="font-medium text-tinta">No hay pacientes esperando consulta</p>
              <p className="max-w-sm text-sm text-muted-foreground">Las citas de hoy y las de días anteriores que todavía no se documentaron aparecen aquí.</p>
              <Button variant="outline" asChild className="mt-2">
                <Link to="/agenda">Abrir la agenda</Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y">
              {pendientes.map((c) => {
                const esHoy = new Date(c.fechaHora).toDateString() === hoy
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => navigate(`/atencion/${c.id}`)}
                      className="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-accent/50 sm:px-5"
                    >
                      <div className="w-20 shrink-0 tabular-nums">
                        <p className="text-sm font-semibold text-tinta">{hora(c.fechaHora)}</p>
                        <p className={cn('text-xs', esHoy ? 'text-muted-foreground' : 'font-medium text-aviso')}>{esHoy ? 'Hoy' : fechaCorta(c.fechaHora)}</p>
                      </div>
                      <CodigoPaciente id={c.pacienteId} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-tinta">{c.pacienteNombre}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {c.motivo ?? 'Sin motivo registrado'} · {c.doctorNombre}
                        </p>
                      </div>
                      <EstadoChip estado={c.estado} className="hidden sm:inline-flex" />
                      <span className="hidden items-center gap-1 text-sm font-medium text-primary md:inline-flex">
                        Atender
                        <ChevronRight className="size-4" />
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}

      {!cargando && vista === 'historial' && (
        <>
          <div className="flex h-9 max-w-md items-center gap-2 rounded-md bg-background px-3 ring-1 ring-input ring-inset focus-within:ring-2 focus-within:ring-ring">
            <Search className="size-4 text-muted-foreground" />
            <input
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value)
                setPagina(1)
              }}
              placeholder="Buscar por paciente, diagnóstico, código o medicamento…"
              className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              aria-label="Buscar en el historial"
            />
          </div>
          <div className="overflow-x-auto rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Diagnóstico</TableHead>
                  <TableHead className="text-right">Receta</TableHead>
                  <TableHead className="w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginaActual.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                      <ClipboardList className="mx-auto mb-2 size-7 opacity-50" />
                      {busqueda ? 'Ninguna consulta coincide con la búsqueda.' : 'Todavía no hay consultas registradas.'}
                    </TableCell>
                  </TableRow>
                )}
                {paginaActual.map((c) => {
                  const dx = c.diagnosticos[0]
                  return (
                    <TableRow key={c.id} className="cursor-pointer" onClick={() => navigate(`/atencion/${c.citaId}`)}>
                      <TableCell className="whitespace-nowrap">
                        <p className="text-tinta">{fechaCorta(c.citaFechaHora)}</p>
                        <p className="text-xs text-muted-foreground">{fechaHora(c.citaFechaHora).split(',').at(-1)?.trim()}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <CodigoPaciente id={c.pacienteId} />
                          <div className="min-w-0">
                            <p className="font-medium text-tinta">{c.pacienteNombre}</p>
                            <p className="text-xs text-muted-foreground">{c.doctorNombre}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-sm">
                        {dx ? (
                          <p className="flex items-baseline gap-2">
                            {dx.codigo && <span className="font-mono text-xs font-semibold text-info">{dx.codigo}</span>}
                            <span className="truncate">{dx.descripcion}</span>
                            {c.diagnosticos.length > 1 && <span className="text-xs text-muted-foreground">+{c.diagnosticos.length - 1}</span>}
                          </p>
                        ) : (
                          <span className="text-muted-foreground">{c.diagnostico ?? c.motivoConsulta ?? '—'}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {c.recetaItems.length > 0 ? (
                          <span className="inline-flex items-center gap-1 text-sm">
                            <Pill className="size-3.5 text-muted-foreground" />
                            {c.recetaItems.length}
                          </span>
                        ) : c.receta ? (
                          <span className="text-xs text-muted-foreground">Texto</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          <PaginationControls pagina={pagina} totalPaginas={totalPaginas} totalItems={historialFiltrado.length} tamanoPagina={POR_PAGINA} onCambiarPagina={setPagina} />
        </>
      )}
    </div>
  )
}

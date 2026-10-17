import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { apiFetch, ApiRequestError } from '@/lib/api'
import { puede, useAuth } from '@/lib/auth-context'
import type { CitaResponse, ConsultaResponse, FacturaResponse, PacienteResponse } from '@/types'
import { edadDe, edadLegible, fechaCorta, fechaHora, fechaLarga, presion, tieneAlergias } from '@/lib/clinica'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader, Seccion } from '@/components/page-header'
import { CodigoPaciente } from '@/components/codigo-paciente'
import { EstadoChip } from '@/components/estado-chip'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PacienteFormDialog } from '@/components/pacientes/paciente-form-dialog'
import { CitaFormDialog } from '@/components/agenda/cita-form-dialog'
import { FacturaFormDialog, abrirImpresionFactura } from '@/components/facturas/factura-form-dialog'
import { AlertaAlergias } from '@/components/consultas/expediente-lateral'
import { ListaDiagnosticos, ListaReceta, SignosLibro } from '@/components/consultas/resumen-consulta'
import { GraficaEvolucion } from '@/components/pacientes/grafica-evolucion'
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
import { toast } from 'sonner'
import { ArrowLeft, CalendarPlus, ChevronRight, Droplet, Pencil, Receipt, Stethoscope } from 'lucide-react'

function Dato({ etiqueta, valor }: { etiqueta: string; valor: React.ReactNode }) {
  return (
    <div className="border-b pb-3 last:border-b-0 last:pb-0">
      <p className="text-xs font-medium text-muted-foreground">{etiqueta}</p>
      <div className="mt-0.5 whitespace-pre-wrap text-foreground">{valor || '—'}</div>
    </div>
  )
}

function Evolucion({ consultas }: { consultas: ConsultaResponse[] }) {
  const [tabla, setTabla] = useState(false)
  // de la mas antigua a la mas reciente
  const orden = useMemo(() => [...consultas].reverse(), [consultas])
  const conPeso = orden.filter((c) => c.pesoKg !== null)
  const conPresion = orden.filter((c) => c.presionSistolica !== null && c.presionDiastolica !== null)
  if (conPeso.length < 2 && conPresion.length < 2) return null
  const filas = orden.filter((c) => c.pesoKg !== null || presion(c))

  return (
    <Seccion
      titulo="Evolución"
      accion={
        <Button variant="ghost" size="sm" onClick={() => setTabla((t) => !t)}>
          {tabla ? 'Ver gráficas' : 'Ver como tabla'}
        </Button>
      }
    >
      <div className="rounded-lg border bg-card p-4 sm:p-5">
        {tabla ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Peso (kg)</TableHead>
                <TableHead className="text-right">Presión (mmHg)</TableHead>
                <TableHead className="text-right">Glucosa (mg/dL)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...filas].reverse().map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{fechaCorta(c.citaFechaHora)}</TableCell>
                  <TableCell className="text-right">{c.pesoKg ?? '—'}</TableCell>
                  <TableCell className="text-right">{presion(c) ?? '—'}</TableCell>
                  <TableCell className="text-right">{c.glucosaMgDl ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2">
            {conPresion.length >= 2 && (
              <GraficaEvolucion
                titulo="Presión arterial"
                unidad="mmHg"
                fechas={conPresion.map((c) => c.citaFechaHora)}
                series={[
                  { nombre: 'Sistólica', color: '--serie-1', valores: conPresion.map((c) => c.presionSistolica) },
                  { nombre: 'Diastólica', color: '--serie-2', valores: conPresion.map((c) => c.presionDiastolica) },
                ]}
              />
            )}
            {conPeso.length >= 2 && (
              <GraficaEvolucion
                titulo="Peso"
                unidad="kg"
                fechas={conPeso.map((c) => c.citaFechaHora)}
                series={[{ nombre: 'Peso', color: '--serie-1', valores: conPeso.map((c) => c.pesoKg) }]}
              />
            )}
          </div>
        )}
      </div>
    </Seccion>
  )
}

export function PacienteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { sesion } = useAuth()
  const accesoClinico = puede(sesion, 'clinico')
  const [paciente, setPaciente] = useState<PacienteResponse | null>(null)
  const [citas, setCitas] = useState<CitaResponse[]>([])
  const [consultas, setConsultas] = useState<ConsultaResponse[]>([])
  const [facturas, setFacturas] = useState<FacturaResponse[]>([])
  const [cargando, setCargando] = useState(true)
  const [dialogEditarAbierto, setDialogEditarAbierto] = useState(false)
  const [dialogCitaAbierto, setDialogCitaAbierto] = useState(false)
  const [dialogFacturaAbierto, setDialogFacturaAbierto] = useState(false)
  const [confirmarDesactivar, setConfirmarDesactivar] = useState(false)
  const [actualizandoActivo, setActualizandoActivo] = useState(false)

  async function cargar() {
    if (!id) return
    try {
      const [pacienteData, citasData, facturasData, consultasData] = await Promise.all([
        apiFetch<PacienteResponse>(`/api/v1/pacientes/${id}`),
        apiFetch<CitaResponse[]>('/api/v1/citas'),
        apiFetch<FacturaResponse[]>('/api/v1/facturas'),
        // la recepcion no lee notas clinicas: ve citas y facturas, no consultas
        accesoClinico ? apiFetch<ConsultaResponse[]>(`/api/v1/consultas/por-paciente/${id}`) : Promise.resolve([]),
      ])
      setPaciente(pacienteData)
      setCitas(citasData.filter((c) => c.pacienteId === id).sort((a, b) => b.fechaHora.localeCompare(a.fechaHora)))
      setFacturas(facturasData.filter((f) => f.pacienteId === id))
      setConsultas(consultasData)
    } catch {
      toast.error('No se pudo cargar el paciente')
      navigate('/pacientes')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    setCargando(true)
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const consultaPorCita = useMemo(() => Object.fromEntries(consultas.map((c) => [c.citaId, c])), [consultas])

  async function cambiarActivo(activo: boolean) {
    if (!id) return
    setActualizandoActivo(true)
    try {
      await apiFetch(`/api/v1/pacientes/${id}/activo`, { method: 'PATCH', body: { activo } })
      toast.success(activo ? 'Paciente activado' : 'Paciente desactivado')
      await cargar()
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? (err.body?.message ?? 'No se pudo actualizar el paciente') : 'No se pudo conectar con el servidor')
    } finally {
      setActualizandoActivo(false)
      setConfirmarDesactivar(false)
    }
  }

  if (cargando || !paciente) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-14 w-72" />
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <Skeleton className="h-80" />
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  const edad = edadDe(paciente.fechaNacimiento)
  const ultima = consultas[0]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        inicio={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild aria-label="Volver a pacientes" className="-ml-2">
              <Link to="/pacientes">
                <ArrowLeft />
              </Link>
            </Button>
            <CodigoPaciente id={paciente.id} tamano="lg" />
          </div>
        }
        titulo={paciente.nombre}
        descripcion={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span>{[edadLegible(paciente.fechaNacimiento), paciente.documentoIdentidad ?? 'Sin documento registrado'].filter(Boolean).join(' · ')}</span>
            <EstadoChip estado={paciente.activo ? 'ACTIVO' : 'INACTIVO'} />
          </span>
        }
        acciones={
          <>
            <Button variant="outline" onClick={() => setDialogFacturaAbierto(true)}>
              <Receipt />
              Nueva factura
            </Button>
            <Button variant="outline" onClick={() => setDialogEditarAbierto(true)}>
              <Pencil />
              Editar
            </Button>
            <Button variant="outline" disabled={actualizandoActivo} onClick={() => (paciente.activo ? setConfirmarDesactivar(true) : cambiarActivo(true))}>
              {paciente.activo ? 'Desactivar' : 'Activar'}
            </Button>
            <Button onClick={() => setDialogCitaAbierto(true)}>
              <CalendarPlus />
              Nueva cita
            </Button>
          </>
        }
      />

      <AlertaAlergias alergias={paciente.alergias} />

      <div className="grid items-start gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="flex flex-col gap-4 rounded-lg border bg-card p-5 text-sm lg:sticky lg:top-20">
          <h2 className="text-[0.9375rem] font-semibold text-tinta">Datos del paciente</h2>
          <Dato etiqueta="Fecha de nacimiento" valor={paciente.fechaNacimiento ? `${fechaLarga(paciente.fechaNacimiento)} (${edadLegible(paciente.fechaNacimiento)})` : null} />
          <div className="grid grid-cols-2 gap-3 border-b pb-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Sexo</p>
              <p className="mt-0.5">{paciente.sexo === 'F' ? 'Femenino' : paciente.sexo === 'M' ? 'Masculino' : '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Tipo de sangre</p>
              <p className="mt-0.5 inline-flex items-center gap-1">
                {paciente.tipoSangre ? (
                  <>
                    <Droplet className="size-3.5 text-destructive" />
                    <span className="font-semibold">{paciente.tipoSangre}</span>
                  </>
                ) : (
                  '—'
                )}
              </p>
            </div>
          </div>
          {!tieneAlergias(paciente.alergias) && <Dato etiqueta="Alergias" valor={paciente.alergias || 'Sin alergias registradas'} />}
          <Dato etiqueta="Antecedentes" valor={paciente.antecedentes} />
          <Dato etiqueta="Medicamentos actuales" valor={paciente.medicamentosActuales} />
          <Dato etiqueta="Teléfono" valor={paciente.telefono} />
          <Dato etiqueta="Email" valor={paciente.email} />
          <Dato etiqueta="Dirección" valor={paciente.direccion} />
        </div>

        <div className="flex min-w-0 flex-col gap-8">
          {accesoClinico && ultima && (
            <Seccion titulo="Última consulta" accion={<span className="text-xs text-muted-foreground">{fechaLarga(ultima.citaFechaHora)}</span>}>
              <div className="flex flex-col gap-4 rounded-lg border bg-card p-4 sm:p-5">
                <SignosLibro consulta={ultima} edad={edad} compacto />
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="mb-1.5 text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">Diagnóstico</p>
                    <ListaDiagnosticos consulta={ultima} />
                    {!ultima.diagnosticos.length && !ultima.diagnostico && <p className="text-sm text-muted-foreground">Sin diagnóstico registrado</p>}
                  </div>
                  <div>
                    <p className="mb-1.5 text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">Tratamiento</p>
                    <ListaReceta consulta={ultima} />
                    {!ultima.recetaItems.length && !ultima.receta && <p className="text-sm text-muted-foreground">Sin receta</p>}
                  </div>
                </div>
                {ultima.proximoControl && <p className="text-sm text-info">Próximo control indicado: {fechaLarga(ultima.proximoControl)}</p>}
              </div>
            </Seccion>
          )}

          {accesoClinico && <Evolucion consultas={consultas} />}

          <Seccion titulo={accesoClinico ? 'Historial clínico' : 'Citas'}>
            <div className="rounded-lg border bg-card">
              {citas.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-muted-foreground">Este paciente no tiene citas registradas.</p>
              ) : (
                <ol className="divide-y">
                  {citas.map((cita) => {
                    const consulta = consultaPorCita[cita.id]
                    const dx = consulta?.diagnosticos[0]
                    const contenido = (
                      <>
                        <div className="w-24 shrink-0 tabular-nums">
                          <p className="text-sm font-medium text-tinta">{fechaCorta(cita.fechaHora)}</p>
                          <p className="text-xs text-muted-foreground">{fechaHora(cita.fechaHora).split(',').at(-1)?.trim()}</p>
                        </div>
                        <div className="min-w-0 flex-1">
                          {consulta ? (
                            <>
                              <p className="truncate text-sm text-tinta">
                                {dx ? (
                                  <>
                                    {dx.codigo && <span className="mr-2 font-mono text-xs font-semibold text-info">{dx.codigo}</span>}
                                    {dx.descripcion}
                                  </>
                                ) : (
                                  (consulta.diagnostico ?? consulta.motivoConsulta ?? 'Consulta registrada')
                                )}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {cita.doctorNombre}
                                {consulta.recetaItems.length > 0 && ` · ${consulta.recetaItems.map((r) => r.medicamento).join(', ')}`}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="truncate text-sm text-tinta">{cita.motivo ?? 'Sin motivo registrado'}</p>
                              <p className="text-xs text-muted-foreground">{cita.doctorNombre}</p>
                            </>
                          )}
                        </div>
                        <EstadoChip estado={cita.estado} className="hidden sm:inline-flex" />
                        {accesoClinico && <ChevronRight className="size-4 shrink-0 text-muted-foreground" />}
                      </>
                    )
                    return (
                      <li key={cita.id}>
                        {accesoClinico ? (
                          <Link to={`/atencion/${cita.id}`} className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-accent/50 sm:px-5">
                            {contenido}
                          </Link>
                        ) : (
                          <div className="flex items-center gap-4 px-4 py-3 sm:px-5">{contenido}</div>
                        )}
                      </li>
                    )
                  })}
                </ol>
              )}
            </div>
            {accesoClinico && citas.length > 0 && !consultas.length && (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Stethoscope className="size-3.5" />
                Abrí una cita para registrar la consulta con signos vitales, diagnóstico y receta.
              </p>
            )}
          </Seccion>

          <Seccion titulo="Facturas">
            <div className="overflow-x-auto rounded-lg border bg-card">
              {facturas.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-muted-foreground">Este paciente no tiene facturas registradas.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {facturas.map((factura) => (
                      <TableRow key={factura.id}>
                        <TableCell>{fechaCorta(factura.creadoEn)}</TableCell>
                        <TableCell>{factura.tipoDte === 'FE' ? 'Electrónica' : 'Interna'}</TableCell>
                        <TableCell className="text-right">${factura.total.toFixed(2)}</TableCell>
                        <TableCell>
                          <EstadoChip estado={factura.estado} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => abrirImpresionFactura(factura.id)}>
                            Imprimir
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </Seccion>
        </div>
      </div>

      <PacienteFormDialog
        open={dialogEditarAbierto}
        onOpenChange={setDialogEditarAbierto}
        paciente={paciente}
        onGuardado={() => {
          setDialogEditarAbierto(false)
          cargar()
        }}
      />

      <CitaFormDialog
        open={dialogCitaAbierto}
        onOpenChange={setDialogCitaAbierto}
        prefill={{ pacienteId: paciente.id }}
        onGuardado={() => {
          setDialogCitaAbierto(false)
          cargar()
        }}
      />

      <FacturaFormDialog
        open={dialogFacturaAbierto}
        onOpenChange={setDialogFacturaAbierto}
        pacientePreseleccionado={paciente.id}
        onGuardado={() => {
          setDialogFacturaAbierto(false)
          cargar()
        }}
      />

      <AlertDialog open={confirmarDesactivar} onOpenChange={setConfirmarDesactivar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desactivar a {paciente.nombre}</AlertDialogTitle>
            <AlertDialogDescription>El paciente quedará marcado como inactivo. Podés reactivarlo en cualquier momento.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => cambiarActivo(false)}>Desactivar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

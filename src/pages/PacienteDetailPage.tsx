import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { apiFetch, ApiRequestError } from '@/lib/api'
import type { CitaResponse, ConsultaResponse, FacturaResponse, PacienteResponse } from '@/types'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/page-header'
import { CodigoPaciente } from '@/components/codigo-paciente'
import { EstadoChip } from '@/components/estado-chip'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PacienteFormDialog } from '@/components/pacientes/paciente-form-dialog'
import { CitaFormDialog } from '@/components/agenda/cita-form-dialog'
import { FacturaFormDialog } from '@/components/facturas/factura-form-dialog'
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
import { abrirImpresionFactura } from '@/components/facturas/factura-form-dialog'
import { toast } from 'sonner'
import { AlertTriangle, ArrowLeft, CalendarPlus, FileText, Pencil, Receipt } from 'lucide-react'

function fechaNacimientoLegible(iso: string | null) {
  if (!iso) return null
  const [anio, mes, dia] = iso.split('-').map(Number)
  const nacimiento = new Date(anio, mes - 1, dia)
  const hoy = new Date()
  let edad = hoy.getFullYear() - anio
  if (hoy < new Date(hoy.getFullYear(), mes - 1, dia)) edad -= 1
  const fecha = nacimiento.toLocaleDateString('es-SV', { day: 'numeric', month: 'long', year: 'numeric' })
  return `${fecha} (${edad} ${edad === 1 ? 'año' : 'años'})`
}

// "Ninguna", "No", "Niega"... no ameritan la alerta roja de alergias.
function tieneAlergias(texto: string | null) {
  if (!texto) return false
  return !/^\s*(ninguna|ninguno|no|niega|n\/a|sin alergias)\b/i.test(texto)
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string | null }) {
  return (
    <div className="border-b pb-3 last:border-b-0 last:pb-0">
      <p className="text-xs font-medium text-muted-foreground">{etiqueta}</p>
      <p className="mt-0.5 whitespace-pre-wrap text-foreground">{valor || '-'}</p>
    </div>
  )
}

export function PacienteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [paciente, setPaciente] = useState<PacienteResponse | null>(null)
  const [citas, setCitas] = useState<CitaResponse[]>([])
  const [consultasPorCita, setConsultasPorCita] = useState<Record<string, ConsultaResponse>>({})
  const [facturas, setFacturas] = useState<FacturaResponse[]>([])
  const [cargando, setCargando] = useState(true)
  const [dialogEditarAbierto, setDialogEditarAbierto] = useState(false)
  const [dialogCitaAbierto, setDialogCitaAbierto] = useState(false)
  const [dialogFacturaAbierto, setDialogFacturaAbierto] = useState(false)
  const [confirmarDesactivar, setConfirmarDesactivar] = useState(false)
  const [actualizandoActivo, setActualizandoActivo] = useState(false)

  async function cargar() {
    if (!id) return
    setCargando(true)
    try {
      const [pacienteData, citasData, facturasData] = await Promise.all([
        apiFetch<PacienteResponse>(`/api/v1/pacientes/${id}`),
        apiFetch<CitaResponse[]>('/api/v1/citas'),
        apiFetch<FacturaResponse[]>('/api/v1/facturas'),
      ])
      setPaciente(pacienteData)
      const citasPaciente = citasData
        .filter((c) => c.pacienteId === id)
        .sort((a, b) => b.fechaHora.localeCompare(a.fechaHora))
      setCitas(citasPaciente)
      setFacturas(facturasData.filter((f) => f.pacienteId === id))

      const completadas = citasPaciente.filter((c) => c.estado === 'COMPLETADA')
      const consultas = await Promise.all(
        completadas.map((c) =>
          apiFetch<ConsultaResponse>(`/api/v1/consultas/por-cita/${c.id}`).catch(() => null),
        ),
      )
      const mapa: Record<string, ConsultaResponse> = {}
      completadas.forEach((c, i) => {
        const consulta = consultas[i]
        if (consulta) mapa[c.id] = consulta
      })
      setConsultasPorCita(mapa)
    } catch {
      toast.error('No se pudo cargar el paciente')
      navigate('/pacientes')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function cambiarActivo(activo: boolean) {
    if (!id) return
    setActualizandoActivo(true)
    try {
      await apiFetch(`/api/v1/pacientes/${id}/activo`, { method: 'PATCH', body: { activo } })
      toast.success(activo ? 'Paciente activado' : 'Paciente desactivado')
      await cargar()
    } catch (err) {
      if (err instanceof ApiRequestError) {
        toast.error(err.body?.message ?? 'No se pudo actualizar el paciente')
      } else {
        toast.error('No se pudo conectar con el servidor')
      }
    } finally {
      setActualizandoActivo(false)
      setConfirmarDesactivar(false)
    }
  }

  if (cargando || !paciente) {
    return <p className="text-sm text-muted-foreground">Cargando...</p>
  }

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
            <span>{paciente.documentoIdentidad ?? 'Sin documento registrado'}</span>
            <EstadoChip estado={paciente.activo ? 'ACTIVO' : 'INACTIVO'} />
          </span>
        }
        acciones={
          <>
        <Button variant="outline" onClick={() => setDialogFacturaAbierto(true)}>
          <Receipt />
          Nueva factura
        </Button>
        <Button variant="outline" onClick={() => setDialogCitaAbierto(true)}>
          <CalendarPlus />
          Nueva cita
        </Button>
        <Button variant="outline" onClick={() => setDialogEditarAbierto(true)}>
          <Pencil />
          Editar
        </Button>
        <Button
          variant="outline"
          disabled={actualizandoActivo}
          onClick={() => (paciente.activo ? setConfirmarDesactivar(true) : cambiarActivo(true))}
        >
          {paciente.activo ? 'Desactivar' : 'Activar'}
        </Button>
          </>
        }
      />

      {tieneAlergias(paciente.alergias) && (
        <div role="note" className="flex items-start gap-3 rounded-lg bg-peligro-suave px-4 py-3 text-destructive ring-1 ring-destructive/25 ring-inset">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">Alergias</p>
            <p className="text-sm">{paciente.alergias}</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="min-w-0 md:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Datos del paciente</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <Dato etiqueta="Fecha de nacimiento" valor={fechaNacimientoLegible(paciente.fechaNacimiento)} />
            <Dato etiqueta="Sexo" valor={paciente.sexo === 'F' ? 'Femenino' : paciente.sexo === 'M' ? 'Masculino' : null} />
            {!tieneAlergias(paciente.alergias) && <Dato etiqueta="Alergias" valor={paciente.alergias || 'Sin alergias registradas'} />}
            <Dato etiqueta="Teléfono" valor={paciente.telefono} />
            <Dato etiqueta="Email" valor={paciente.email} />
            <Dato etiqueta="Dirección" valor={paciente.direccion} />
            <Dato etiqueta="Antecedentes" valor={paciente.antecedentes} />
          </CardContent>
        </Card>

        <div className="flex min-w-0 flex-col gap-6 md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historial clínico</CardTitle>
            </CardHeader>
            <CardContent>
              {citas.length === 0 ? (
                <p className="text-sm text-muted-foreground">Este paciente no tiene citas registradas.</p>
              ) : (
                <div className="flex flex-col">
                  {citas.map((cita, i) => {
                    const consulta = consultasPorCita[cita.id]
                    return (
                      <div
                        key={cita.id}
                        className={i > 0 ? 'border-t pt-4 mt-4' : ''}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium">
                              {new Date(cita.fechaHora).toLocaleString('es-SV', {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {cita.doctorNombre}
                              {cita.motivo ? ` · ${cita.motivo}` : ''}
                            </p>
                          </div>
                          <EstadoChip estado={cita.estado} />
                        </div>

                        {consulta && (
                          <div className="mt-3 flex flex-col gap-2 rounded-md bg-carton/70 p-3 text-sm">
                            {consulta.diagnostico && (
                              <div className="flex items-start gap-2">
                                <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                                <div>
                                  <span className="font-medium">Diagnóstico: </span>
                                  <span className="whitespace-pre-wrap">{consulta.diagnostico}</span>
                                </div>
                              </div>
                            )}
                            {consulta.receta && (
                              <div className="pl-6">
                                <span className="font-medium">Receta: </span>
                                <span className="whitespace-pre-wrap">{consulta.receta}</span>
                              </div>
                            )}
                            {consulta.notas && (
                              <div className="pl-6 text-muted-foreground">
                                <span className="font-medium">Notas: </span>
                                <span className="whitespace-pre-wrap">{consulta.notas}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Facturas</CardTitle>
            </CardHeader>
            <CardContent>
              {facturas.length === 0 ? (
                <p className="text-sm text-muted-foreground">Este paciente no tiene facturas registradas.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {facturas.map((factura) => (
                      <TableRow key={factura.id}>
                        <TableCell>{new Date(factura.creadoEn).toLocaleDateString('es-SV')}</TableCell>
                        <TableCell>{factura.tipoDte === 'FE' ? 'Electrónica' : 'Simple'}</TableCell>
                        <TableCell>${factura.total.toFixed(2)}</TableCell>
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
            </CardContent>
          </Card>
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
            <AlertDialogDescription>
              El paciente quedará marcado como inactivo. Podés reactivarlo en cualquier momento.
            </AlertDialogDescription>
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

import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { apiFetch } from '@/lib/api'
import type { CitaResponse, FacturaResponse, PacienteResponse } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PacienteFormDialog } from '@/components/pacientes/paciente-form-dialog'
import { toast } from 'sonner'
import { ArrowLeft, Pencil } from 'lucide-react'

const VARIANTE_ESTADO_CITA: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PROGRAMADA: 'outline',
  CONFIRMADA: 'default',
  COMPLETADA: 'secondary',
  CANCELADA: 'destructive',
  NO_ASISTIO: 'destructive',
}

const VARIANTE_ESTADO_FACTURA: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PENDIENTE: 'outline',
  EMITIDA: 'default',
  RECHAZADA: 'destructive',
  ANULADA: 'secondary',
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{etiqueta}</p>
      <p className="whitespace-pre-wrap">{valor || '-'}</p>
    </div>
  )
}

export function PacienteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [paciente, setPaciente] = useState<PacienteResponse | null>(null)
  const [citas, setCitas] = useState<CitaResponse[]>([])
  const [facturas, setFacturas] = useState<FacturaResponse[]>([])
  const [cargando, setCargando] = useState(true)
  const [dialogEditarAbierto, setDialogEditarAbierto] = useState(false)

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
      setCitas(
        citasData
          .filter((c) => c.pacienteId === id)
          .sort((a, b) => b.fechaHora.localeCompare(a.fechaHora)),
      )
      setFacturas(facturasData.filter((f) => f.pacienteId === id))
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

  if (cargando || !paciente) {
    return <p className="text-sm text-muted-foreground">Cargando...</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/pacientes">
            <ArrowLeft />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{paciente.nombre}</h1>
          <p className="text-sm text-muted-foreground">
            {paciente.documentoIdentidad ?? 'Sin documento registrado'}
          </p>
        </div>
        <Button variant="outline" onClick={() => setDialogEditarAbierto(true)}>
          <Pencil />
          Editar
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Datos del paciente</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <Dato etiqueta="Fecha de nacimiento" valor={paciente.fechaNacimiento} />
            <Dato etiqueta="Telefono" valor={paciente.telefono} />
            <Dato etiqueta="Email" valor={paciente.email} />
            <Dato etiqueta="Direccion" valor={paciente.direccion} />
            <Dato etiqueta="Alergias" valor={paciente.alergias} />
            <Dato etiqueta="Antecedentes" valor={paciente.antecedentes} />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6 md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historial de citas</CardTitle>
            </CardHeader>
            <CardContent>
              {citas.length === 0 ? (
                <p className="text-sm text-muted-foreground">Este paciente no tiene citas registradas.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {citas.map((cita) => (
                      <TableRow key={cita.id}>
                        <TableCell>
                          {new Date(cita.fechaHora).toLocaleString('es-SV', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </TableCell>
                        <TableCell>{cita.doctorNombre}</TableCell>
                        <TableCell className="max-w-40 truncate">{cita.motivo ?? '-'}</TableCell>
                        <TableCell>
                          <Badge variant={VARIANTE_ESTADO_CITA[cita.estado] ?? 'outline'}>{cita.estado}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {facturas.map((factura) => (
                      <TableRow key={factura.id}>
                        <TableCell>{new Date(factura.creadoEn).toLocaleDateString('es-SV')}</TableCell>
                        <TableCell>{factura.tipoDte === 'FE' ? 'Electronica' : 'Simple'}</TableCell>
                        <TableCell>${factura.total.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={VARIANTE_ESTADO_FACTURA[factura.estado] ?? 'outline'}>
                            {factura.estado}
                          </Badge>
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
    </div>
  )
}

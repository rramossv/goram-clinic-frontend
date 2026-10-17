import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiFetch, ApiRequestError } from '@/lib/api'
import { puede, useAuth } from '@/lib/auth-context'
import type { CitaResponse } from '@/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CodigoPaciente } from '@/components/codigo-paciente'
import { etiquetaEstado } from '@/components/estado-chip'
import { CitaFormDialog } from '@/components/agenda/cita-form-dialog'
import { FacturaFormDialog } from '@/components/facturas/factura-form-dialog'
import { toast } from 'sonner'
import { CalendarClock, FileText, Mail, MailCheck, Receipt, UserRound } from 'lucide-react'

const ESTADOS = ['PROGRAMADA', 'CONFIRMADA', 'COMPLETADA', 'CANCELADA', 'NO_ASISTIO']

interface CitaDetailDialogProps {
  cita: CitaResponse | null
  onOpenChange: (open: boolean) => void
  onActualizada: () => void
}

function Fila({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b py-2.5 last:border-b-0">
      <span className="text-muted-foreground">{etiqueta}</span>
      <span className="text-right text-foreground">{children}</span>
    </div>
  )
}

export function CitaDetailDialog({ cita, onOpenChange, onActualizada }: CitaDetailDialogProps) {
  const { sesion } = useAuth()
  const accesoClinico = puede(sesion, 'clinico')
  const navigate = useNavigate()
  const [citaActiva, setCitaActiva] = useState<CitaResponse | null>(null)
  const [reprogramarAbierto, setReprogramarAbierto] = useState(false)
  const [facturarAbierto, setFacturarAbierto] = useState(false)
  const [actualizando, setActualizando] = useState(false)
  const [enviandoRecordatorio, setEnviandoRecordatorio] = useState(false)

  const porAtender = cita && ['PROGRAMADA', 'CONFIRMADA'].includes(cita.estado)

  async function cambiarEstado(estado: string) {
    if (!cita || estado === cita.estado) return
    setActualizando(true)
    try {
      await apiFetch(`/api/v1/citas/${cita.id}/estado`, { method: 'PATCH', body: { estado } })
      toast.success(`Cita marcada como ${etiquetaEstado(estado).toLowerCase()}`)
      onActualizada()
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? (err.body?.message ?? 'No se pudo cambiar el estado') : 'No se pudo conectar con el servidor')
    } finally {
      setActualizando(false)
    }
  }

  // Cierra el detalle y abre la siguiente accion con la misma cita.
  function abrir(accion: 'consulta' | 'reprogramar' | 'facturar') {
    if (!cita) return
    setCitaActiva(cita)
    onOpenChange(false)
    if (accion === 'consulta') navigate(`/atencion/${cita.id}`)
    if (accion === 'reprogramar') setReprogramarAbierto(true)
    if (accion === 'facturar') setFacturarAbierto(true)
  }

  async function enviarRecordatorio() {
    if (!cita) return
    setEnviandoRecordatorio(true)
    try {
      await apiFetch(`/api/v1/citas/${cita.id}/recordatorio`, { method: 'POST' })
      toast.success('Recordatorio enviado')
      onActualizada()
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? (err.body?.message ?? 'No se pudo enviar el recordatorio') : 'No se pudo conectar con el servidor')
    } finally {
      setEnviandoRecordatorio(false)
    }
  }

  return (
    <>
      <Dialog open={cita !== null} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5">
              {cita && <CodigoPaciente id={cita.pacienteId} />}
              {cita?.pacienteNombre}
            </DialogTitle>
            <DialogDescription className="first-letter:uppercase">
              {cita && new Date(cita.fechaHora).toLocaleString('es-SV', { dateStyle: 'full', timeStyle: 'short' })}
            </DialogDescription>
          </DialogHeader>

          <div className="py-1 text-sm">
            <Fila etiqueta="Doctor">{cita?.doctorNombre}</Fila>
            <Fila etiqueta="Duración">{cita?.duracionMinutos} min</Fila>
            {cita?.motivo && <Fila etiqueta="Motivo">{cita.motivo}</Fila>}
            <Fila etiqueta="Estado">
              <Select value={cita?.estado} onValueChange={cambiarEstado} disabled={actualizando}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS.map((estado) => (
                    <SelectItem key={estado} value={estado}>
                      {etiquetaEstado(estado)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Fila>
            <Fila etiqueta="Recordatorio">
              <span className="inline-flex items-center gap-1.5">
                {cita?.recordatorioEnviado ? <MailCheck className="size-4 text-exito" /> : <Mail className="size-4 text-muted-foreground" />}
                {cita?.recordatorioEnviado ? 'Enviado' : 'Pendiente'}
                <Button variant="link" size="sm" className="h-auto px-1" onClick={enviarRecordatorio} disabled={enviandoRecordatorio}>
                  {cita?.recordatorioEnviado ? 'Reenviar' : 'Enviar'}
                </Button>
              </span>
            </Fila>
          </div>

          <DialogFooter className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
            <Button variant="outline" asChild>
              <Link to={`/pacientes/${cita?.pacienteId}`} onClick={() => onOpenChange(false)}>
                <UserRound />
                Ver ficha
              </Link>
            </Button>
            {porAtender && (
              <Button variant="outline" onClick={() => abrir('reprogramar')}>
                <CalendarClock />
                Reprogramar
              </Button>
            )}
            <Button variant="outline" onClick={() => abrir('facturar')}>
              <Receipt />
              Facturar
            </Button>
            {accesoClinico && (
              <Button onClick={() => abrir('consulta')}>
                <FileText />
                {cita?.estado === 'COMPLETADA' ? 'Ver consulta' : 'Atender'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CitaFormDialog
        open={reprogramarAbierto}
        onOpenChange={setReprogramarAbierto}
        cita={citaActiva}
        onGuardado={() => {
          setReprogramarAbierto(false)
          onActualizada()
        }}
      />
      <FacturaFormDialog
        open={facturarAbierto}
        onOpenChange={setFacturarAbierto}
        pacientePreseleccionado={citaActiva?.pacienteId}
        onGuardado={() => {
          setFacturarAbierto(false)
          onActualizada()
        }}
      />
    </>
  )
}

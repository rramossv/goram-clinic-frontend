import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { atiendePacientes, type CitaResponse, type UsuarioResumen } from '@/types'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/page-header'
import { DayCalendar } from '@/components/agenda/day-calendar'
import { CitaFormDialog } from '@/components/agenda/cita-form-dialog'
import { CitaDetailDialog } from '@/components/agenda/cita-detail-dialog'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'

function inicioDelDia(fecha: Date) {
  const copia = new Date(fecha)
  copia.setHours(0, 0, 0, 0)
  return copia
}

function formatoFechaLarga(fecha: Date) {
  return fecha.toLocaleDateString('es-SV', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function AgendaPage() {
  const [fecha, setFecha] = useState(() => inicioDelDia(new Date()))
  const [citas, setCitas] = useState<CitaResponse[]>([])
  const [doctores, setDoctores] = useState<UsuarioResumen[]>([])
  const [cargando, setCargando] = useState(true)
  const [dialogCrearAbierto, setDialogCrearAbierto] = useState(false)
  const [prefill, setPrefill] = useState<{ doctorId: string; fechaHora: Date } | null>(null)
  const [citaDetalle, setCitaDetalle] = useState<CitaResponse | null>(null)

  async function cargar() {
    setCargando(true)
    try {
      const [citasData, usuariosData] = await Promise.all([
        apiFetch<CitaResponse[]>('/api/v1/citas'),
        apiFetch<UsuarioResumen[]>('/api/v1/usuarios'),
      ])
      setCitas(citasData)
      setDoctores(usuariosData.filter((u) => u.activo && atiendePacientes(u)))
    } catch {
      toast.error('No se pudo cargar la agenda')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  function irDiaAnterior() {
    setFecha((actual) => {
      const nueva = new Date(actual)
      nueva.setDate(nueva.getDate() - 1)
      return nueva
    })
  }

  function irDiaSiguiente() {
    setFecha((actual) => {
      const nueva = new Date(actual)
      nueva.setDate(nueva.getDate() + 1)
      return nueva
    })
  }

  function irHoy() {
    setFecha(inicioDelDia(new Date()))
  }

  function abrirNuevaCitaGeneral() {
    setPrefill(null)
    setDialogCrearAbierto(true)
  }

  function abrirCeldaVacia(doctorId: string, fechaHora: Date) {
    setPrefill({ doctorId, fechaHora })
    setDialogCrearAbierto(true)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo="Agenda"
        descripcion={<span className="first-letter:uppercase">{formatoFechaLarga(fecha)}</span>}
        acciones={
        <>
          <Button variant="outline" size="icon" aria-label="Día anterior" onClick={irDiaAnterior}>
            <ChevronLeft />
          </Button>
          <Button variant="outline" onClick={irHoy}>
            Hoy
          </Button>
          <Button variant="outline" size="icon" aria-label="Día siguiente" onClick={irDiaSiguiente}>
            <ChevronRight />
          </Button>
          <Button onClick={abrirNuevaCitaGeneral}>
            <Plus />
            Nueva cita
          </Button>
        </>
        }
      />

      {!cargando && (
        <DayCalendar
          fecha={fecha}
          doctores={doctores}
          citas={citas}
          onCeldaVacia={abrirCeldaVacia}
          onCita={setCitaDetalle}
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

      <CitaDetailDialog
        cita={citaDetalle}
        onOpenChange={(open) => !open && setCitaDetalle(null)}
        onActualizada={cargar}
      />
    </div>
  )
}

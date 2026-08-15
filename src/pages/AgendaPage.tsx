import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import type { CitaResponse, UsuarioResumen } from '@/types'
import { Button } from '@/components/ui/button'
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
      setDoctores(usuariosData.filter((u) => u.rol === 'DOCTOR'))
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
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Agenda</h1>
          <p className="text-sm text-muted-foreground capitalize">{formatoFechaLarga(fecha)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={irDiaAnterior}>
            <ChevronLeft />
          </Button>
          <Button variant="outline" onClick={irHoy}>
            Hoy
          </Button>
          <Button variant="outline" size="icon" onClick={irDiaSiguiente}>
            <ChevronRight />
          </Button>
          <Button onClick={abrirNuevaCitaGeneral}>
            <Plus />
            Nueva cita
          </Button>
        </div>
      </div>

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

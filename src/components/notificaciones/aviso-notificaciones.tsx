import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { activarPush, estadoPush, type EstadoPush } from '@/lib/push'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { BellRing, X } from 'lucide-react'

const CLAVE = 'goram_aviso_push_pospuesto'
const DIAS_POSPUESTO = 14

function pospuesto() {
  try {
    const hasta = Number(localStorage.getItem(CLAVE) ?? 0)
    return Date.now() < hasta
  } catch {
    return false
  }
}

/** Invitacion discreta (una vez, posponible) a recibir los avisos en este dispositivo. */
export function AvisoNotificaciones() {
  const { sesion } = useAuth()
  const [estado, setEstado] = useState<EstadoPush | null>(null)
  const [oculto, setOculto] = useState(pospuesto)
  const [ocupado, setOcupado] = useState(false)
  const esMedico = sesion?.rol === 'DOCTOR' || !!sesion?.atiendePacientes

  useEffect(() => {
    if (!esMedico || oculto) return
    estadoPush().then(setEstado).catch(() => {})
  }, [esMedico, oculto])

  if (!esMedico || oculto || (estado !== 'inactivo' && estado !== 'requiere-instalar')) return null

  function posponer() {
    setOculto(true)
    try {
      localStorage.setItem(CLAVE, String(Date.now() + DIAS_POSPUESTO * 86400000))
    } catch {
      // preferencia opcional
    }
  }

  return (
    <div className="border-b bg-info-suave/70 print:hidden">
      <div className="mx-auto flex max-w-[1320px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 md:px-8">
        <BellRing className="size-5 shrink-0 text-info" />
        <p className="min-w-0 flex-1 text-sm text-tinta">
          <span className="font-semibold">Que tu teléfono te avise de cada cita.</span>{' '}
          <span className="text-muted-foreground">Antes de cada paciente, cuando alguien llega y un resumen cada mañana.</span>
        </p>
        <div className="flex items-center gap-1.5">
          {estado === 'inactivo' ? (
            <Button
              size="sm"
              disabled={ocupado}
              onClick={async () => {
                setOcupado(true)
                try {
                  await activarPush()
                  toast.success('Listo: vas a recibir tus avisos en este dispositivo')
                  setOculto(true)
                } catch {
                  toast.error('No se activaron los avisos. Podés hacerlo después en Mi perfil.')
                } finally {
                  setOcupado(false)
                }
              }}
            >
              Activar avisos
            </Button>
          ) : (
            <Button size="sm" asChild>
              <Link to="/perfil#avisos">Cómo activarlos</Link>
            </Button>
          )}
          <Button size="icon-sm" variant="ghost" aria-label="Ahora no" onClick={posponer}>
            <X />
          </Button>
        </div>
      </div>
    </div>
  )
}

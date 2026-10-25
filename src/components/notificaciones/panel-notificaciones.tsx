import { useEffect, useState } from 'react'
import { apiFetch, ApiRequestError } from '@/lib/api'
import { activarPush, alCambiarInstalable, desactivarPush, esIOS, estadoPush, instalarApp, puedeInstalar, type EstadoPush } from '@/lib/push'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { BellOff, BellRing, CheckCircle2, Download, Send, Share, SquarePlus } from 'lucide-react'

interface Preferencias {
  avisoCitaMinutos: number
  avisoLlegada: boolean
  resumenDiario: boolean
  dispositivos: number
}

const MINUTOS = [
  [0, 'No avisar'],
  [5, '5 min antes'],
  [10, '10 min antes'],
  [15, '15 min antes'],
  [30, '30 min antes'],
  [60, '1 hora antes'],
] as const

function Interruptor({ activo, onChange, etiqueta, detalle }: { activo: boolean; onChange: (v: boolean) => void; etiqueta: string; detalle: string }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-3">
      <span>
        <span className="block text-sm font-medium text-tinta">{etiqueta}</span>
        <span className="block text-xs text-muted-foreground">{detalle}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={activo}
        onClick={() => onChange(!activo)}
        className={cn('relative mt-0.5 h-6 w-10 shrink-0 rounded-full transition-colors', activo ? 'bg-primary' : 'bg-input')}
      >
        <span className={cn('absolute top-0.5 left-0 size-5 rounded-full bg-background shadow transition-transform', activo ? 'translate-x-[1.125rem]' : 'translate-x-0.5')} />
      </button>
    </label>
  )
}

/** Avisos en el telefono: activacion por dispositivo y que avisar. */
export function PanelNotificaciones() {
  const [estado, setEstado] = useState<EstadoPush | null>(null)
  const [prefs, setPrefs] = useState<Preferencias | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [instalable, setInstalable] = useState(puedeInstalar())

  async function refrescar() {
    const [e, p] = await Promise.all([estadoPush(), apiFetch<Preferencias>('/api/v1/usuarios/me/notificaciones')])
    setEstado(e)
    setPrefs(p)
  }

  useEffect(() => {
    refrescar().catch(() => toast.error('No se pudo cargar la configuración de avisos'))
    return alCambiarInstalable(() => setInstalable(puedeInstalar()))
  }, [])

  async function activar() {
    setOcupado(true)
    try {
      await activarPush()
      await refrescar()
      toast.success('Avisos activados en este dispositivo')
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      toast.error(msg === 'bloqueado' ? 'El navegador bloqueó los avisos: habilitalos en la configuración del sitio' : msg === 'cancelado' ? 'No se activaron los avisos' : 'No se pudieron activar los avisos en este dispositivo')
      await refrescar()
    } finally {
      setOcupado(false)
    }
  }

  async function desactivar() {
    setOcupado(true)
    await desactivarPush()
    await refrescar()
    setOcupado(false)
    toast.success('Este dispositivo ya no recibirá avisos')
  }

  async function probar() {
    try {
      await apiFetch('/api/v1/push/prueba', { method: 'POST' })
      toast.success('Aviso de prueba enviado: debería aparecer en unos segundos')
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? (err.body?.message ?? 'No se pudo enviar') : 'No se pudo conectar con el servidor')
    }
  }

  async function guardar(cambios: Partial<Preferencias>) {
    if (!prefs) return
    const nuevas = { ...prefs, ...cambios }
    setPrefs(nuevas)
    try {
      setPrefs(await apiFetch<Preferencias>('/api/v1/usuarios/me/notificaciones', { method: 'PUT', body: nuevas }))
    } catch {
      setPrefs(prefs)
      toast.error('No se pudo guardar la preferencia')
    }
  }

  if (!estado || !prefs) return <Skeleton className="h-72 w-full" />

  return (
    <div className="grid gap-6 rounded-lg border bg-card p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-4">
        {estado === 'activo' && (
          <div className="flex items-start gap-3 rounded-lg bg-exito-suave px-4 py-3 text-exito ring-1 ring-exito/20 ring-inset">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Este dispositivo recibe tus avisos</p>
              <p className="text-xs">
                {prefs.dispositivos > 1 ? `También están activos en otros ${prefs.dispositivos - 1} dispositivos.` : 'Activalos también en tu teléfono para recibirlos donde estés.'}
              </p>
            </div>
          </div>
        )}
        {estado === 'inactivo' && (
          <div className="flex flex-col gap-3 rounded-lg bg-info-suave px-4 py-4 ring-1 ring-info/20 ring-inset">
            <p className="flex items-center gap-2 text-sm font-semibold text-info">
              <BellRing className="size-5" />
              Recibí tus citas en este dispositivo
            </p>
            <p className="text-sm text-tinta">Te avisamos antes de cada cita, cuando un paciente llega y cada mañana con el resumen del día, aunque la app esté cerrada.</p>
            <Button onClick={activar} disabled={ocupado} className="self-start">
              <BellRing />
              {ocupado ? 'Activando…' : 'Activar avisos'}
            </Button>
          </div>
        )}
        {estado === 'bloqueado' && (
          <div className="flex items-start gap-3 rounded-lg bg-aviso-suave px-4 py-3 text-aviso ring-1 ring-aviso/25 ring-inset">
            <BellOff className="mt-0.5 size-5 shrink-0" />
            <p className="text-sm">
              Los avisos están bloqueados para este sitio. Tocá el candado junto a la dirección, permití <strong>Notificaciones</strong> y recargá la página.
            </p>
          </div>
        )}
        {estado === 'requiere-instalar' && (
          <div className="flex flex-col gap-2 rounded-lg bg-info-suave px-4 py-4 text-sm text-tinta ring-1 ring-info/20 ring-inset">
            <p className="font-semibold text-info">En iPhone, primero instalá la app</p>
            <ol className="flex flex-col gap-1.5">
              <li className="flex items-center gap-2">
                1. Tocá <Share className="size-4 text-info" /> <strong>Compartir</strong> en Safari
              </li>
              <li className="flex items-center gap-2">
                2. Elegí <SquarePlus className="size-4 text-info" /> <strong>Agregar a inicio</strong>
              </li>
              <li>3. Abrí GoRam Clinic desde el ícono y activá los avisos aquí.</li>
            </ol>
          </div>
        )}
        {estado === 'no-soportado' && <p className="text-sm text-muted-foreground">Este navegador no permite avisos. Usá Chrome, Edge o Safari actualizados.</p>}

        <div className="flex flex-wrap gap-2">
          {estado === 'activo' && (
            <>
              <Button variant="outline" onClick={probar}>
                <Send />
                Enviar aviso de prueba
              </Button>
              <Button variant="ghost" onClick={desactivar} disabled={ocupado}>
                Desactivar en este dispositivo
              </Button>
            </>
          )}
          {instalable && (
            <Button
              variant="outline"
              onClick={async () => {
                if (await instalarApp()) toast.success('GoRam Clinic quedó instalada')
              }}
            >
              <Download />
              Instalar la app
            </Button>
          )}
        </div>
        {!esIOS() && estado !== 'requiere-instalar' && (
          <p className="text-xs text-muted-foreground">
            Consejo: instalá GoRam Clinic en tu teléfono (menú del navegador → <em>Instalar app</em> o <em>Agregar a pantalla de inicio</em>) para abrirla con un toque, como cualquier app.
          </p>
        )}
      </div>

      <div className="flex flex-col">
        <p className="mb-1 text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase">Qué te avisamos</p>
        <div className="flex items-start justify-between gap-4 border-b py-3">
          <span>
            <span className="block text-sm font-medium text-tinta">Antes de cada cita</span>
            <span className="block text-xs text-muted-foreground">Con el nombre del paciente y el motivo; al tocarlo abre su consulta.</span>
          </span>
          <select
            aria-label="Minutos antes de cada cita"
            value={prefs.avisoCitaMinutos}
            onChange={(e) => guardar({ avisoCitaMinutos: Number(e.target.value) })}
            className="h-9 shrink-0 rounded-md bg-background px-2 text-sm ring-1 ring-input outline-none focus:ring-2 focus:ring-ring"
          >
            {MINUTOS.map(([v, t]) => (
              <option key={v} value={v}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="border-b">
          <Interruptor activo={prefs.avisoLlegada} onChange={(v) => guardar({ avisoLlegada: v })} etiqueta="Cuando un paciente llega" detalle="La recepción lo marca en sala de espera y tu teléfono vibra." />
        </div>
        <Interruptor activo={prefs.resumenDiario} onChange={(v) => guardar({ resumenDiario: v })} etiqueta="Resumen de la mañana" detalle="A las 6:30 a. m.: cuántas citas tenés y con quién empezás." />
      </div>
    </div>
  )
}

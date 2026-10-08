import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { apiFetch, ApiRequestError } from '@/lib/api'
import { useAuth, type TipoPractica } from '@/lib/auth-context'
import type { PlanResponse } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Check, ChevronLeft, Stethoscope } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RegistroClinicaResponse {
  tenantId: string
  nombreClinica: string
  usuarioAdminId: string
  emailAdmin: string
  suscripcionId: string
  planCodigo: string
  estadoSuscripcion: string
}

// Un doctor solo elige entre Basico (sin DTE) y Consultorio (con DTE); los
// planes multi-usuario no tienen sentido para el. Y Consultorio no se ofrece a
// clinicas porque su limite de 2 usuarios no les alcanza.
const PLANES_INDIVIDUAL = ['BASICO', 'CONSULTORIO']
const PLAN_DEFECTO: Record<TipoPractica, string> = { INDIVIDUAL: 'CONSULTORIO', CLINICA: 'PROFESIONAL' }

const OPCIONES_TIPO = [
  {
    tipo: 'INDIVIDUAL' as const,
    icono: Stethoscope,
    titulo: 'Consultorio individual',
    descripcion: 'Soy medico y atiendo a mis propios pacientes, solo o con una asistente.',
  },
  {
    tipo: 'CLINICA' as const,
    icono: Building2,
    titulo: 'Clinica',
    descripcion: 'Varios doctores, recepcion y personal administrativo.',
  },
]

function tipoInicial(tipo: string | null, plan: string | null): TipoPractica | null {
  if (tipo === 'individual' || plan === 'CONSULTORIO') return 'INDIVIDUAL'
  if (tipo === 'clinica' || plan === 'PROFESIONAL' || plan === 'CLINICA') return 'CLINICA'
  return null
}

export function RegistroPage() {
  const { sesion, login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const planPreseleccionado = searchParams.get('plan')

  const [tipoPractica, setTipoPractica] = useState<TipoPractica | null>(() =>
    tipoInicial(searchParams.get('tipo'), planPreseleccionado),
  )
  const [planes, setPlanes] = useState<PlanResponse[]>([])
  const [cargandoPlanes, setCargandoPlanes] = useState(true)
  const [planCodigo, setPlanCodigo] = useState<string | null>(null)

  const [nombreClinica, setNombreClinica] = useState('')
  const [nit, setNit] = useState('')
  const [nrc, setNrc] = useState('')
  const [giro, setGiro] = useState('')
  const [nombreAdmin, setNombreAdmin] = useState('')
  const [adminAtiendePacientes, setAdminAtiendePacientes] = useState(false)
  const [emailAdmin, setEmailAdmin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    apiFetch<PlanResponse[]>('/api/v1/planes', { auth: false })
      .then(setPlanes)
      .catch(() => setError('No se pudieron cargar los planes. Intenta de nuevo mas tarde.'))
      .finally(() => setCargandoPlanes(false))
  }, [])

  const planesVisibles = useMemo(() => {
    if (!tipoPractica) return []
    return planes.filter((p) =>
      tipoPractica === 'INDIVIDUAL' ? PLANES_INDIVIDUAL.includes(p.codigo) : p.codigo !== 'CONSULTORIO',
    )
  }, [planes, tipoPractica])

  // Al cambiar de tipo, respeta el plan que venia en la URL si aplica a ese
  // tipo; si no, cae en el plan recomendado para ese tipo.
  useEffect(() => {
    if (!tipoPractica || planesVisibles.length === 0) return
    const codigos = planesVisibles.map((p) => p.codigo)
    if (planCodigo && codigos.includes(planCodigo)) return
    if (planPreseleccionado && codigos.includes(planPreseleccionado)) {
      setPlanCodigo(planPreseleccionado)
    } else {
      const defecto = PLAN_DEFECTO[tipoPractica]
      setPlanCodigo(codigos.includes(defecto) ? defecto : codigos[0])
    }
  }, [tipoPractica, planesVisibles])

  if (sesion) {
    return <Navigate to="/panel" replace />
  }

  const esIndividual = tipoPractica === 'INDIVIDUAL'

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!planCodigo || !tipoPractica) return
    setError(null)
    setEnviando(true)
    try {
      await apiFetch<RegistroClinicaResponse>('/api/v1/clinicas/registro', {
        method: 'POST',
        auth: false,
        body: {
          nombreClinica,
          nit,
          nrc: nrc || null,
          giro: giro || null,
          nombreAdmin,
          emailAdmin,
          password,
          planCodigo,
          tipoPractica,
          adminAtiendePacientes: esIndividual || adminAtiendePacientes,
        },
      })
      await login(emailAdmin, password)
      navigate('/panel', { replace: true })
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.body?.message ?? 'No se pudo completar el registro')
      } else {
        setError('No se pudo conectar con el servidor')
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4 py-10">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">
            {tipoPractica === null ? 'Crea tu cuenta' : esIndividual ? 'Registra tu consultorio' : 'Registra tu clinica'}
          </CardTitle>
          <CardDescription>
            {tipoPractica === null
              ? 'Primero contanos como trabajas, para mostrarte solo lo que necesitas.'
              : 'Crea tu espacio en GoRam Clinic y empieza a gestionar tus pacientes hoy mismo.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tipoPractica === null ? (
            <div className="flex flex-col gap-6">
              <div className="grid gap-3 sm:grid-cols-2">
                {OPCIONES_TIPO.map(({ tipo, icono: Icono, titulo, descripcion }) => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setTipoPractica(tipo)}
                    className="flex flex-col gap-3 rounded-lg border border-border p-5 text-left transition-colors hover:border-primary hover:bg-primary/5"
                  >
                    <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icono className="size-5" />
                    </div>
                    <span className="font-medium">{titulo}</span>
                    <span className="text-sm text-muted-foreground">{descripcion}</span>
                  </button>
                ))}
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Ya tenes cuenta?{' '}
                <Link to="/login" className="font-medium text-foreground underline underline-offset-4">
                  Inicia sesion
                </Link>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <button
                type="button"
                onClick={() => {
                  setTipoPractica(null)
                  setPlanCodigo(null)
                }}
                className="-mt-2 flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="size-4" />
                {esIndividual ? 'Consultorio individual' : 'Clinica'} · cambiar
              </button>

              <div className="flex flex-col gap-2">
                <Label>Elegi tu plan</Label>
                {cargandoPlanes ? (
                  <p className="text-sm text-muted-foreground">Cargando planes...</p>
                ) : (
                  <div className={cn('grid gap-3', planesVisibles.length > 2 ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
                    {planesVisibles.map((plan) => {
                      const seleccionado = plan.codigo === planCodigo
                      return (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() => setPlanCodigo(plan.codigo)}
                          className={cn(
                            'flex flex-col gap-1 rounded-lg border p-4 text-left transition-colors',
                            seleccionado ? 'border-primary ring-2 ring-primary' : 'border-border hover:border-primary/50',
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{plan.nombre}</span>
                            {seleccionado && <Check className="size-4 text-primary" />}
                          </div>
                          <span className="text-lg font-semibold">${plan.precioMensual.toFixed(2)}</span>
                          <span className="text-xs text-muted-foreground">al mes</span>
                          <span className="mt-1 text-xs text-muted-foreground">
                            {plan.incluyeFacturacionElectronica
                              ? 'Incluye facturacion electronica'
                              : 'Factura interna, sin facturacion electronica'}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <Label htmlFor="nombreClinica">{esIndividual ? 'Nombre del consultorio' : 'Nombre de la clinica'}</Label>
                  <Input
                    id="nombreClinica"
                    required
                    placeholder={esIndividual ? 'Ej. Consultorio Dra. Martinez' : 'Ej. Clinica San Rafael'}
                    value={nombreClinica}
                    onChange={(e) => setNombreClinica(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="nit">NIT</Label>
                  <Input id="nit" required value={nit} onChange={(e) => setNit(e.target.value)} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="nrc">NRC (opcional)</Label>
                  <Input id="nrc" value={nrc} onChange={(e) => setNrc(e.target.value)} />
                </div>
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <Label htmlFor="giro">Giro (opcional)</Label>
                  <Input id="giro" value={giro} onChange={(e) => setGiro(e.target.value)} />
                </div>
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <Label htmlFor="nombreAdmin">
                    {esIndividual ? 'Tu nombre, como aparecera en citas y recetas' : 'Tu nombre (administrador de la clinica)'}
                  </Label>
                  <Input
                    id="nombreAdmin"
                    required
                    placeholder={esIndividual ? 'Ej. Dra. Ana Martinez' : undefined}
                    value={nombreAdmin}
                    onChange={(e) => setNombreAdmin(e.target.value)}
                  />
                  {!esIndividual && (
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="size-4 accent-primary"
                        checked={adminAtiendePacientes}
                        onChange={(e) => setAdminAtiendePacientes(e.target.checked)}
                      />
                      Yo tambien atiendo pacientes
                    </label>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="emailAdmin">Correo</Label>
                  <Input
                    id="emailAdmin"
                    type="email"
                    required
                    value={emailAdmin}
                    onChange={(e) => setEmailAdmin(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="password">Contrasena</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" disabled={enviando || !planCodigo} size="lg">
                {enviando
                  ? esIndividual
                    ? 'Creando tu consultorio...'
                    : 'Creando tu clinica...'
                  : esIndividual
                    ? 'Crear mi consultorio'
                    : 'Crear mi clinica'}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Ya tenes cuenta?{' '}
                <Link to="/login" className="font-medium text-foreground underline underline-offset-4">
                  Inicia sesion
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

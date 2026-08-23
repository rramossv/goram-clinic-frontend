import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { apiFetch, ApiRequestError } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import type { PlanResponse } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check } from 'lucide-react'
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

export function RegistroPage() {
  const { sesion, login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const planPreseleccionado = searchParams.get('plan')

  const [planes, setPlanes] = useState<PlanResponse[]>([])
  const [cargandoPlanes, setCargandoPlanes] = useState(true)
  const [planCodigo, setPlanCodigo] = useState<string | null>(null)

  const [nombreClinica, setNombreClinica] = useState('')
  const [nit, setNit] = useState('')
  const [nrc, setNrc] = useState('')
  const [giro, setGiro] = useState('')
  const [nombreAdmin, setNombreAdmin] = useState('')
  const [emailAdmin, setEmailAdmin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    apiFetch<PlanResponse[]>('/api/v1/planes', { auth: false })
      .then((data) => {
        setPlanes(data)
        const preseleccionValido = data.some((p) => p.codigo === planPreseleccionado)
        if (preseleccionValido) {
          setPlanCodigo(planPreseleccionado)
        } else if (data.length > 0) {
          setPlanCodigo(data[0].codigo)
        }
      })
      .catch(() => setError('No se pudieron cargar los planes. Intenta de nuevo mas tarde.'))
      .finally(() => setCargandoPlanes(false))
  }, [])

  if (sesion) {
    return <Navigate to="/panel" replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!planCodigo) return
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
        },
      })
      await login(emailAdmin, password)
      navigate('/panel', { replace: true })
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.body?.message ?? 'No se pudo registrar la clinica')
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
          <CardTitle className="text-2xl">Registra tu clinica</CardTitle>
          <CardDescription>Crea tu espacio en GoRam Clinic y empieza a gestionar tus pacientes hoy mismo.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Label>Elegi tu plan</Label>
              {cargandoPlanes ? (
                <p className="text-sm text-muted-foreground">Cargando planes...</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-3">
                  {planes.map((plan) => {
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
                        {plan.incluyeFacturacionElectronica && (
                          <span className="mt-1 text-xs text-muted-foreground">Incluye facturacion electronica</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label htmlFor="nombreClinica">Nombre de la clinica</Label>
                <Input id="nombreClinica" required value={nombreClinica} onChange={(e) => setNombreClinica(e.target.value)} />
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
                <Label htmlFor="nombreAdmin">Tu nombre (administrador de la clinica)</Label>
                <Input id="nombreAdmin" required value={nombreAdmin} onChange={(e) => setNombreAdmin(e.target.value)} />
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
              {enviando ? 'Creando tu clinica...' : 'Crear mi clinica'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Ya tenes cuenta?{' '}
              <Link to="/login" className="font-medium text-foreground underline underline-offset-4">
                Inicia sesion
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

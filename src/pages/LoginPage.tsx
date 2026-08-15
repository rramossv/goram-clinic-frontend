import { useState, type FormEvent } from 'react'
import { useNavigate, Navigate, Link } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { ApiRequestError } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function LoginPage() {
  const { sesion, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [mostrarAyudaPassword, setMostrarAyudaPassword] = useState(false)

  if (sesion) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setEnviando(true)
    try {
      await login(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.body?.message ?? 'No se pudo iniciar sesion')
      } else {
        setError('No se pudo conectar con el servidor')
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>GoRam Clinic</CardTitle>
          <CardDescription>Ingresa a tu clinica</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Correo</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Contrasena</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setMostrarAyudaPassword((v) => !v)}
                className="self-start text-xs text-muted-foreground underline underline-offset-4"
              >
                Olvidaste tu contrasena?
              </button>
              {mostrarAyudaPassword && (
                <p className="text-xs text-muted-foreground">
                  El administrador de tu clinica puede restablecerla desde la seccion Personal. Si vos sos
                  el administrador y perdiste el acceso, escribinos a soporte para verificar tu identidad.
                </p>
              )}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={enviando} className="mt-2">
              {enviando ? 'Ingresando...' : 'Ingresar'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              No tenes cuenta?{' '}
              <Link to="/registro" className="font-medium text-foreground underline underline-offset-4">
                Registra tu clinica
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { apiFetch, ApiRequestError } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export function RestablecerPasswordPage() {
  const { sesion } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [passwordNueva, setPasswordNueva] = useState('')
  const [passwordConfirmar, setPasswordConfirmar] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  if (sesion) {
    return <Navigate to="/panel" replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (!token) {
      setError('El enlace no es valido. Solicita uno nuevo.')
      return
    }
    if (passwordNueva !== passwordConfirmar) {
      setError('La contrasena nueva y su confirmacion no coinciden')
      return
    }

    setEnviando(true)
    try {
      await apiFetch('/api/v1/auth/restablecer-password', {
        method: 'POST',
        auth: false,
        body: { token, passwordNueva },
      })
      toast.success('Contrasena actualizada, ya podes iniciar sesion')
      navigate('/login', { replace: true })
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.body?.message ?? 'No se pudo restablecer la contrasena')
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
          <CardTitle>Elegi una contrasena nueva</CardTitle>
          <CardDescription>El enlace vence 1 hora despues de haberlo solicitado.</CardDescription>
        </CardHeader>
        <CardContent>
          {!token ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-destructive">
                Este enlace no es valido. Solicita uno nuevo desde la pantalla de inicio de sesion.
              </p>
              <Link to="/olvide-password" className="text-sm font-medium underline underline-offset-4">
                Solicitar un enlace nuevo
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="passwordNueva">Contrasena nueva</Label>
                <Input
                  id="passwordNueva"
                  type="password"
                  required
                  minLength={8}
                  value={passwordNueva}
                  onChange={(e) => setPasswordNueva(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="passwordConfirmar">Confirmar contrasena nueva</Label>
                <Input
                  id="passwordConfirmar"
                  type="password"
                  required
                  minLength={8}
                  value={passwordConfirmar}
                  onChange={(e) => setPasswordConfirmar(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={enviando} className="mt-2">
                {enviando ? 'Guardando...' : 'Guardar contrasena'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

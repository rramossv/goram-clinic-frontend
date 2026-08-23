import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function OlvidePasswordPage() {
  const { sesion } = useAuth()
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [enviando, setEnviando] = useState(false)

  if (sesion) {
    return <Navigate to="/panel" replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setEnviando(true)
    try {
      // El backend responde igual exista o no el correo, para no revelar
      // que cuentas estan registradas -- por eso siempre mostramos el
      // mismo mensaje de exito aca, sin importar la respuesta.
      await apiFetch('/api/v1/auth/olvide-password', { method: 'POST', auth: false, body: { email } })
    } catch {
      // silenciado a proposito: el usuario no debe poder distinguir un
      // error de red de un correo inexistente
    } finally {
      setEnviando(false)
      setEnviado(true)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Recuperar acceso</CardTitle>
          <CardDescription>Te mandamos un enlace para elegir una contrasena nueva.</CardDescription>
        </CardHeader>
        <CardContent>
          {enviado ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Si <strong>{email}</strong> esta registrado en GoRam Clinic, te llegara un correo con un
                enlace para restablecer tu contrasena. Revisa tambien la carpeta de spam.
              </p>
              <Link to="/login" className="text-sm font-medium underline underline-offset-4">
                Volver a iniciar sesion
              </Link>
            </div>
          ) : (
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
              <Button type="submit" disabled={enviando} className="mt-2">
                {enviando ? 'Enviando...' : 'Enviar enlace'}
              </Button>
              <Link to="/login" className="text-center text-sm text-muted-foreground underline underline-offset-4">
                Volver a iniciar sesion
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

import { useState, type FormEvent } from 'react'
import { apiFetch, ApiRequestError } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

const ETIQUETA_ROL: Record<string, string> = {
  ADMIN_CLINICA: 'Administrador',
  DOCTOR: 'Doctor',
  RECEPCIONISTA: 'Recepcionista',
  SUPER_ADMIN: 'Super admin',
}

function iniciales(nombre: string) {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('')
}

export function PerfilPage() {
  const { sesion } = useAuth()
  const [passwordActual, setPasswordActual] = useState('')
  const [passwordNueva, setPasswordNueva] = useState('')
  const [passwordConfirmar, setPasswordConfirmar] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (passwordNueva !== passwordConfirmar) {
      setError('La contrasena nueva y su confirmacion no coinciden')
      return
    }

    setEnviando(true)
    try {
      await apiFetch('/api/v1/usuarios/me/password', {
        method: 'PATCH',
        body: { passwordActual, passwordNueva },
      })
      toast.success('Contrasena actualizada')
      setPasswordActual('')
      setPasswordNueva('')
      setPasswordConfirmar('')
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.body?.message ?? 'No se pudo actualizar la contrasena')
      } else {
        setError('No se pudo conectar con el servidor')
      }
    } finally {
      setEnviando(false)
    }
  }

  if (!sesion) return null

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Mi perfil</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datos de la cuenta</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">
                {iniciales(sesion.nombre)}
              </div>
              <div>
                <p className="font-medium">{sesion.nombre}</p>
                <p className="text-sm text-muted-foreground">{sesion.email}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Rol</p>
              <Badge variant="outline" className="mt-1">
                {ETIQUETA_ROL[sesion.rol] ?? sesion.rol}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cambiar mi contrasena</CardTitle>
            <CardDescription>Necesitas tu contrasena actual para establecer una nueva.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="passwordActual">Contrasena actual</Label>
                <Input
                  id="passwordActual"
                  type="password"
                  required
                  value={passwordActual}
                  onChange={(e) => setPasswordActual(e.target.value)}
                />
              </div>
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
              <Button type="submit" disabled={enviando} className="self-start">
                {enviando ? 'Guardando...' : 'Guardar contrasena'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

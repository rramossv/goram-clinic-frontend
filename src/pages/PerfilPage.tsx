import { useState, type FormEvent } from 'react'
import { apiFetch, ApiRequestError } from '@/lib/api'
import { etiquetaRol, useAuth } from '@/lib/auth-context'
import { PageHeader, Seccion } from '@/components/page-header'
import { MembreteProfesional } from '@/components/perfil/membrete-profesional'
import { HorarioEditor } from '@/components/agenda/horario-editor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

function iniciales(nombre: string) {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('')
}

export function PerfilPage() {
  const { sesion, actualizarNombre } = useAuth()
  const [nombre, setNombre] = useState(sesion?.nombre ?? '')
  const [guardandoNombre, setGuardandoNombre] = useState(false)

  async function guardarNombre(event: FormEvent) {
    event.preventDefault()
    setGuardandoNombre(true)
    try {
      await apiFetch('/api/v1/usuarios/me', { method: 'PATCH', body: { nombre } })
      actualizarNombre(nombre.trim())
      toast.success('Nombre actualizado')
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? (err.body?.message ?? 'No se pudo actualizar el nombre') : 'No se pudo conectar con el servidor')
    } finally {
      setGuardandoNombre(false)
    }
  }
  const [passwordActual, setPasswordActual] = useState('')
  const [passwordNueva, setPasswordNueva] = useState('')
  const [passwordConfirmar, setPasswordConfirmar] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (passwordNueva !== passwordConfirmar) {
      setError('La contraseña nueva y su confirmacion no coinciden')
      return
    }

    setEnviando(true)
    try {
      await apiFetch('/api/v1/usuarios/me/password', {
        method: 'PATCH',
        body: { passwordActual, passwordNueva },
      })
      toast.success('Contraseña actualizada')
      setPasswordActual('')
      setPasswordNueva('')
      setPasswordConfirmar('')
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.body?.message ?? 'No se pudo actualizar la contraseña')
      } else {
        setError('No se pudo conectar con el servidor')
      }
    } finally {
      setEnviando(false)
    }
  }

  if (!sesion) return null
  const esMedico = sesion.rol === 'DOCTOR' || !!sesion.atiendePacientes

  return (
    <div className="flex flex-col gap-6">
      <PageHeader titulo="Mi perfil" descripcion={esMedico ? 'Tu membrete profesional, tus datos de acceso y tu contraseña.' : 'Tus datos de acceso y tu contraseña.'} />

      {esMedico && (
        <Seccion titulo="Membrete profesional">
          <MembreteProfesional />
        </Seccion>
      )}
      {sesion.rol === 'DOCTOR' && (
        <Seccion titulo="Mi horario de atención">
          <HorarioEditor soloPropio />
        </Seccion>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datos de la cuenta</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-md bg-primary font-semibold text-primary-foreground">
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
                {etiquetaRol(sesion)}
              </Badge>
            </div>
            <form onSubmit={guardarNombre} className="flex flex-col gap-2 border-t pt-4">
              <Label htmlFor="mi-nombre">Nombre como aparece en citas, recetas y facturas</Label>
              <div className="flex gap-2">
                <Input id="mi-nombre" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
                <Button type="submit" variant="outline" disabled={guardandoNombre || nombre.trim() === sesion.nombre}>
                  Guardar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cambiar mi contraseña</CardTitle>
            <CardDescription>Necesitás tu contraseña actual para establecer una nueva.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="passwordActual">Contraseña actual</Label>
                <Input
                  id="passwordActual"
                  type="password"
                  required
                  value={passwordActual}
                  onChange={(e) => setPasswordActual(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="passwordNueva">Contraseña nueva</Label>
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
                <Label htmlFor="passwordConfirmar">Confirmar contraseña nueva</Label>
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
                {enviando ? 'Guardando...' : 'Guardar contraseña'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

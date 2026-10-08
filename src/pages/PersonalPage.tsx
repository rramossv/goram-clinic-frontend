import { useEffect, useState } from 'react'
import { apiFetch, ApiRequestError } from '@/lib/api'
import { esConsultorio, useAuth } from '@/lib/auth-context'
import type { UsuarioResumen } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/page-header'
import { EstadoChip } from '@/components/estado-chip'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PersonalFormDialog } from '@/components/personal/personal-form-dialog'
import { PersonalEditDialog } from '@/components/personal/personal-edit-dialog'
import { RestablecerPasswordDialog } from '@/components/personal/restablecer-password-dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'

const ETIQUETA_ROL: Record<string, string> = {
  ADMIN_CLINICA: 'Administrador',
  DOCTOR: 'Doctor',
  RECEPCIONISTA: 'Recepcionista',
  SUPER_ADMIN: 'Super admin',
}

export function PersonalPage() {
  const { sesion } = useAuth()
  const [usuarios, setUsuarios] = useState<UsuarioResumen[]>([])
  const [cargando, setCargando] = useState(true)
  const [dialogAbierto, setDialogAbierto] = useState(false)
  const [usuarioADesactivar, setUsuarioADesactivar] = useState<UsuarioResumen | null>(null)
  const [usuarioARestablecer, setUsuarioARestablecer] = useState<UsuarioResumen | null>(null)
  const [actualizando, setActualizando] = useState<string | null>(null)
  const [usuarioAEditar, setUsuarioAEditar] = useState<UsuarioResumen | null>(null)

  async function cargar() {
    setCargando(true)
    try {
      const data = await apiFetch<UsuarioResumen[]>('/api/v1/usuarios')
      setUsuarios(data)
    } catch {
      toast.error('No se pudo cargar el personal')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  async function cambiarActivo(usuario: UsuarioResumen, activo: boolean) {
    setActualizando(usuario.id)
    try {
      await apiFetch(`/api/v1/usuarios/${usuario.id}/activo`, { method: 'PATCH', body: { activo } })
      toast.success(activo ? 'Usuario activado' : 'Usuario desactivado')
      cargar()
    } catch (err) {
      if (err instanceof ApiRequestError) {
        toast.error(err.body?.message ?? 'No se pudo actualizar el usuario')
      } else {
        toast.error('No se pudo conectar con el servidor')
      }
    } finally {
      setActualizando(null)
      setUsuarioADesactivar(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        titulo={esConsultorio(sesion) ? 'Mi asistente' : 'Personal'}
        descripcion={
          esConsultorio(sesion)
            ? 'La persona que te ayuda en recepción, con su propio acceso.'
            : 'Doctores, recepción y administradores con acceso a la clínica.'
        }
        acciones={
          <Button onClick={() => setDialogAbierto(true)}>
            <Plus />
            {esConsultorio(sesion) ? 'Agregar asistente' : 'Agregar personal'}
          </Button>
        }
      />

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!cargando && usuarios.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Todavía no hay personal registrado.
                </TableCell>
              </TableRow>
            )}
            {usuarios.map((usuario) => {
              const esUnoMismo = usuario.id === sesion?.usuarioId
              return (
                <TableRow key={usuario.id}>
                  <TableCell className="font-medium text-tinta">{usuario.nombre}</TableCell>
                  <TableCell>{usuario.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{ETIQUETA_ROL[usuario.rol] ?? usuario.rol}</Badge>
                  </TableCell>
                  <TableCell>
                    <EstadoChip estado={usuario.activo ? 'ACTIVO' : 'INACTIVO'} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setUsuarioAEditar(usuario)}>
                        Editar
                      </Button>
                    {!esUnoMismo && (
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setUsuarioARestablecer(usuario)}>
                          Restablecer contraseña
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={actualizando === usuario.id}
                          onClick={() =>
                            usuario.activo ? setUsuarioADesactivar(usuario) : cambiarActivo(usuario, true)
                          }
                        >
                          {usuario.activo ? 'Desactivar' : 'Activar'}
                        </Button>
                      </div>
                    )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <PersonalFormDialog
        open={dialogAbierto}
        onOpenChange={setDialogAbierto}
        onGuardado={() => {
          setDialogAbierto(false)
          cargar()
        }}
      />

      <AlertDialog open={usuarioADesactivar !== null} onOpenChange={(open) => !open && setUsuarioADesactivar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desactivar a {usuarioADesactivar?.nombre}</AlertDialogTitle>
            <AlertDialogDescription>
              Esta persona ya no podrá iniciar sesión. Podés reactivarla en cualquier momento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => usuarioADesactivar && cambiarActivo(usuarioADesactivar, false)}
            >
              Desactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PersonalEditDialog
        usuario={usuarioAEditar}
        esUnoMismo={usuarioAEditar?.id === sesion?.usuarioId}
        onOpenChange={(open) => !open && setUsuarioAEditar(null)}
        onGuardado={() => {
          setUsuarioAEditar(null)
          cargar()
        }}
      />

      <RestablecerPasswordDialog
        usuario={usuarioARestablecer}
        onOpenChange={(open) => !open && setUsuarioARestablecer(null)}
      />
    </div>
  )
}

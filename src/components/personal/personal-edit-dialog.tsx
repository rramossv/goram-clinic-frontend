import { useEffect, useState, type FormEvent } from 'react'
import { apiFetch, ApiRequestError } from '@/lib/api'
import type { UsuarioResumen } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

const ROLES = [
  { value: 'ADMIN_CLINICA', label: 'Administrador' },
  { value: 'DOCTOR', label: 'Doctor' },
  { value: 'RECEPCIONISTA', label: 'Recepcionista' },
]

interface PersonalEditDialogProps {
  usuario: UsuarioResumen | null
  esUnoMismo: boolean
  onOpenChange: (open: boolean) => void
  onGuardado: () => void
}

export function PersonalEditDialog({ usuario, esUnoMismo, onOpenChange, onGuardado }: PersonalEditDialogProps) {
  const [nombre, setNombre] = useState('')
  const [rol, setRol] = useState('DOCTOR')
  const [atiende, setAtiende] = useState(false)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!usuario) return
    setNombre(usuario.nombre)
    setRol(usuario.rol)
    setAtiende(usuario.atiendePacientes)
  }, [usuario])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!usuario) return
    setEnviando(true)
    try {
      await apiFetch(`/api/v1/usuarios/${usuario.id}`, {
        method: 'PUT',
        body: { nombre, rol, atiendePacientes: rol === 'ADMIN_CLINICA' ? atiende : null },
      })
      toast.success('Datos actualizados')
      onGuardado()
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? (err.body?.message ?? 'No se pudo actualizar') : 'No se pudo conectar con el servidor')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Dialog open={usuario !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar a {usuario?.nombre}</DialogTitle>
            <DialogDescription>{usuario?.email}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="editar-nombre">Nombre</Label>
              <Input id="editar-nombre" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="editar-rol">Rol</Label>
              <Select value={rol} onValueChange={setRol} disabled={esUnoMismo}>
                <SelectTrigger id="editar-rol" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {esUnoMismo && <p className="text-xs text-muted-foreground">No podés cambiar tu propio rol.</p>}
            </div>
            {rol === 'ADMIN_CLINICA' && (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="size-4 accent-primary" checked={atiende} onChange={(e) => setAtiende(e.target.checked)} />
                También atiende pacientes (aparece en la agenda)
              </label>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={enviando}>
              {enviando ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

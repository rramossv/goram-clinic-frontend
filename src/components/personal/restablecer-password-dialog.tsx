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
import { toast } from 'sonner'

interface RestablecerPasswordDialogProps {
  usuario: UsuarioResumen | null
  onOpenChange: (open: boolean) => void
}

export function RestablecerPasswordDialog({ usuario, onOpenChange }: RestablecerPasswordDialogProps) {
  const [passwordNueva, setPasswordNueva] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (usuario) setPasswordNueva('')
  }, [usuario])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!usuario) return
    setEnviando(true)
    try {
      await apiFetch(`/api/v1/usuarios/${usuario.id}/password`, {
        method: 'PATCH',
        body: { passwordNueva },
      })
      toast.success(`Contrasena restablecida. Comunicasela a ${usuario.nombre} de forma segura.`)
      onOpenChange(false)
    } catch (err) {
      if (err instanceof ApiRequestError) {
        toast.error(err.body?.message ?? 'No se pudo restablecer la contrasena')
      } else {
        toast.error('No se pudo conectar con el servidor')
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Dialog open={usuario !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Restablecer contrasena de {usuario?.nombre}</DialogTitle>
            <DialogDescription>
              Se le va a asignar esta contrasena directamente. Comunicasela por un medio seguro para que
              pueda ingresar.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2 py-4">
            <Label htmlFor="passwordNueva">Contrasena nueva</Label>
            <Input
              id="passwordNueva"
              type="text"
              required
              minLength={8}
              value={passwordNueva}
              onChange={(e) => setPasswordNueva(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={enviando}>
              {enviando ? 'Guardando...' : 'Restablecer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

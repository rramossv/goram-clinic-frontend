import { useEffect, useState, type FormEvent } from 'react'
import { apiFetch, ApiRequestError } from '@/lib/api'
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

const ROLES_STAFF = [
  { value: 'ADMIN_CLINICA', label: 'Administrador de clinica' },
  { value: 'DOCTOR', label: 'Doctor' },
  { value: 'RECEPCIONISTA', label: 'Recepcionista' },
]

interface PersonalFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGuardado: () => void
}

export function PersonalFormDialog({ open, onOpenChange, onGuardado }: PersonalFormDialogProps) {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rol, setRol] = useState('DOCTOR')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (open) {
      setNombre('')
      setEmail('')
      setPassword('')
      setRol('DOCTOR')
    }
  }, [open])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setEnviando(true)
    try {
      await apiFetch('/api/v1/usuarios', {
        method: 'POST',
        body: { nombre, email, password, rol },
      })
      toast.success('Personal agregado')
      onGuardado()
    } catch (err) {
      if (err instanceof ApiRequestError) {
        toast.error(err.body?.message ?? 'No se pudo agregar el personal')
      } else {
        toast.error('No se pudo conectar con el servidor')
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Agregar personal</DialogTitle>
            <DialogDescription>Crea un nuevo usuario para tu clinica.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Correo</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Contrasena temporal</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="rol">Rol</Label>
              <Select value={rol} onValueChange={setRol}>
                <SelectTrigger id="rol" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES_STAFF.map((opcion) => (
                    <SelectItem key={opcion.value} value={opcion.value}>
                      {opcion.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={enviando}>
              {enviando ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

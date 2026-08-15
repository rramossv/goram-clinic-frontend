import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import type { UsuarioResumen } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PersonalFormDialog } from '@/components/personal/personal-form-dialog'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'

const ETIQUETA_ROL: Record<string, string> = {
  ADMIN_CLINICA: 'Administrador',
  DOCTOR: 'Doctor',
  RECEPCIONISTA: 'Recepcionista',
  SUPER_ADMIN: 'Super admin',
}

export function PersonalPage() {
  const [usuarios, setUsuarios] = useState<UsuarioResumen[]>([])
  const [cargando, setCargando] = useState(true)
  const [dialogAbierto, setDialogAbierto] = useState(false)

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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Personal</h1>
        <Button onClick={() => setDialogAbierto(true)}>
          <Plus />
          Agregar personal
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!cargando && usuarios.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  Todavia no hay personal registrado.
                </TableCell>
              </TableRow>
            )}
            {usuarios.map((usuario) => (
              <TableRow key={usuario.id}>
                <TableCell className="font-medium">{usuario.nombre}</TableCell>
                <TableCell>{usuario.email}</TableCell>
                <TableCell>
                  <Badge variant="outline">{ETIQUETA_ROL[usuario.rol] ?? usuario.rol}</Badge>
                </TableCell>
              </TableRow>
            ))}
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
    </div>
  )
}

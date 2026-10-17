import { useEffect, useState, type FormEvent } from 'react'
import { apiFetch, ApiRequestError } from '@/lib/api'
import type { PacienteResponse } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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

interface PacienteFormValues {
  nombre: string
  documentoIdentidad: string
  fechaNacimiento: string
  sexo: string
  telefono: string
  email: string
  direccion: string
  alergias: string
  antecedentes: string
  tipoSangre: string
  medicamentosActuales: string
}

const TIPOS_SANGRE = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']

const VALORES_VACIOS: PacienteFormValues = {
  nombre: '',
  documentoIdentidad: '',
  fechaNacimiento: '',
  sexo: '',
  telefono: '',
  email: '',
  direccion: '',
  alergias: '',
  antecedentes: '',
  tipoSangre: '',
  medicamentosActuales: '',
}

function pacienteAFormulario(paciente: PacienteResponse): PacienteFormValues {
  return {
    nombre: paciente.nombre,
    documentoIdentidad: paciente.documentoIdentidad ?? '',
    fechaNacimiento: paciente.fechaNacimiento ?? '',
    sexo: paciente.sexo ?? '',
    telefono: paciente.telefono ?? '',
    email: paciente.email ?? '',
    direccion: paciente.direccion ?? '',
    alergias: paciente.alergias ?? '',
    antecedentes: paciente.antecedentes ?? '',
    tipoSangre: paciente.tipoSangre ?? '',
    medicamentosActuales: paciente.medicamentosActuales ?? '',
  }
}

interface PacienteFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  paciente: PacienteResponse | null
  onGuardado: () => void
}

export function PacienteFormDialog({ open, onOpenChange, paciente, onGuardado }: PacienteFormDialogProps) {
  const [valores, setValores] = useState<PacienteFormValues>(VALORES_VACIOS)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (open) {
      setValores(paciente ? pacienteAFormulario(paciente) : VALORES_VACIOS)
    }
  }, [open, paciente])

  function actualizar<K extends keyof PacienteFormValues>(campo: K, valor: PacienteFormValues[K]) {
    setValores((anterior) => ({ ...anterior, [campo]: valor }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setEnviando(true)

    const body = {
      nombre: valores.nombre,
      documentoIdentidad: valores.documentoIdentidad || null,
      fechaNacimiento: valores.fechaNacimiento || null,
      sexo: valores.sexo || null,
      telefono: valores.telefono || null,
      email: valores.email || null,
      direccion: valores.direccion || null,
      alergias: valores.alergias || null,
      antecedentes: valores.antecedentes || null,
      tipoSangre: valores.tipoSangre || null,
      medicamentosActuales: valores.medicamentosActuales || null,
    }

    try {
      if (paciente) {
        await apiFetch(`/api/v1/pacientes/${paciente.id}`, { method: 'PUT', body })
        toast.success('Paciente actualizado')
      } else {
        await apiFetch('/api/v1/pacientes', { method: 'POST', body })
        toast.success('Paciente creado')
      }
      onGuardado()
    } catch (err) {
      if (err instanceof ApiRequestError) {
        toast.error(err.body?.message ?? 'No se pudo guardar el paciente')
      } else {
        toast.error('No se pudo conectar con el servidor')
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{paciente ? 'Editar paciente' : 'Nuevo paciente'}</DialogTitle>
            <DialogDescription>
              {paciente ? 'Actualiza los datos del paciente.' : 'Completa los datos del nuevo paciente.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                required
                value={valores.nombre}
                onChange={(e) => actualizar('nombre', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="documento">Documento (DUI/NIT)</Label>
              <Input
                id="documento"
                value={valores.documentoIdentidad}
                onChange={(e) => actualizar('documentoIdentidad', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="fechaNacimiento">Fecha de nacimiento</Label>
              <Input
                id="fechaNacimiento"
                type="date"
                value={valores.fechaNacimiento}
                onChange={(e) => actualizar('fechaNacimiento', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="sexo">Sexo</Label>
              <Select value={valores.sexo} onValueChange={(v) => actualizar('sexo', v)}>
                <SelectTrigger id="sexo" className="w-full">
                  <SelectValue placeholder="Sin especificar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="F">Femenino</SelectItem>
                  <SelectItem value="M">Masculino</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={valores.telefono}
                onChange={(e) => actualizar('telefono', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={valores.email}
                onChange={(e) => actualizar('email', e.target.value)}
              />
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                value={valores.direccion}
                onChange={(e) => actualizar('direccion', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="tipoSangre">Tipo de sangre</Label>
              <Select value={valores.tipoSangre} onValueChange={(v) => actualizar('tipoSangre', v)}>
                <SelectTrigger id="tipoSangre" className="w-full">
                  <SelectValue placeholder="Sin especificar" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_SANGRE.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="alergias">Alergias</Label>
              <Textarea
                id="alergias"
                rows={2}
                placeholder="Medicamentos, alimentos u otras. Escribí «Ninguna» si no tiene."
                value={valores.alergias}
                onChange={(e) => actualizar('alergias', e.target.value)}
              />
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="antecedentes">Antecedentes</Label>
              <Textarea
                id="antecedentes"
                rows={2}
                placeholder="Enfermedades crónicas, cirugías, antecedentes familiares…"
                value={valores.antecedentes}
                onChange={(e) => actualizar('antecedentes', e.target.value)}
              />
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="medicamentosActuales">Medicamentos que toma actualmente</Label>
              <Textarea
                id="medicamentosActuales"
                rows={2}
                value={valores.medicamentosActuales}
                onChange={(e) => actualizar('medicamentosActuales', e.target.value)}
              />
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

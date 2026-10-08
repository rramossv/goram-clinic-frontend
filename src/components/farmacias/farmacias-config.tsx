import { useState, type FormEvent } from 'react'
import { apiFetch, ApiRequestError } from '@/lib/api'
import type { FarmaciaResponse } from '@/types'
import { dominioDe, FARMACIA_SUGERIDA, useFarmacias } from '@/components/farmacias/farmacias'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Pencil, Plus, Trash2 } from 'lucide-react'

const VACIO = { nombre: '', url: '', urlBusqueda: '' }

const mensaje = (err: unknown, porDefecto: string) =>
  err instanceof ApiRequestError ? (err.body?.message ?? porDefecto) : 'No se pudo conectar con el servidor'

/** Administracion de la lista de farmacias (Configuracion, solo admin). */
export function FarmaciasConfig() {
  const { farmacias, recargar } = useFarmacias()
  const [valores, setValores] = useState(VACIO)
  const [editando, setEditando] = useState<FarmaciaResponse | null>(null)
  const [ocupado, setOcupado] = useState(false)

  function editar(f: FarmaciaResponse) {
    setEditando(f)
    setValores({ nombre: f.nombre, url: f.url, urlBusqueda: f.urlBusqueda ?? '' })
  }

  function cancelar() {
    setEditando(null)
    setValores(VACIO)
  }

  async function guardar(event: FormEvent) {
    event.preventDefault()
    setOcupado(true)
    try {
      const body = { ...valores, url: valores.url.trim(), urlBusqueda: valores.urlBusqueda.trim() }
      if (editando) {
        await apiFetch(`/api/v1/farmacias/${editando.id}`, { method: 'PUT', body })
        toast.success('Farmacia actualizada')
      } else {
        await apiFetch('/api/v1/farmacias', { method: 'POST', body })
        toast.success('Farmacia agregada')
      }
      cancelar()
      recargar()
    } catch (err) {
      toast.error(mensaje(err, 'No se pudo guardar la farmacia'))
    } finally {
      setOcupado(false)
    }
  }

  async function quitar(f: FarmaciaResponse) {
    try {
      await apiFetch(`/api/v1/farmacias/${f.id}`, { method: 'DELETE' })
      toast.success(`${f.nombre} quitada de la lista`)
      recargar()
    } catch (err) {
      toast.error(mensaje(err, 'No se pudo quitar'))
    }
  }

  const tieneSugerida = farmacias?.some((f) => dominioDe(f.url) === dominioDe(FARMACIA_SUGERIDA.url))

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={guardar} className="grid gap-3 rounded-lg border bg-carton/50 p-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="farmacia-nombre" className="text-xs">Nombre</Label>
          <Input id="farmacia-nombre" required placeholder="Ej. Farmacia del barrio" value={valores.nombre} onChange={(e) => setValores((v) => ({ ...v, nombre: e.target.value }))} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="farmacia-url" className="text-xs">Sitio web</Label>
          <Input id="farmacia-url" required type="url" placeholder="https://..." value={valores.url} onChange={(e) => setValores((v) => ({ ...v, url: e.target.value }))} />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="farmacia-busqueda" className="text-xs">Enlace de búsqueda (opcional)</Label>
          <Input
            id="farmacia-busqueda"
            placeholder="https://.../buscar?q={medicamento}"
            value={valores.urlBusqueda}
            onChange={(e) => setValores((v) => ({ ...v, urlBusqueda: e.target.value }))}
          />
          <p className="text-xs text-muted-foreground">
            Si la farmacia tiene una dirección de búsqueda, escribí {'{medicamento}'} donde va el producto y el sistema abrirá la búsqueda ya hecha.
          </p>
        </div>
        <div className="flex justify-end gap-2 sm:col-span-2">
          {editando && (
            <Button type="button" variant="ghost" onClick={cancelar}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={ocupado}>
            {editando ? 'Guardar cambios' : (<><Plus />Agregar farmacia</>)}
          </Button>
        </div>
      </form>

      {farmacias === null ? (
        <Skeleton className="h-16 w-full" />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          {farmacias.length === 0 && (
            <p className="px-4 py-5 text-center text-sm text-muted-foreground">Sin farmacias todavía.</p>
          )}
          <ul className="divide-y">
            {farmacias.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-tinta">{f.nombre}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {dominioDe(f.url)} · {f.urlBusqueda ? 'búsqueda directa' : 'abre el sitio'}
                  </p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => editar(f)}>
                  <Pencil />
                  Editar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => quitar(f)}>
                  <Trash2 />
                  Quitar
                </Button>
              </li>
            ))}
          </ul>
          {!tieneSugerida && (
            <div className="border-t bg-carton/40 px-4 py-3 text-sm">
              Sugerida:{' '}
              <button
                type="button"
                className="font-medium text-primary hover:underline"
                onClick={async () => {
                  try {
                    await apiFetch('/api/v1/farmacias', { method: 'POST', body: FARMACIA_SUGERIDA })
                    recargar()
                  } catch (err) {
                    toast.error(mensaje(err, 'No se pudo agregar'))
                  }
                }}
              >
                agregar {FARMACIA_SUGERIDA.nombre}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

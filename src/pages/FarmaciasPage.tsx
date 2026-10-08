import { useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch, ApiRequestError } from '@/lib/api'
import { puede, useAuth } from '@/lib/auth-context'
import { PageHeader } from '@/components/page-header'
import { abrirFarmacia, dominioDe, FARMACIAS_SUGERIDAS, useFarmacias } from '@/components/farmacias/farmacias'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { ExternalLink, Search, Store } from 'lucide-react'

export function FarmaciasPage() {
  const { sesion } = useAuth()
  const esAdmin = puede(sesion, 'administrar')
  const { farmacias, recargar } = useFarmacias()
  const [medicamento, setMedicamento] = useState('')
  const [agregando, setAgregando] = useState(false)

  async function agregarSugeridas() {
    setAgregando(true)
    try {
      for (const sugerida of FARMACIAS_SUGERIDAS) {
        await apiFetch('/api/v1/farmacias', { method: 'POST', body: sugerida })
      }
      toast.success('Farmacias agregadas')
      recargar()
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? (err.body?.message ?? 'No se pudo agregar') : 'No se pudo conectar con el servidor')
    } finally {
      setAgregando(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo="Farmacias"
        descripcion="Consultá disponibilidad y precios directamente en el sitio de cada farmacia."
        acciones={
          esAdmin && (
            <Button variant="outline" asChild>
              <Link to="/configuracion#farmacias">Administrar lista</Link>
            </Button>
          )
        }
      />

      <div className="relative w-full max-w-md">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Medicamento a consultar (opcional)"
          value={medicamento}
          onChange={(e) => setMedicamento(e.target.value)}
        />
      </div>

      {farmacias === null ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : farmacias.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-lg border bg-card px-5 py-8">
          <Store className="size-6 text-muted-foreground" />
          <p className="font-medium text-tinta">Todavía no hay farmacias en la lista.</p>
          {esAdmin ? (
            <>
              <p className="max-w-lg text-sm text-muted-foreground">
                Agregá las farmacias donde tus pacientes compran. Podés empezar con{' '}
                {FARMACIAS_SUGERIDAS.map((f) => f.nombre).join(' y ')}, que tienen tienda en línea, y sumar otras desde
                Configuración.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={agregarSugeridas} disabled={agregando}>
                  Agregar las sugeridas
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/configuracion#farmacias">Agregar otra farmacia</Link>
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Pedile al administrador que las agregue en Configuración.</p>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {farmacias.map((f) => {
            const buscaDirecto = Boolean(f.urlBusqueda && medicamento.trim())
            return (
              <div key={f.id} className="flex flex-col justify-between gap-4 rounded-lg border bg-card p-4">
                <div>
                  <p className="font-semibold text-tinta">{f.nombre}</p>
                  <p className="text-sm text-muted-foreground">{dominioDe(f.url)}</p>
                </div>
                <Button variant={buscaDirecto ? 'default' : 'outline'} onClick={() => abrirFarmacia(f, medicamento)}>
                  <ExternalLink />
                  {buscaDirecto ? `Buscar "${medicamento.trim()}"` : 'Abrir sitio'}
                </Button>
              </div>
            )
          })}
        </div>
      )}

      {farmacias && farmacias.length > 0 && medicamento.trim() && farmacias.some((f) => !f.urlBusqueda) && (
        <p className="text-sm text-muted-foreground">
          Algunas farmacias no permiten abrir la búsqueda directo: se abre su sitio y ahí buscás el medicamento.
        </p>
      )}
    </div>
  )
}

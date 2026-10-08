import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import type { FarmaciaResponse } from '@/types'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ExternalLink, Pill, Search } from 'lucide-react'

/**
 * Farmacias sugeridas: solo sitios oficiales verificados. Ninguno expone un
 * enlace de busqueda directa comprobable, asi que abren su tienda.
 */
export const FARMACIAS_SUGERIDAS = [
  { nombre: 'Farmacias San Nicolás', url: 'https://www.farmaciasannicolas.com/', urlBusqueda: '' },
  { nombre: 'Farmacias Value', url: 'https://www.farmavalue.com/', urlBusqueda: '' },
]

export function dominioDe(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

/** Arma el enlace: busqueda directa si la farmacia la admite, si no su pagina. */
export function enlaceFarmacia(farmacia: FarmaciaResponse, medicamento?: string) {
  const termino = medicamento?.trim()
  const url = termino && farmacia.urlBusqueda
    ? farmacia.urlBusqueda.replace('{medicamento}', encodeURIComponent(termino))
    : farmacia.url
  // defensa extra: solo https, aunque el backend ya lo valida
  return url.startsWith('https://') ? url : null
}

export function abrirFarmacia(farmacia: FarmaciaResponse, medicamento?: string) {
  const url = enlaceFarmacia(farmacia, medicamento)
  if (url) window.open(url, '_blank', 'noopener,noreferrer')
}

export function useFarmacias() {
  const [farmacias, setFarmacias] = useState<FarmaciaResponse[] | null>(null)
  const recargar = () =>
    apiFetch<FarmaciaResponse[]>('/api/v1/farmacias')
      .then(setFarmacias)
      .catch(() => setFarmacias([]))
  useEffect(() => {
    recargar()
  }, [])
  return { farmacias, recargar }
}

/** Boton junto a la receta: consulta un medicamento en las farmacias de la clinica. */
export function ConsultarFarmaciasBoton({ terminoInicial }: { terminoInicial: () => string }) {
  const { farmacias } = useFarmacias()
  const [abierto, setAbierto] = useState(false)
  const [termino, setTermino] = useState('')

  return (
    <Popover
      open={abierto}
      onOpenChange={(o) => {
        if (o) setTermino(terminoInicial())
        setAbierto(o)
      }}
    >
      <PopoverTrigger asChild>
        <Button type="button" variant="link" size="sm" className="h-auto px-0">
          <Pill />
          Consultar en farmacias
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center gap-2 border-b px-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={termino}
            onChange={(e) => setTermino(e.target.value)}
            placeholder="Medicamento a consultar"
            className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="p-1">
          {farmacias === null ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">Cargando...</p>
          ) : farmacias.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">
              Todavía no hay farmacias configuradas. El administrador las agrega en Configuración.
            </p>
          ) : (
            farmacias.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => abrirFarmacia(f, termino)}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-accent"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-tinta">{f.nombre}</span>
                  <span className="block text-xs text-muted-foreground">
                    {f.urlBusqueda && termino.trim() ? `Buscar "${termino.trim()}"` : `Abrir ${dominioDe(f.url)}`}
                  </span>
                </span>
                <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
              </button>
            ))
          )}
        </div>
        <p className="border-t px-3 py-2 text-xs text-muted-foreground">
          La disponibilidad y el precio se consultan en el sitio de cada farmacia.
        </p>
      </PopoverContent>
    </Popover>
  )
}

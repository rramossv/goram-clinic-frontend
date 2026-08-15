import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationControlsProps {
  pagina: number
  totalPaginas: number
  totalItems: number
  tamanoPagina: number
  onCambiarPagina: (pagina: number) => void
}

export function PaginationControls({
  pagina,
  totalPaginas,
  totalItems,
  tamanoPagina,
  onCambiarPagina,
}: PaginationControlsProps) {
  if (totalItems === 0) return null

  const inicio = (pagina - 1) * tamanoPagina + 1
  const fin = Math.min(pagina * tamanoPagina, totalItems)

  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>
        Mostrando {inicio}-{fin} de {totalItems}
      </span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" disabled={pagina <= 1} onClick={() => onCambiarPagina(pagina - 1)}>
          <ChevronLeft />
        </Button>
        <span>
          Pagina {pagina} de {totalPaginas}
        </span>
        <Button
          variant="outline"
          size="icon"
          disabled={pagina >= totalPaginas}
          onClick={() => onCambiarPagina(pagina + 1)}
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  )
}

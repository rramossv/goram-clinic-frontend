import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  titulo: ReactNode
  descripcion?: ReactNode
  /** Botones de accion del modulo; en telefono pasan debajo del titulo. */
  acciones?: ReactNode
  /** Elemento a la izquierda del titulo (p. ej. volver, codigo del paciente). */
  inicio?: ReactNode
  className?: string
}

export function PageHeader({ titulo, descripcion, acciones, inicio, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {inicio}
        <div className="min-w-0">
          <h1 className="text-[1.375rem] leading-tight font-semibold tracking-[-0.015em] text-tinta">{titulo}</h1>
          {descripcion && <div className="mt-1 text-sm text-muted-foreground">{descripcion}</div>}
        </div>
      </div>
      {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
    </header>
  )
}

interface SeccionProps {
  titulo: ReactNode
  accion?: ReactNode
  children: ReactNode
  className?: string
}

/** Bloque de contenido de una hoja: titulo con filete y su contenido. */
export function Seccion({ titulo, accion, children, className }: SeccionProps) {
  return (
    <section className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[0.9375rem] font-semibold text-tinta">{titulo}</h2>
        {accion}
      </div>
      {children}
    </section>
  )
}

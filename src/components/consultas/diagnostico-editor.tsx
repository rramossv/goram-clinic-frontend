import { useId, useMemo, useState, type KeyboardEvent } from 'react'
import type { DiagnosticoItem } from '@/types'
import { buscarCie10 } from '@/lib/cie10'
import { cn } from '@/lib/utils'
import { Plus, Search, X } from 'lucide-react'

interface Props {
  valor: DiagnosticoItem[]
  onChange: (valor: DiagnosticoItem[]) => void
}

export function DiagnosticoEditor({ valor, onChange }: Props) {
  const [texto, setTexto] = useState('')
  const [abierto, setAbierto] = useState(false)
  const [activo, setActivo] = useState(0)
  const listaId = useId()

  const resultados = useMemo(() => buscarCie10(texto), [texto])
  const opciones: DiagnosticoItem[] = [
    ...resultados.map((r) => ({ codigo: r.codigo, descripcion: r.descripcion })),
    ...(texto.trim().length > 2 ? [{ codigo: null, descripcion: texto.trim() }] : []),
  ]

  function agregar(d: DiagnosticoItem) {
    const repetido = valor.some((v) => (d.codigo ? v.codigo === d.codigo : v.descripcion.toLowerCase() === d.descripcion.toLowerCase()))
    if (!repetido) onChange([...valor, d])
    setTexto('')
    setActivo(0)
    setAbierto(false)
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!opciones.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setAbierto(true)
      setActivo((a) => (a + 1) % opciones.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActivo((a) => (a - 1 + opciones.length) % opciones.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      agregar(opciones[activo])
    } else if (e.key === 'Escape') {
      setAbierto(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {valor.length > 0 && (
        <ol className="flex flex-col divide-y rounded-lg border bg-card">
          {valor.map((d, i) => (
            <li key={`${d.codigo}-${d.descripcion}`} className="flex items-center gap-3 px-3 py-2.5">
              <span className="w-5 text-xs font-medium text-muted-foreground tabular-nums">{i + 1}.</span>
              {d.codigo ? (
                <span className="inline-flex h-6 min-w-14 items-center justify-center rounded-[4px] bg-info-suave px-1.5 font-mono text-xs font-semibold text-info ring-1 ring-info/20 ring-inset">
                  {d.codigo}
                </span>
              ) : (
                <span className="inline-flex h-6 min-w-14 items-center justify-center rounded-[4px] bg-muted px-1.5 text-[11px] text-muted-foreground">Libre</span>
              )}
              <span className="min-w-0 flex-1 text-sm text-tinta">
                {d.descripcion}
                {i === 0 && valor.length > 1 && <span className="ml-2 text-xs text-muted-foreground">Principal</span>}
              </span>
              <button
                type="button"
                onClick={() => onChange(valor.filter((_, j) => j !== i))}
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label={`Quitar ${d.descripcion}`}
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ol>
      )}

      <div className="relative">
        <div className="flex h-10 items-center gap-2 rounded-md bg-background px-3 ring-1 ring-input ring-inset focus-within:ring-2 focus-within:ring-ring">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            role="combobox"
            aria-expanded={abierto && opciones.length > 0}
            aria-controls={listaId}
            aria-autocomplete="list"
            aria-label="Buscar diagnóstico"
            value={texto}
            placeholder={valor.length ? 'Agregar otro diagnóstico…' : 'Buscar por nombre o código CIE-10 (ej. faringitis, J02)'}
            onChange={(e) => {
              setTexto(e.target.value)
              setAbierto(true)
              setActivo(0)
            }}
            onFocus={() => setAbierto(true)}
            onBlur={() => setTimeout(() => setAbierto(false), 150)}
            onKeyDown={onKeyDown}
            className="h-full w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
          />
        </div>
        {abierto && opciones.length > 0 && (
          <ul id={listaId} role="listbox" className="absolute inset-x-0 top-full z-30 mt-1 max-h-80 overflow-auto rounded-lg border bg-popover p-1 shadow-lg">
            {opciones.map((o, i) => (
              <li
                key={`${o.codigo ?? 'libre'}-${o.descripcion}`}
                role="option"
                aria-selected={i === activo}
                onMouseDown={(e) => {
                  e.preventDefault()
                  agregar(o)
                }}
                onMouseEnter={() => setActivo(i)}
                className={cn('flex cursor-pointer items-center gap-3 rounded-md px-2.5 py-2 text-sm', i === activo && 'bg-accent')}
              >
                {o.codigo ? (
                  <span className="w-14 shrink-0 font-mono text-xs font-semibold text-info">{o.codigo}</span>
                ) : (
                  <Plus className="ml-0.5 size-4 shrink-0 text-muted-foreground" />
                )}
                <span className="min-w-0 flex-1">{o.codigo ? o.descripcion : <>Agregar «{o.descripcion}» sin código</>}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Incluye una selección de códigos CIE-10 de uso frecuente. Si el diagnóstico no aparece, escribilo y agregalo sin código.
      </p>
    </div>
  )
}

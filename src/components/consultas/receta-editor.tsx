import { useId, useState } from 'react'
import type { RecetaItem } from '@/types'
import { normalizar } from '@/lib/cie10'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { History, Plus, Trash2 } from 'lucide-react'

export const ITEM_VACIO: RecetaItem = { medicamento: '', dosis: '', frecuencia: '', duracion: '', indicaciones: '' }

const FRECUENCIAS = ['cada 4 horas', 'cada 6 horas', 'cada 8 horas', 'cada 12 horas', 'cada 24 horas', 'una vez al día', 'dos veces al día', 'tres veces al día', 'antes de cada comida', 'al acostarse', 'si hay dolor o fiebre', 'dosis única']
const DURACIONES = ['por 3 días', 'por 5 días', 'por 7 días', 'por 10 días', 'por 14 días', 'por 1 mes', 'por 3 meses', 'uso continuo', 'hasta nuevo aviso']
const DOSIS = ['1 tableta', '1 cápsula', '½ tableta', '2 tabletas', '5 ml', '10 ml', '1 sobre', '1 aplicación', '2 gotas', '1 inhalación']

export function detalleItem(i: RecetaItem) {
  return [i.dosis, i.frecuencia, i.duracion].filter(Boolean).join(' · ')
}

function Autocompletar({ valor, frecuentes, onChange, onElegir, autoFocus }: {
  valor: string
  frecuentes: RecetaItem[]
  onChange: (v: string) => void
  onElegir: (item: RecetaItem) => void
  autoFocus?: boolean
}) {
  const [abierto, setAbierto] = useState(false)
  const [activo, setActivo] = useState(0)
  const listaId = useId()
  const q = normalizar(valor)
  const sugerencias = (q ? frecuentes.filter((f) => normalizar(f.medicamento).includes(q) && normalizar(f.medicamento) !== q) : frecuentes).slice(0, 6)

  return (
    <div className="relative min-w-0">
      <input
        role="combobox"
        aria-expanded={abierto && sugerencias.length > 0}
        aria-controls={listaId}
        aria-label="Medicamento"
        autoFocus={autoFocus}
        value={valor}
        placeholder="Medicamento, concentración y forma (ej. Amoxicilina 500 mg cápsulas)"
        onChange={(e) => {
          onChange(e.target.value)
          setAbierto(true)
          setActivo(0)
        }}
        onFocus={() => setAbierto(true)}
        onBlur={() => setTimeout(() => setAbierto(false), 150)}
        onKeyDown={(e) => {
          if (!abierto || !sugerencias.length) return
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setActivo((a) => (a + 1) % sugerencias.length)
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActivo((a) => (a - 1 + sugerencias.length) % sugerencias.length)
          } else if (e.key === 'Enter') {
            e.preventDefault()
            onElegir(sugerencias[activo])
            setAbierto(false)
          } else if (e.key === 'Escape') {
            setAbierto(false)
          }
        }}
        className="h-10 w-full min-w-0 rounded-md bg-background px-3 text-[15px] font-medium text-tinta ring-1 ring-input outline-none ring-inset placeholder:text-sm placeholder:font-normal placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-ring"
      />
      {abierto && sugerencias.length > 0 && (
        <ul id={listaId} role="listbox" className="absolute inset-x-0 top-full z-30 mt-1 max-h-72 overflow-auto rounded-lg border bg-popover p-1 shadow-lg">
          <li className="flex items-center gap-1.5 px-2.5 pt-1.5 pb-1 text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
            <History className="size-3.5" />
            Recetados antes en este consultorio
          </li>
          {sugerencias.map((s, i) => (
            <li
              key={s.medicamento}
              role="option"
              aria-selected={i === activo}
              onMouseDown={(e) => {
                e.preventDefault()
                onElegir(s)
                setAbierto(false)
              }}
              onMouseEnter={() => setActivo(i)}
              className={cn('cursor-pointer rounded-md px-2.5 py-2', i === activo && 'bg-accent')}
            >
              <p className="text-sm font-medium text-tinta">{s.medicamento}</p>
              {detalleItem(s) && <p className="text-xs text-muted-foreground">{detalleItem(s)}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function CampoCorto({ valor, onChange, placeholder, lista, etiqueta }: { valor: string; onChange: (v: string) => void; placeholder: string; lista: string; etiqueta: string }) {
  return (
    <input
      aria-label={etiqueta}
      list={lista}
      value={valor}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 w-full min-w-0 rounded-md bg-background px-2.5 text-sm ring-1 ring-input outline-none ring-inset placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-ring"
    />
  )
}

interface Props {
  valor: RecetaItem[]
  onChange: (valor: RecetaItem[]) => void
  frecuentes: RecetaItem[]
  onFoco?: (indice: number) => void
}

export function RecetaEditor({ valor, onChange, frecuentes, onFoco }: Props) {
  const [nuevo, setNuevo] = useState<number | null>(null)
  const listas = useId()

  const set = (i: number, cambios: Partial<RecetaItem>) => onChange(valor.map((item, j) => (j === i ? { ...item, ...cambios } : item)))

  function agregar() {
    setNuevo(valor.length)
    onChange([...valor, { ...ITEM_VACIO }])
  }

  return (
    <div className="flex flex-col gap-3">
      <datalist id={`${listas}-dosis`}>{DOSIS.map((d) => <option key={d} value={d} />)}</datalist>
      <datalist id={`${listas}-frec`}>{FRECUENCIAS.map((d) => <option key={d} value={d} />)}</datalist>
      <datalist id={`${listas}-dur`}>{DURACIONES.map((d) => <option key={d} value={d} />)}</datalist>

      {valor.length === 0 && (
        <button
          type="button"
          onClick={agregar}
          className="flex flex-col items-center gap-1 rounded-lg border border-dashed px-4 py-6 text-center transition-colors hover:border-primary/40 hover:bg-accent/50"
        >
          <span className="font-serif text-2xl font-bold text-primary/70 italic">Rx</span>
          <span className="text-sm font-medium text-tinta">Agregar el primer medicamento</span>
          <span className="text-xs text-muted-foreground">Cada medicamento es una línea con su dosis, frecuencia y duración.</span>
        </button>
      )}

      {valor.map((item, i) => (
        <div key={i} className="rounded-lg border bg-card p-3" onFocus={() => onFoco?.(i)}>
          <div className="flex items-start gap-2">
            <span className="mt-2.5 w-5 shrink-0 text-xs font-semibold text-muted-foreground tabular-nums">{i + 1}.</span>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Autocompletar
                valor={item.medicamento}
                frecuentes={frecuentes}
                autoFocus={nuevo === i}
                onChange={(v) => set(i, { medicamento: v })}
                onElegir={(f) => set(i, { medicamento: f.medicamento, dosis: f.dosis ?? '', frecuencia: f.frecuencia ?? '', duracion: f.duracion ?? '', indicaciones: f.indicaciones ?? '' })}
              />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1.5fr_1fr]">
                <CampoCorto etiqueta="Dosis" valor={item.dosis ?? ''} onChange={(v) => set(i, { dosis: v })} placeholder="Dosis (1 tableta)" lista={`${listas}-dosis`} />
                <CampoCorto etiqueta="Frecuencia" valor={item.frecuencia ?? ''} onChange={(v) => set(i, { frecuencia: v })} placeholder="Frecuencia (cada 8 horas)" lista={`${listas}-frec`} />
                <CampoCorto etiqueta="Duración" valor={item.duracion ?? ''} onChange={(v) => set(i, { duracion: v })} placeholder="Duración (por 7 días)" lista={`${listas}-dur`} />
              </div>
              <input
                aria-label="Indicaciones del medicamento"
                value={item.indicaciones ?? ''}
                placeholder="Indicaciones (opcional): tomar con alimentos, no suspender…"
                onChange={(e) => set(i, { indicaciones: e.target.value })}
                className="h-9 w-full min-w-0 rounded-md bg-transparent px-2.5 text-sm ring-1 ring-border outline-none ring-inset placeholder:text-muted-foreground/60 focus:bg-background focus:ring-2 focus:ring-ring"
              />
            </div>
            <Button type="button" variant="ghost" size="icon-sm" className="mt-1.5 text-muted-foreground hover:text-destructive" onClick={() => onChange(valor.filter((_, j) => j !== i))} aria-label="Quitar medicamento">
              <Trash2 />
            </Button>
          </div>
        </div>
      ))}

      {valor.length > 0 && (
        <Button type="button" variant="outline" className="self-start" onClick={agregar}>
          <Plus />
          Agregar medicamento
        </Button>
      )}
    </div>
  )
}

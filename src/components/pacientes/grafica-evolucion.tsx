import { useEffect, useRef, useState } from 'react'
import { fechaCorta } from '@/lib/clinica'

export interface Serie {
  nombre: string
  /** variable CSS del color: '--serie-1' */
  color: string
  valores: (number | null)[]
}

interface Props {
  titulo: string
  unidad: string
  fechas: string[]
  series: Serie[]
}

const ALTO = 180
const M = { arriba: 14, derecha: 44, abajo: 26, izquierda: 36 }

function ticksLimpios(min: number, max: number, cuantos = 4) {
  const rango = max - min || Math.abs(max) || 1
  const paso0 = rango / cuantos
  const mag = 10 ** Math.floor(Math.log10(paso0))
  const paso = [1, 2, 2.5, 5, 10].map((f) => f * mag).find((p) => p >= paso0) ?? 10 * mag
  const inicio = Math.floor(min / paso) * paso
  const fin = Math.ceil(max / paso) * paso
  const ticks: number[] = []
  for (let v = inicio; v <= fin + paso / 2; v += paso) ticks.push(Math.round(v * 100) / 100)
  return ticks
}

/** Lineas de evolucion en el tiempo con linea guia y lectura de todas las series al pasar el cursor. */
export function GraficaEvolucion({ titulo, unidad, fechas, series }: Props) {
  const contenedor = useRef<HTMLDivElement>(null)
  const [ancho, setAncho] = useState(480)
  const [activo, setActivo] = useState<number | null>(null)

  useEffect(() => {
    const el = contenedor.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setAncho(Math.max(240, e.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const todos = series.flatMap((s) => s.valores.filter((v): v is number => v !== null))
  const minimo = Math.min(...todos)
  const maximo = Math.max(...todos)
  const margenValor = (maximo - minimo || maximo * 0.1 || 1) * 0.15
  const ticks = ticksLimpios(minimo - margenValor, maximo + margenValor)
  const yMin = ticks[0]
  const yMax = ticks.at(-1)!
  const anchoUtil = ancho - M.izquierda - M.derecha
  const altoUtil = ALTO - M.arriba - M.abajo
  const x = (i: number) => M.izquierda + (fechas.length === 1 ? anchoUtil / 2 : (i / (fechas.length - 1)) * anchoUtil)
  const y = (v: number) => M.arriba + altoUtil - ((v - yMin) / (yMax - yMin || 1)) * altoUtil

  function alMover(e: React.PointerEvent<SVGRectElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = e.clientX - rect.left + M.izquierda
    let mejor = 0
    fechas.forEach((_, i) => {
      if (Math.abs(x(i) - px) < Math.abs(x(mejor) - px)) mejor = i
    })
    setActivo(mejor)
  }

  // etiquetas de fecha: primera, ultima y algunas intermedias que quepan
  const cadaN = Math.max(1, Math.ceil(fechas.length / Math.max(2, Math.floor(anchoUtil / 70))))

  return (
    <figure className="flex min-w-0 flex-col gap-2">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="text-sm font-semibold text-tinta">
          {titulo} <span className="font-normal text-muted-foreground">({unidad})</span>
        </span>
        {series.length > 1 && (
          <span className="flex gap-3 text-xs text-muted-foreground">
            {series.map((s) => (
              <span key={s.nombre} className="inline-flex items-center gap-1.5">
                <span className="h-0.5 w-3.5 rounded-full" style={{ background: `var(${s.color})` }} />
                {s.nombre}
              </span>
            ))}
          </span>
        )}
      </figcaption>
      <div ref={contenedor} className="relative">
        <svg width={ancho} height={ALTO} role="img" aria-label={`${titulo} por consulta`} className="block overflow-visible">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={M.izquierda} x2={ancho - M.derecha} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth={1} />
              <text x={M.izquierda - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted-foreground text-[10px] tabular-nums">
                {t}
              </text>
            </g>
          ))}
          {fechas.map((f, i) =>
            i % cadaN === 0 || i === fechas.length - 1 ? (
              <text key={f + i} x={x(i)} y={ALTO - 6} textAnchor={fechas.length === 1 ? 'middle' : i === 0 ? 'start' : i === fechas.length - 1 ? 'end' : 'middle'} className="fill-muted-foreground text-[10px]">
                {new Date(f).toLocaleDateString('es-SV', { day: 'numeric', month: 'short' })}
              </text>
            ) : null,
          )}
          {activo !== null && <line x1={x(activo)} x2={x(activo)} y1={M.arriba} y2={M.arriba + altoUtil} stroke="var(--muted-foreground)" strokeOpacity={0.5} strokeWidth={1} />}
          {series.map((s) => {
            const puntos = s.valores.map((v, i) => (v === null ? null : ([x(i), y(v)] as const))).filter((p): p is readonly [number, number] => p !== null)
            const ultimoIdx = s.valores.reduce<number>((u, v, i) => (v !== null ? i : u), -1)
            return (
              <g key={s.nombre}>
                {puntos.length > 1 && (
                  <polyline points={puntos.map((p) => p.join(',')).join(' ')} fill="none" stroke={`var(${s.color})`} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                )}
                {s.valores.map((v, i) =>
                  v === null ? null : (
                    <circle key={i} cx={x(i)} cy={y(v)} r={activo === i ? 5.5 : 4} fill={`var(${s.color})`} stroke="var(--card)" strokeWidth={2} />
                  ),
                )}
                {ultimoIdx >= 0 && (
                  <text x={x(ultimoIdx) + 9} y={y(s.valores[ultimoIdx]!)} dy="0.32em" className="fill-foreground text-[11px] font-semibold tabular-nums">
                    {s.valores[ultimoIdx]}
                  </text>
                )}
              </g>
            )
          })}
          <rect
            x={M.izquierda}
            y={M.arriba}
            width={anchoUtil}
            height={altoUtil}
            fill="transparent"
            onPointerMove={alMover}
            onPointerLeave={() => setActivo(null)}
          />
        </svg>
        {activo !== null && (
          <div
            className="pointer-events-none absolute z-10 min-w-36 -translate-x-1/2 rounded-md border bg-popover px-3 py-2 text-xs shadow-md"
            style={{ left: Math.min(Math.max(x(activo), 80), ancho - 80), top: 0 }}
          >
            <p className="mb-1 text-muted-foreground">{fechaCorta(fechas[activo])}</p>
            {series.map((s) => (
              <p key={s.nombre} className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-0.5 w-3 rounded-full" style={{ background: `var(${s.color})` }} />
                  {s.nombre}
                </span>
                <span className="font-semibold text-foreground tabular-nums">{s.valores[activo] ?? '—'}</span>
              </p>
            ))}
          </div>
        )}
      </div>
    </figure>
  )
}

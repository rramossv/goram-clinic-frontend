import { tonoEstado, etiquetaEstado } from '@/components/estado-chip'

const ALTURA_MAXIMA = 160

export interface BarraDato {
  etiqueta: string
  valor: number
}

export function GraficaBarras({
  datos,
  formatoValor,
}: {
  datos: BarraDato[]
  formatoValor: (valor: number) => string
}) {
  const maximo = Math.max(1, ...datos.map((d) => d.valor))
  const ultimo = datos.length - 1

  return (
    <div className="relative" style={{ height: ALTURA_MAXIMA + 44 }}>
      {/* filetes de referencia, como el rayado de una hoja de registro */}
      <div className="pointer-events-none absolute inset-x-0 top-5 flex flex-col justify-between" style={{ height: ALTURA_MAXIMA }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="border-t border-dashed border-border" />
        ))}
      </div>
      <div className="relative flex h-full items-end gap-3">
        {datos.map((dato, i) => {
          const alturaBarra = dato.valor > 0 ? Math.max(3, (dato.valor / maximo) * ALTURA_MAXIMA) : 0
          return (
            <div key={dato.etiqueta} className="flex flex-1 flex-col items-center justify-end gap-1.5">
              <span className="text-xs font-semibold text-tinta [font-variant-numeric:tabular-nums]">
                {formatoValor(dato.valor)}
              </span>
              <div
                className={`w-full max-w-9 rounded-t-[3px] ${i === ultimo ? 'bg-primary' : 'bg-primary/35'}`}
                style={{ height: alturaBarra }}
              />
              <span className={`text-xs ${i === ultimo ? 'font-semibold text-tinta' : 'text-muted-foreground'}`}>
                {dato.etiqueta}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const ESTADOS_ORDEN = ['PROGRAMADA', 'CONFIRMADA', 'COMPLETADA', 'CANCELADA', 'NO_ASISTIO']

// Mismos tonos que los estados del resto de la app.
const COLOR_TONO: Record<string, string> = {
  info: 'bg-info',
  exito: 'bg-exito',
  neutro: 'bg-muted-foreground/45',
  peligro: 'bg-destructive',
  aviso: 'bg-aviso',
}

export function GraficaEstados({ conteos }: { conteos: Record<string, number> }) {
  const maximo = Math.max(1, ...Object.values(conteos))

  return (
    <div className="flex flex-col gap-3.5">
      {ESTADOS_ORDEN.map((estado) => {
        const valor = conteos[estado] ?? 0
        return (
          <div key={estado} className="grid grid-cols-[6.5rem_minmax(0,1fr)_2rem] items-center gap-3 text-sm">
            <span className="text-muted-foreground">{etiquetaEstado(estado)}</span>
            <div className="h-2.5 overflow-hidden rounded-[2px] bg-carton">
              <div
                className={`h-full rounded-[2px] ${COLOR_TONO[tonoEstado(estado)]}`}
                style={{ width: `${(valor / maximo) * 100}%` }}
              />
            </div>
            <span className="text-right font-semibold text-tinta [font-variant-numeric:tabular-nums]">{valor}</span>
          </div>
        )
      })}
    </div>
  )
}

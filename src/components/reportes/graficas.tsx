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

  return (
    <div className="flex items-end gap-3" style={{ height: ALTURA_MAXIMA + 40 }}>
      {datos.map((dato) => {
        const alturaBarra = dato.valor > 0 ? Math.max(2, (dato.valor / maximo) * ALTURA_MAXIMA) : 0
        return (
          <div key={dato.etiqueta} className="flex flex-1 flex-col items-center justify-end gap-1.5">
            <span className="text-xs font-medium text-foreground">{formatoValor(dato.valor)}</span>
            <div className="w-full max-w-6 rounded-t-[4px] bg-primary" style={{ height: alturaBarra }} />
            <span className="text-xs text-muted-foreground">{dato.etiqueta}</span>
          </div>
        )
      })}
    </div>
  )
}

const ESTADOS_ORDEN = ['PROGRAMADA', 'CONFIRMADA', 'COMPLETADA', 'CANCELADA', 'NO_ASISTIO']

// Mismos colores que el calendario de Agenda, para que el mismo estado se lea
// igual en toda la app.
const COLOR_ESTADO_BARRA: Record<string, string> = {
  PROGRAMADA: 'bg-blue-500',
  CONFIRMADA: 'bg-emerald-500',
  COMPLETADA: 'bg-muted-foreground/40',
  CANCELADA: 'bg-red-500',
  NO_ASISTIO: 'bg-orange-500',
}

export function GraficaEstados({ conteos }: { conteos: Record<string, number> }) {
  const maximo = Math.max(1, ...Object.values(conteos))

  return (
    <div className="flex flex-col gap-3">
      {ESTADOS_ORDEN.map((estado) => {
        const valor = conteos[estado] ?? 0
        return (
          <div key={estado} className="flex items-center gap-3 text-sm">
            <span className="w-28 shrink-0 text-muted-foreground">{estado}</span>
            <div className="h-4 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${COLOR_ESTADO_BARRA[estado]}`}
                style={{ width: `${(valor / maximo) * 100}%` }}
              />
            </div>
            <span className="w-6 shrink-0 text-right font-medium">{valor}</span>
          </div>
        )
      })}
    </div>
  )
}

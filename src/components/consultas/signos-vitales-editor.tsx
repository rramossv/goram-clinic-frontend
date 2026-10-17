import type { SignosVitales } from '@/types'
import { clasificacionImc, evaluarSigno, imc, type Tono } from '@/lib/clinica'
import { cn } from '@/lib/utils'

/** Los signos se editan como texto (acepta coma decimal) y se convierten al guardar. */
export type SignosTexto = Record<keyof SignosVitales, string>

export const SIGNOS_VACIOS: SignosTexto = {
  presionSistolica: '',
  presionDiastolica: '',
  frecuenciaCardiaca: '',
  frecuenciaRespiratoria: '',
  temperatura: '',
  saturacionO2: '',
  pesoKg: '',
  tallaCm: '',
  glucosaMgDl: '',
}

export function aNumero(texto: string): number | null {
  const limpio = texto.replace(',', '.').trim()
  if (!limpio) return null
  const n = Number(limpio)
  return Number.isFinite(n) ? n : null
}

export function signosANumeros(s: SignosTexto): SignosVitales {
  return Object.fromEntries(Object.entries(s).map(([k, v]) => [k, aNumero(v)])) as unknown as SignosVitales
}

export function signosATexto(s: Partial<SignosVitales>): SignosTexto {
  return Object.fromEntries(
    Object.keys(SIGNOS_VACIOS).map((k) => {
      const v = s[k as keyof SignosVitales]
      return [k, v === null || v === undefined ? '' : String(v)]
    }),
  ) as SignosTexto
}

const ETIQUETA_TONO: Record<Tono, string | null> = { normal: null, aviso: 'Fuera de rango', alerta: 'Valor crítico' }

// el aviso de rango no tapa el valor anterior: el medico compara con los dos
function pista(tono: Tono, anterior: string | null) {
  const aviso = ETIQUETA_TONO[tono]
  if (aviso) return anterior ? `${aviso} · antes ${anterior}` : aviso
  return anterior ? `Anterior: ${anterior}` : ''
}

const CLASE_INPUT: Record<Tono, string> = {
  normal: 'ring-input focus-within:ring-ring',
  aviso: 'ring-aviso/60 bg-aviso-suave/50',
  alerta: 'ring-destructive/60 bg-peligro-suave/60',
}

interface CampoProps {
  id: string
  etiqueta: string
  unidad: string
  valor: string
  onChange: (v: string) => void
  tono: Tono
  anterior?: string | null
  decimal?: boolean
  placeholder?: string
}

function Campo({ id, etiqueta, unidad, valor, onChange, tono, anterior, decimal, placeholder }: CampoProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {etiqueta}
      </label>
      <div className={cn('flex h-10 items-center rounded-md bg-background ring-1 transition-shadow ring-inset focus-within:ring-2', CLASE_INPUT[tono])}>
        <input
          id={id}
          inputMode={decimal ? 'decimal' : 'numeric'}
          autoComplete="off"
          value={valor}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ''))}
          className="h-full w-full min-w-0 bg-transparent px-3 text-[15px] font-medium text-tinta tabular-nums outline-none placeholder:font-normal placeholder:text-muted-foreground/60"
        />
        <span className="pr-3 text-xs whitespace-nowrap text-muted-foreground">{unidad}</span>
      </div>
      <p className={cn('min-h-4 text-[11px] leading-4', tono === 'alerta' ? 'font-medium text-destructive' : tono === 'aviso' ? 'text-aviso' : 'text-muted-foreground')}>
        {pista(tono, anterior ?? null)}
      </p>
    </div>
  )
}

interface Props {
  valor: SignosTexto
  onChange: (valor: SignosTexto) => void
  edad: number | null
  /** signos de la consulta anterior del paciente, para comparar */
  anteriores?: Partial<SignosVitales> | null
}

export function SignosVitalesEditor({ valor, onChange, edad, anteriores }: Props) {
  const numeros = signosANumeros(valor)
  const set = (campo: keyof SignosTexto) => (v: string) => onChange({ ...valor, [campo]: v })
  const tono = (campo: keyof SignosVitales) => evaluarSigno(campo, numeros, edad)
  const ant = (campo: keyof SignosVitales, sufijo = '') => {
    const v = anteriores?.[campo]
    return v === null || v === undefined ? null : `${v}${sufijo}`
  }
  const tonoPresion: Tono = [tono('presionSistolica'), tono('presionDiastolica')].includes('alerta')
    ? 'alerta'
    : [tono('presionSistolica'), tono('presionDiastolica')].includes('aviso')
      ? 'aviso'
      : 'normal'
  const valorImc = imc(numeros.pesoKg, numeros.tallaCm)
  const clase = valorImc !== null && (edad === null || edad >= 18) ? clasificacionImc(valorImc) : null

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3 xl:grid-cols-5">
      <div className="col-span-2 flex min-w-0 flex-col gap-1 sm:col-span-1">
        <span className="text-xs font-medium text-muted-foreground">Presión arterial</span>
        <div className={cn('flex h-10 items-center rounded-md bg-background ring-1 ring-inset focus-within:ring-2', CLASE_INPUT[tonoPresion])}>
          <input
            aria-label="Presión sistólica"
            inputMode="numeric"
            value={valor.presionSistolica}
            placeholder="120"
            onChange={(e) => set('presionSistolica')(e.target.value.replace(/\D/g, ''))}
            className="h-full w-full min-w-0 bg-transparent pl-3 text-right text-[15px] font-medium text-tinta tabular-nums outline-none placeholder:font-normal placeholder:text-muted-foreground/60"
          />
          <span className="px-1 text-muted-foreground">/</span>
          <input
            aria-label="Presión diastólica"
            inputMode="numeric"
            value={valor.presionDiastolica}
            placeholder="80"
            onChange={(e) => set('presionDiastolica')(e.target.value.replace(/\D/g, ''))}
            className="h-full w-full min-w-0 bg-transparent text-[15px] font-medium text-tinta tabular-nums outline-none placeholder:font-normal placeholder:text-muted-foreground/60"
          />
          <span className="pr-3 text-xs text-muted-foreground">mmHg</span>
        </div>
        <p className={cn('min-h-4 text-[11px] leading-4', tonoPresion === 'alerta' ? 'font-medium text-destructive' : tonoPresion === 'aviso' ? 'text-aviso' : 'text-muted-foreground')}>
          {pista(tonoPresion, anteriores?.presionSistolica && anteriores?.presionDiastolica ? `${anteriores.presionSistolica}/${anteriores.presionDiastolica}` : null)}
        </p>
      </div>
      <Campo id="fc" etiqueta="Frec. cardíaca" unidad="lpm" placeholder="72" valor={valor.frecuenciaCardiaca} onChange={set('frecuenciaCardiaca')} tono={tono('frecuenciaCardiaca')} anterior={ant('frecuenciaCardiaca')} />
      <Campo id="fr" etiqueta="Frec. respiratoria" unidad="rpm" placeholder="16" valor={valor.frecuenciaRespiratoria} onChange={set('frecuenciaRespiratoria')} tono={tono('frecuenciaRespiratoria')} anterior={ant('frecuenciaRespiratoria')} />
      <Campo id="temp" etiqueta="Temperatura" unidad="°C" placeholder="36.5" decimal valor={valor.temperatura} onChange={set('temperatura')} tono={tono('temperatura')} anterior={ant('temperatura', ' °C')} />
      <Campo id="sat" etiqueta="Saturación O₂" unidad="%" placeholder="98" valor={valor.saturacionO2} onChange={set('saturacionO2')} tono={tono('saturacionO2')} anterior={ant('saturacionO2', ' %')} />
      <Campo id="peso" etiqueta="Peso" unidad="kg" placeholder="70" decimal valor={valor.pesoKg} onChange={set('pesoKg')} tono="normal" anterior={ant('pesoKg', ' kg')} />
      <Campo id="talla" etiqueta="Talla" unidad="cm" placeholder="165" decimal valor={valor.tallaCm} onChange={set('tallaCm')} tono="normal" anterior={ant('tallaCm', ' cm')} />
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground">IMC</span>
        <div className="flex h-10 items-center justify-between rounded-md bg-carton/70 px-3">
          <span className="text-[15px] font-semibold text-tinta tabular-nums">{valorImc ?? '—'}</span>
          {clase && (
            <span
              className={cn(
                'rounded-[4px] px-1.5 py-0.5 text-[11px] font-medium',
                clase.tono === 'normal' ? 'bg-exito-suave text-exito' : clase.tono === 'aviso' ? 'bg-aviso-suave text-aviso' : 'bg-peligro-suave text-destructive',
              )}
            >
              {clase.etiqueta}
            </span>
          )}
        </div>
        <p className="min-h-4 text-[11px] leading-4 text-muted-foreground">{valorImc === null ? 'Se calcula con peso y talla' : 'kg/m²'}</p>
      </div>
      <Campo id="glu" etiqueta="Glucosa" unidad="mg/dL" placeholder="—" valor={valor.glucosaMgDl} onChange={set('glucosaMgDl')} tono={tono('glucosaMgDl')} anterior={ant('glucosaMgDl', ' mg/dL')} />
    </div>
  )
}

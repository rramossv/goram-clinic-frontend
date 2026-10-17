import type { ConsultaResponse } from '@/types'
import { clasificacionImc, evaluarSigno, fechaLarga, imc, presion, tieneSignos, type Tono } from '@/lib/clinica'
import { detalleItem } from '@/components/consultas/receta-editor'
import { cn } from '@/lib/utils'
import { CalendarCheck } from 'lucide-react'

const CLASE_VALOR: Record<Tono, string> = {
  normal: 'text-tinta',
  aviso: 'text-aviso',
  alerta: 'text-destructive',
}

export function SignosLibro({ consulta, edad, compacto }: { consulta: ConsultaResponse; edad: number | null; compacto?: boolean }) {
  if (!tieneSignos(consulta)) return null
  const tonoPA: Tono = [evaluarSigno('presionSistolica', consulta, edad), evaluarSigno('presionDiastolica', consulta, edad)].reduce<Tono>(
    (peor, t) => (t === 'alerta' || peor === 'alerta' ? 'alerta' : t === 'aviso' || peor === 'aviso' ? 'aviso' : 'normal'),
    'normal',
  )
  const valorImc = imc(consulta.pesoKg, consulta.tallaCm)
  const items: { etiqueta: string; valor: string | null; unidad: string; tono: Tono }[] = [
    { etiqueta: 'PA', valor: presion(consulta), unidad: 'mmHg', tono: tonoPA },
    { etiqueta: 'FC', valor: consulta.frecuenciaCardiaca?.toString() ?? null, unidad: 'lpm', tono: evaluarSigno('frecuenciaCardiaca', consulta, edad) },
    { etiqueta: 'FR', valor: consulta.frecuenciaRespiratoria?.toString() ?? null, unidad: 'rpm', tono: evaluarSigno('frecuenciaRespiratoria', consulta, edad) },
    { etiqueta: 'Temp.', valor: consulta.temperatura?.toString() ?? null, unidad: '°C', tono: evaluarSigno('temperatura', consulta, edad) },
    { etiqueta: 'SatO₂', valor: consulta.saturacionO2?.toString() ?? null, unidad: '%', tono: evaluarSigno('saturacionO2', consulta, edad) },
    { etiqueta: 'Peso', valor: consulta.pesoKg?.toString() ?? null, unidad: 'kg', tono: 'normal' },
    { etiqueta: 'Talla', valor: consulta.tallaCm?.toString() ?? null, unidad: 'cm', tono: 'normal' },
    {
      etiqueta: 'IMC',
      valor: valorImc?.toString() ?? null,
      unidad: valorImc && (edad === null || edad >= 18) ? clasificacionImc(valorImc).etiqueta : '',
      tono: valorImc && (edad === null || edad >= 18) ? (clasificacionImc(valorImc).tono === 'normal' ? 'normal' : 'aviso') : 'normal',
    },
    { etiqueta: 'Glucosa', valor: consulta.glucosaMgDl?.toString() ?? null, unidad: 'mg/dL', tono: evaluarSigno('glucosaMgDl', consulta, edad) },
  ].filter((i) => i.valor !== null) as { etiqueta: string; valor: string; unidad: string; tono: Tono }[]

  return (
    <dl className="flex flex-wrap gap-2">
      {items.map((i) => (
        <div key={i.etiqueta} className={cn('rounded-md border bg-card px-3 py-2', compacto ? 'min-w-[5.5rem]' : 'min-w-[7rem]')}>
          <dt className="text-[11px] font-medium text-muted-foreground">{i.etiqueta}</dt>
          <dd className={cn('mt-0.5 font-semibold tabular-nums', compacto ? 'text-sm' : 'text-base', CLASE_VALOR[i.tono])}>
            {i.valor} <span className="text-[11px] font-normal text-muted-foreground">{i.unidad}</span>
          </dd>
        </div>
      ))}
    </dl>
  )
}

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">{titulo}</h3>
      {children}
    </section>
  )
}

export function ListaDiagnosticos({ consulta }: { consulta: ConsultaResponse }) {
  if (!consulta.diagnosticos.length && !consulta.diagnostico) return null
  return (
    <div className="flex flex-col gap-1.5">
      {consulta.diagnosticos.map((d) => (
        <p key={`${d.codigo}-${d.descripcion}`} className="flex items-baseline gap-2.5 text-sm">
          {d.codigo && <span className="font-mono text-xs font-semibold text-info">{d.codigo}</span>}
          <span className="text-tinta">{d.descripcion}</span>
        </p>
      ))}
      {consulta.diagnostico && <p className="text-sm whitespace-pre-wrap text-muted-foreground">{consulta.diagnostico}</p>}
    </div>
  )
}

export function ListaReceta({ consulta }: { consulta: ConsultaResponse }) {
  if (consulta.recetaItems.length) {
    return (
      <ol className="flex flex-col gap-2">
        {consulta.recetaItems.map((r, i) => (
          <li key={i} className="flex gap-2.5 text-sm">
            <span className="w-4 shrink-0 text-muted-foreground tabular-nums">{i + 1}.</span>
            <div>
              <p className="font-medium text-tinta">{r.medicamento}</p>
              {detalleItem(r) && <p className="text-muted-foreground">{detalleItem(r)}</p>}
              {r.indicaciones && <p className="text-muted-foreground italic">{r.indicaciones}</p>}
            </div>
          </li>
        ))}
      </ol>
    )
  }
  if (consulta.receta) return <p className="text-sm whitespace-pre-wrap text-tinta">{consulta.receta}</p>
  return null
}

/** La nota clinica completa, en lectura. */
export function ResumenConsulta({ consulta, edad }: { consulta: ConsultaResponse; edad: number | null }) {
  const tieneReceta = consulta.recetaItems.length > 0 || !!consulta.receta
  return (
    <div className="flex flex-col gap-6">
      {consulta.motivoConsulta && (
        <Bloque titulo="Motivo de consulta">
          <p className="text-[15px] text-tinta">{consulta.motivoConsulta}</p>
        </Bloque>
      )}
      {tieneSignos(consulta) && (
        <Bloque titulo="Signos vitales">
          <SignosLibro consulta={consulta} edad={edad} />
        </Bloque>
      )}
      {(consulta.notas || consulta.examenFisico) && (
        <div className="grid gap-6 md:grid-cols-2">
          {consulta.notas && (
            <Bloque titulo="Evolución">
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-tinta">{consulta.notas}</p>
            </Bloque>
          )}
          {consulta.examenFisico && (
            <Bloque titulo="Examen físico">
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-tinta">{consulta.examenFisico}</p>
            </Bloque>
          )}
        </div>
      )}
      {(consulta.diagnosticos.length > 0 || consulta.diagnostico) && (
        <Bloque titulo="Diagnóstico">
          <ListaDiagnosticos consulta={consulta} />
        </Bloque>
      )}
      {tieneReceta && (
        <Bloque titulo="Receta">
          <ListaReceta consulta={consulta} />
        </Bloque>
      )}
      {consulta.indicaciones && (
        <Bloque titulo="Indicaciones y plan">
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-tinta">{consulta.indicaciones}</p>
        </Bloque>
      )}
      {consulta.proximoControl && (
        <p className="inline-flex items-center gap-2 self-start rounded-md bg-info-suave px-3 py-2 text-sm text-info">
          <CalendarCheck className="size-4" />
          Próximo control: <span className="font-semibold">{fechaLarga(consulta.proximoControl)}</span>
        </p>
      )}
    </div>
  )
}

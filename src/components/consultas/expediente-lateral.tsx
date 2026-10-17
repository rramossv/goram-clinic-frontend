import { Link } from 'react-router-dom'
import type { ConsultaResponse, PacienteResponse } from '@/types'
import { edadLegible, fechaCorta, presion, tieneAlergias } from '@/lib/clinica'
import { CodigoPaciente } from '@/components/codigo-paciente'
import { AlertTriangle, ChevronRight, Droplet, Pill } from 'lucide-react'

function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">{etiqueta}</p>
      <div className="text-sm whitespace-pre-wrap text-tinta">{children}</div>
    </div>
  )
}

export function AlertaAlergias({ alergias }: { alergias: string | null }) {
  if (!tieneAlergias(alergias)) return null
  return (
    <div role="alert" className="flex items-start gap-2.5 rounded-lg bg-peligro-suave px-3 py-2.5 text-destructive ring-1 ring-destructive/25 ring-inset">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs font-bold tracking-[0.06em] uppercase">Alergias</p>
        <p className="text-sm font-medium">{alergias}</p>
      </div>
    </div>
  )
}

interface Props {
  paciente: PacienteResponse
  /** consultas anteriores a la actual, de la mas reciente a la mas antigua */
  anteriores: ConsultaResponse[]
}

export function ExpedienteLateral({ paciente, anteriores }: Props) {
  const sexo = paciente.sexo === 'F' ? 'Femenino' : paciente.sexo === 'M' ? 'Masculino' : null
  const edad = edadLegible(paciente.fechaNacimiento)

  return (
    <aside className="flex flex-col gap-4 rounded-lg border bg-card p-4">
      <div className="flex items-center gap-3">
        <CodigoPaciente id={paciente.id} tamano="lg" />
        <div className="min-w-0">
          <p className="truncate font-semibold text-tinta">{paciente.nombre}</p>
          <p className="text-sm text-muted-foreground">{[edad, sexo].filter(Boolean).join(' · ') || 'Sin edad registrada'}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {paciente.tipoSangre && (
          <span className="inline-flex h-6 items-center gap-1 rounded-[4px] bg-peligro-suave px-2 text-xs font-semibold text-destructive ring-1 ring-destructive/20 ring-inset">
            <Droplet className="size-3.5" />
            {paciente.tipoSangre}
          </span>
        )}
        {paciente.documentoIdentidad && (
          <span className="inline-flex h-6 items-center rounded-[4px] bg-muted px-2 text-xs text-muted-foreground">DUI {paciente.documentoIdentidad}</span>
        )}
      </div>

      <AlertaAlergias alergias={paciente.alergias} />
      {!tieneAlergias(paciente.alergias) && (
        <Dato etiqueta="Alergias">
          <span className="text-muted-foreground">{paciente.alergias || 'Sin alergias registradas'}</span>
        </Dato>
      )}

      {paciente.antecedentes && <Dato etiqueta="Antecedentes">{paciente.antecedentes}</Dato>}
      {paciente.medicamentosActuales && (
        <Dato etiqueta="Medicamentos actuales">
          <span className="flex items-start gap-1.5">
            <Pill className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
            {paciente.medicamentosActuales}
          </span>
        </Dato>
      )}

      <div className="flex flex-col gap-2 border-t pt-4">
        <p className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
          {anteriores.length ? `Consultas anteriores (${anteriores.length})` : 'Primera consulta'}
        </p>
        {anteriores.length === 0 && <p className="text-sm text-muted-foreground">No hay consultas previas registradas para este paciente.</p>}
        <ol className="flex flex-col">
          {anteriores.slice(0, 6).map((c) => {
            const dx = c.diagnosticos[0]?.descripcion ?? c.diagnostico
            const pa = presion(c)
            return (
              <li key={c.id}>
                <details className="group border-b py-2 last:border-b-0">
                  <summary className="flex cursor-pointer list-none items-start gap-2 [&::-webkit-details-marker]:hidden">
                    <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-tinta">{fechaCorta(c.citaFechaHora)}</p>
                      <p className="truncate text-xs text-muted-foreground">{dx ?? c.motivoConsulta ?? 'Sin diagnóstico'}</p>
                    </div>
                  </summary>
                  <div className="mt-2 ml-6 flex flex-col gap-1.5 text-xs text-muted-foreground">
                    {(pa || c.pesoKg) && (
                      <p className="tabular-nums">
                        {pa && <>PA {pa}</>}
                        {pa && c.pesoKg && ' · '}
                        {c.pesoKg && <>{c.pesoKg} kg</>}
                      </p>
                    )}
                    {c.recetaItems.length > 0 && (
                      <ul className="flex flex-col gap-0.5">
                        {c.recetaItems.map((r, i) => (
                          <li key={i} className="text-tinta">• {r.medicamento}</li>
                        ))}
                      </ul>
                    )}
                    {!c.recetaItems.length && c.receta && <p className="whitespace-pre-wrap text-tinta">{c.receta}</p>}
                    {c.indicaciones && <p className="whitespace-pre-wrap">{c.indicaciones}</p>}
                  </div>
                </details>
              </li>
            )
          })}
        </ol>
        <Link to={`/pacientes/${paciente.id}`} className="text-sm font-medium text-primary hover:underline">
          Ver expediente completo
        </Link>
      </div>
    </aside>
  )
}

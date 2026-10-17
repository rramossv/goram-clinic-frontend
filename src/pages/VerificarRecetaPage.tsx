import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiFetch, ApiRequestError } from '@/lib/api'
import type { VerificacionReceta } from '@/types'
import { fechaLarga } from '@/lib/clinica'
import { detalleItem } from '@/components/consultas/receta-editor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { BadgeCheck, SearchX, ShieldCheck } from 'lucide-react'

// Publica: la abre una farmacia (o el paciente) al escanear el QR de la
// receta. Muestra lo justo para confirmar que el documento es autentico.
export function VerificarRecetaPage() {
  const { codigo } = useParams<{ codigo?: string }>()
  const navigate = useNavigate()
  const [texto, setTexto] = useState(codigo ?? '')
  const [resultado, setResultado] = useState<VerificacionReceta | null>(null)
  const [estado, setEstado] = useState<'inicio' | 'cargando' | 'valida' | 'no-existe' | 'error'>(codigo ? 'cargando' : 'inicio')

  useEffect(() => {
    document.title = 'Verificar receta · GoRam Clinic'
  }, [])

  useEffect(() => {
    if (!codigo) {
      setEstado('inicio')
      return
    }
    setEstado('cargando')
    apiFetch<VerificacionReceta>(`/api/v1/publico/recetas/${encodeURIComponent(codigo)}`, { auth: false })
      .then((r) => {
        setResultado(r)
        setEstado('valida')
      })
      .catch((err) => setEstado(err instanceof ApiRequestError && err.status === 404 ? 'no-existe' : 'error'))
  }, [codigo])

  function buscar(e: FormEvent) {
    e.preventDefault()
    const limpio = texto.trim().toUpperCase().replace(/\s+/g, '')
    if (limpio) navigate(`/verificar/${limpio}`)
  }

  return (
    <div className="min-h-svh bg-carton">
      <header className="bg-sidebar text-sidebar-foreground">
        <div className="mx-auto flex max-w-2xl items-center gap-2.5 px-4 py-4">
          <ShieldCheck className="size-5" />
          <p className="font-semibold text-sidebar-accent-foreground">GoRam Clinic</p>
          <span className="text-sm opacity-70">· Verificación de recetas</span>
        </div>
      </header>

      <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
        <form onSubmit={buscar} className="flex flex-col gap-2 rounded-lg border bg-card p-4 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-1.5">
            <label htmlFor="codigo" className="text-sm font-medium">
              Código impreso en la receta
            </label>
            <Input id="codigo" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Ej. 7KQ2M9XH4P" className="font-mono uppercase" autoComplete="off" />
          </div>
          <Button type="submit">Verificar</Button>
        </form>

        {estado === 'cargando' && <Skeleton className="h-64 w-full" />}

        {estado === 'valida' && resultado && (
          <section className="overflow-hidden rounded-lg border bg-card">
            <div className="flex items-center gap-3 bg-exito-suave px-5 py-4 text-exito">
              <BadgeCheck className="size-7 shrink-0" />
              <div>
                <p className="font-semibold">Receta auténtica</p>
                <p className="text-sm">Emitida el {fechaLarga(resultado.emitidaEn)} y registrada en el expediente del establecimiento.</p>
              </div>
            </div>
            <dl className="grid gap-4 px-5 py-5 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Médico</dt>
                <dd className="font-semibold text-tinta">{resultado.doctorNombre}</dd>
                {resultado.doctorEspecialidad && <dd className="text-sm text-muted-foreground">{resultado.doctorEspecialidad}</dd>}
                {resultado.doctorJvpm && <dd className="text-sm text-muted-foreground">J.V.P.M. n.º {resultado.doctorJvpm}</dd>}
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Establecimiento</dt>
                <dd className="font-semibold text-tinta">{resultado.clinicaNombre}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Paciente</dt>
                <dd className="font-semibold text-tinta">{resultado.pacienteIniciales}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Código</dt>
                <dd className="font-mono font-semibold text-tinta">{resultado.codigo}</dd>
              </div>
            </dl>
            <div className="border-t px-5 py-4">
              <p className="mb-2 text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase">Medicamentos indicados</p>
              {resultado.medicamentos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Esta receta fue escrita en texto libre; compará con el documento impreso.</p>
              ) : (
                <ol className="flex flex-col gap-2">
                  {resultado.medicamentos.map((m, i) => (
                    <li key={i} className="text-sm">
                      <span className="font-medium text-tinta">
                        {i + 1}. {m.medicamento}
                      </span>
                      {detalleItem(m) && <span className="text-muted-foreground"> — {detalleItem(m)}</span>}
                    </li>
                  ))}
                </ol>
              )}
              <p className="mt-4 text-xs text-muted-foreground">Si algún medicamento del papel no coincide con esta lista, la receta pudo haber sido alterada.</p>
            </div>
          </section>
        )}

        {estado === 'no-existe' && (
          <section className="flex items-start gap-3 rounded-lg border bg-card px-5 py-5">
            <SearchX className="mt-0.5 size-6 shrink-0 text-destructive" />
            <div>
              <p className="font-semibold text-tinta">No encontramos una receta con ese código</p>
              <p className="text-sm text-muted-foreground">Revisá que esté escrito igual que en el papel. Si el código es correcto, el documento no fue emitido por GoRam Clinic.</p>
            </div>
          </section>
        )}

        {estado === 'error' && <p className="text-sm text-destructive">No se pudo verificar en este momento. Intentá de nuevo en unos minutos.</p>}
      </main>
    </div>
  )
}

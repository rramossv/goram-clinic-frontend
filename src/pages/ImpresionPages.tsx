import { useEffect, useState, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { apiFetch } from '@/lib/api'
import type {
  CitaResponse,
  ClinicaResponse,
  ConsultaResponse,
  DocumentoDteResponse,
  FacturaResponse,
  PacienteResponse,
} from '@/types'
import { Button } from '@/components/ui/button'
import { Printer, X } from 'lucide-react'

// Hojas para imprimir (carta). Se abren en una pestana aparte, se imprimen
// solas al cargar y no llevan el menu ni los colores de pantalla.

function edadDe(fechaNacimiento: string | null) {
  if (!fechaNacimiento) return null
  const [anio, mes, dia] = fechaNacimiento.split('-').map(Number)
  const hoy = new Date()
  let edad = hoy.getFullYear() - anio
  if (hoy < new Date(hoy.getFullYear(), mes - 1, dia)) edad -= 1
  return edad
}

const fechaLarga = (iso: string) =>
  new Date(iso).toLocaleDateString('es-SV', { day: 'numeric', month: 'long', year: 'numeric' })

const dinero = (valor: number) => `$${Number(valor).toFixed(2)}`

function Hoja({ listo, error, titulo, children }: { listo: boolean; error: string | null; titulo: string; children: ReactNode }) {
  useEffect(() => {
    document.title = titulo
  }, [titulo])

  useEffect(() => {
    if (!listo) return
    const t = setTimeout(() => window.print(), 400)
    return () => clearTimeout(t)
  }, [listo])

  return (
    <div className="min-h-svh bg-carton py-8 print:bg-white print:py-0">
      <style>{'@page { size: letter; margin: 16mm; } @media print { html, body { background: #fff !important; } }'}</style>
      <div className="mx-auto mb-4 flex max-w-[8.5in] justify-end gap-2 px-4 print:hidden">
        <Button variant="outline" onClick={() => window.close()}>
          <X />
          Cerrar
        </Button>
        <Button onClick={() => window.print()} disabled={!listo}>
          <Printer />
          Imprimir
        </Button>
      </div>
      <article className="mx-auto min-h-[10in] max-w-[8.5in] bg-white px-14 py-12 text-[13px] leading-relaxed text-[#1b2433] shadow-[0_8px_30px_-12px_rgb(16_38_59/0.35)] print:min-h-0 print:max-w-none print:p-0 print:shadow-none">
        {error ? <p className="text-center text-red-700">{error}</p> : listo ? children : <p className="text-center text-slate-500">Preparando documento...</p>}
      </article>
    </div>
  )
}

function Membrete({ clinica, derecha }: { clinica: ClinicaResponse; derecha?: ReactNode }) {
  return (
    <header className="flex items-start justify-between gap-6 border-b-2 border-[#1f3a5f] pb-4">
      <div>
        <p className="text-xl font-bold text-[#1f3a5f]">{clinica.nombre}</p>
        {clinica.giro && <p className="text-slate-600">{clinica.giro}</p>}
        {clinica.direccion && <p className="text-slate-600">{clinica.direccion}</p>}
        {clinica.telefono && <p className="text-slate-600">Tel. {clinica.telefono}</p>}
      </div>
      {derecha}
    </header>
  )
}

export function ImprimirRecetaPage() {
  const { citaId } = useParams<{ citaId: string }>()
  const [datos, setDatos] = useState<{ cita: CitaResponse; consulta: ConsultaResponse; paciente: PacienteResponse; clinica: ClinicaResponse } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!citaId) return
    Promise.all([
      apiFetch<CitaResponse>(`/api/v1/citas/${citaId}`),
      apiFetch<ConsultaResponse>(`/api/v1/consultas/por-cita/${citaId}`),
      apiFetch<ClinicaResponse>('/api/v1/clinica'),
    ])
      .then(async ([cita, consulta, clinica]) => {
        const paciente = await apiFetch<PacienteResponse>(`/api/v1/pacientes/${cita.pacienteId}`)
        setDatos({ cita, consulta, paciente, clinica })
      })
      .catch(() => setError('No se pudo cargar la receta. Verificá que la consulta esté registrada.'))
  }, [citaId])

  const edad = datos ? edadDe(datos.paciente.fechaNacimiento) : null

  return (
    <Hoja listo={datos !== null} error={error} titulo={datos ? `Receta - ${datos.paciente.nombre}` : 'Receta'}>
      {datos && (
        <div className="flex min-h-[9in] flex-col print:min-h-[9.4in]">
          <Membrete
            clinica={datos.clinica}
            derecha={
              <div className="text-right">
                <p className="text-base font-semibold">{datos.cita.doctorNombre}</p>
                <p className="text-slate-600">{fechaLarga(datos.consulta.creadoEn)}</p>
              </div>
            }
          />
          <section className="mt-5 grid grid-cols-[1fr_auto] gap-x-8 gap-y-1 border-b pb-4">
            <p>
              <span className="text-slate-500">Paciente: </span>
              <span className="font-semibold">{datos.paciente.nombre}</span>
            </p>
            <p>
              <span className="text-slate-500">Edad: </span>
              {edad !== null ? `${edad} ${edad === 1 ? 'año' : 'años'}` : '—'}
            </p>
            {datos.paciente.alergias && (
              <p className="col-span-2">
                <span className="text-slate-500">Alergias: </span>
                {datos.paciente.alergias}
              </p>
            )}
          </section>
          <section className="mt-6 flex-1">
            <p className="font-serif text-3xl font-bold text-[#1f3a5f] italic">Rx</p>
            <p className="mt-4 text-[15px] leading-8 whitespace-pre-wrap">{datos.consulta.receta || 'Sin indicaciones registradas.'}</p>
          </section>
          <footer className="mt-16 flex justify-end">
            <div className="w-64 border-t border-slate-400 pt-2 text-center">
              <p className="font-semibold">{datos.cita.doctorNombre}</p>
              <p className="text-xs text-slate-500">Firma y sello</p>
            </div>
          </footer>
        </div>
      )}
    </Hoja>
  )
}

export function ImprimirFacturaPage() {
  const { facturaId } = useParams<{ facturaId: string }>()
  const [datos, setDatos] = useState<{ factura: FacturaResponse; paciente: PacienteResponse; clinica: ClinicaResponse; dte: DocumentoDteResponse | null } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!facturaId) return
    Promise.all([apiFetch<FacturaResponse>(`/api/v1/facturas/${facturaId}`), apiFetch<ClinicaResponse>('/api/v1/clinica')])
      .then(async ([factura, clinica]) => {
        const [paciente, dte] = await Promise.all([
          apiFetch<PacienteResponse>(`/api/v1/pacientes/${factura.pacienteId}`),
          factura.tipoDte === 'FE'
            ? apiFetch<DocumentoDteResponse>(`/api/v1/facturas/${factura.id}/dte`).catch(() => null)
            : Promise.resolve(null),
        ])
        setDatos({ factura, paciente, clinica, dte })
      })
      .catch(() => setError('No se pudo cargar la factura.'))
  }, [facturaId])

  const f = datos?.factura
  const electronica = f?.tipoDte === 'FE'

  return (
    <Hoja listo={datos !== null} error={error} titulo={f ? `Factura ${f.id.slice(0, 8).toUpperCase()}` : 'Factura'}>
      {datos && f && (
        <div className="relative">
          {f.estado === 'ANULADA' && (
            <p className="pointer-events-none absolute inset-x-0 top-48 -rotate-12 text-center text-7xl font-bold tracking-widest text-red-600/20">
              ANULADA
            </p>
          )}
          <Membrete
            clinica={datos.clinica}
            derecha={
              <div className="text-right">
                <p className="text-base font-bold text-[#1f3a5f]">{electronica ? 'Factura electrónica' : 'Factura'}</p>
                <p>N.º interno {f.id.slice(0, 8).toUpperCase()}</p>
                <p className="text-slate-600">{fechaLarga(f.creadoEn)}</p>
                <p className="mt-1 text-slate-600">NIT {datos.clinica.nit}</p>
                {datos.clinica.nrc && <p className="text-slate-600">NRC {datos.clinica.nrc}</p>}
              </div>
            }
          />

          <section className="mt-5 border-b pb-4">
            <p>
              <span className="text-slate-500">Cliente: </span>
              <span className="font-semibold">{datos.paciente.nombre}</span>
            </p>
            {datos.paciente.documentoIdentidad && (
              <p>
                <span className="text-slate-500">Documento: </span>
                {datos.paciente.documentoIdentidad}
              </p>
            )}
            {datos.paciente.direccion && (
              <p>
                <span className="text-slate-500">Dirección: </span>
                {datos.paciente.direccion}
              </p>
            )}
          </section>

          <table className="mt-6 w-full [font-variant-numeric:tabular-nums]">
            <thead>
              <tr className="border-b-2 border-[#1f3a5f] text-left text-xs tracking-wide text-slate-600 uppercase">
                <th className="py-2 font-semibold">Descripción</th>
                <th className="w-16 py-2 text-right font-semibold">Cant.</th>
                <th className="w-28 py-2 text-right font-semibold">Precio</th>
                <th className="w-28 py-2 text-right font-semibold">Importe</th>
              </tr>
            </thead>
            <tbody>
              {f.items.map((item, i) => (
                <tr key={i} className="border-b border-slate-200">
                  <td className="py-2">{item.descripcion}</td>
                  <td className="py-2 text-right">{item.cantidad}</td>
                  <td className="py-2 text-right">{dinero(item.precioUnitario)}</td>
                  <td className="py-2 text-right">{dinero(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 ml-auto w-64 [font-variant-numeric:tabular-nums]">
            <div className="flex justify-between py-1">
              <span className="text-slate-600">Subtotal</span>
              <span>{dinero(f.subtotal)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-600">IVA 13%</span>
              <span>{dinero(f.iva)}</span>
            </div>
            <div className="flex justify-between border-t-2 border-[#1f3a5f] py-2 text-base font-bold">
              <span>Total</span>
              <span>{dinero(f.total)}</span>
            </div>
          </div>

          <footer className="mt-10 border-t pt-4 text-xs text-slate-500">
            {electronica ? (
              datos.dte ? (
                <div className="grid gap-1">
                  <p className="font-semibold text-slate-700">Representación impresa del Documento Tributario Electrónico</p>
                  <p>Código de generación: {datos.dte.codigoGeneracion}</p>
                  <p>Número de control: {datos.dte.numeroControl}</p>
                  <p>Sello de recepción: {datos.dte.selloRecepcion ?? 'pendiente'}</p>
                  {datos.dte.ambiente === '00' && <p className="font-semibold text-amber-700">Emitido en ambiente de pruebas: sin validez fiscal.</p>}
                </div>
              ) : (
                <p className="font-semibold text-amber-700">DTE aún no emitido: este documento no tiene validez fiscal todavía.</p>
              )
            ) : (
              <p>Documento interno de control. No es un comprobante con validez fiscal ante el Ministerio de Hacienda.</p>
            )}
          </footer>
        </div>
      )}
    </Hoja>
  )
}

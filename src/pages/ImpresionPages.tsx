import { useEffect, useState, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import QRCode from 'qrcode'
import { apiFetch } from '@/lib/api'
import type {
  CitaResponse,
  ClinicaResponse,
  ConsultaResponse,
  DocumentoDteResponse,
  FacturaResponse,
  PacienteResponse,
  PerfilProfesional,
} from '@/types'
import { edadDe, fechaLarga, presion } from '@/lib/clinica'
import { detalleItem } from '@/components/consultas/receta-editor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { Printer, X } from 'lucide-react'

// Hojas para imprimir. Se abren en una pestana aparte, sin el menu ni los
// colores de pantalla. La receta y la factura se imprimen solas al cargar; la
// constancia y la incapacidad esperan a que el medico ajuste el texto.

const TINTA = '#16263d'
const AZUL = '#1f3a5f'

const dinero = (valor: number) => `$${Number(valor).toFixed(2)}`
const hora = (iso: string) => new Date(iso).toLocaleTimeString('es-SV', { hour: 'numeric', minute: '2-digit' })

type Formato = 'carta' | 'media'

function useQr(texto: string | null) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!texto) return
    QRCode.toDataURL(texto, { margin: 0, width: 240, errorCorrectionLevel: 'M', color: { dark: TINTA, light: '#ffffff' } })
      .then(setDataUrl)
      .catch(() => setDataUrl(null))
  }, [texto])
  return dataUrl
}

function Hoja({
  listo,
  error,
  titulo,
  formato = 'carta',
  autoImprimir = true,
  barra,
  panel,
  children,
}: {
  listo: boolean
  error: string | null
  titulo: string
  formato?: Formato
  autoImprimir?: boolean
  barra?: ReactNode
  panel?: ReactNode
  children: ReactNode
}) {
  useEffect(() => {
    document.title = titulo
  }, [titulo])

  useEffect(() => {
    if (!listo || !autoImprimir) return
    // da tiempo a que carguen logo, firma y QR antes de abrir el dialogo
    const t = setTimeout(() => window.print(), 700)
    return () => clearTimeout(t)
  }, [listo, autoImprimir])

  const media = formato === 'media'

  return (
    <div className="min-h-svh bg-carton py-8 print:bg-white print:py-0">
      <style>{`@page { size: ${media ? '5.5in 8.5in' : 'letter'}; margin: ${media ? '9mm' : '14mm'}; } @media print { html, body { background: #fff !important; } }`}</style>
      <div className={cn('mx-auto mb-4 flex flex-wrap items-center justify-between gap-2 px-4 print:hidden', media ? 'max-w-[5.5in]' : 'max-w-[8.5in]')}>
        <div className="flex flex-wrap items-center gap-2">{barra}</div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.close()}>
            <X />
            Cerrar
          </Button>
          <Button onClick={() => window.print()} disabled={!listo}>
            <Printer />
            Imprimir
          </Button>
        </div>
      </div>
      {panel && <div className={cn('mx-auto mb-4 px-4 print:hidden', 'max-w-[8.5in]')}>{panel}</div>}
      <article
        style={{ color: TINTA }}
        className={cn(
          'mx-auto bg-white shadow-[0_8px_30px_-12px_rgb(16_38_59/0.35)] print:min-h-0 print:max-w-none print:p-0 print:shadow-none',
          media ? 'min-h-[8.5in] max-w-[5.5in] px-8 py-8 text-[11px] leading-snug' : 'min-h-[11in] max-w-[8.5in] px-14 py-12 text-[13px] leading-relaxed',
        )}
      >
        {error ? <p className="text-center text-red-700">{error}</p> : listo ? children : <p className="text-center text-slate-500">Preparando documento…</p>}
      </article>
    </div>
  )
}

/** Encabezado comun: logo y datos de la clinica a la izquierda, el medico a la derecha. */
function Membrete({ clinica, medico, derecha, compacto }: { clinica: ClinicaResponse; medico?: PerfilProfesional | null; derecha?: ReactNode; compacto?: boolean }) {
  return (
    <header className={cn('flex items-start justify-between gap-6 pb-3', compacto ? 'gap-3' : 'pb-4')} style={{ borderBottom: `2px solid ${AZUL}` }}>
      <div className="flex min-w-0 items-start gap-3">
        {clinica.logoImagen && <img src={clinica.logoImagen} alt="" className={cn('w-auto object-contain', compacto ? 'max-h-11 max-w-20' : 'max-h-16 max-w-32')} />}
        <div className="min-w-0">
          <p className={cn('font-bold', compacto ? 'text-[13px]' : 'text-xl')} style={{ color: AZUL }}>
            {clinica.nombre}
          </p>
          {clinica.direccion && <p className="text-slate-600">{clinica.direccion}</p>}
          {clinica.telefono && <p className="text-slate-600">Tel. {clinica.telefono}</p>}
        </div>
      </div>
      {derecha ??
        (medico && (
          <div className="shrink-0 text-right">
            <p className={cn('font-semibold', compacto ? 'text-[12px]' : 'text-base')}>{medico.nombre}</p>
            {medico.especialidad && <p className="text-slate-600">{medico.especialidad}</p>}
            {medico.jvpm && <p className="text-slate-600">J.V.P.M. n.º {medico.jvpm}</p>}
          </div>
        ))}
    </header>
  )
}

function Firma({ medico, compacto }: { medico: PerfilProfesional; compacto?: boolean }) {
  return (
    <div className={cn('text-center', compacto ? 'w-44' : 'w-64')}>
      <div className={cn('flex items-end justify-center', compacto ? 'h-12' : 'h-20')}>
        {medico.firmaImagen && <img src={medico.firmaImagen} alt="Firma" className="max-h-full max-w-full object-contain" />}
      </div>
      <div className="border-t border-slate-400 pt-1.5">
        <p className="font-semibold">{medico.nombre}</p>
        <p className="text-[0.85em] text-slate-500">{medico.jvpm ? `J.V.P.M. n.º ${medico.jvpm}` : 'Firma y sello'}</p>
      </div>
    </div>
  )
}

interface DatosClinicos {
  cita: CitaResponse
  consulta: ConsultaResponse
  paciente: PacienteResponse
  clinica: ClinicaResponse
  medico: PerfilProfesional
}

function useDatosClinicos(citaId: string | undefined) {
  const [datos, setDatos] = useState<DatosClinicos | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (!citaId) return
    Promise.all([
      apiFetch<CitaResponse>(`/api/v1/citas/${citaId}`),
      apiFetch<ConsultaResponse>(`/api/v1/consultas/por-cita/${citaId}`),
      apiFetch<ClinicaResponse>('/api/v1/clinica'),
    ])
      .then(async ([cita, consulta, clinica]) => {
        const [paciente, medico] = await Promise.all([
          apiFetch<PacienteResponse>(`/api/v1/pacientes/${cita.pacienteId}`),
          apiFetch<PerfilProfesional>(`/api/v1/usuarios/${cita.doctorId}/perfil-profesional`),
        ])
        setDatos({ cita, consulta, paciente, clinica, medico })
      })
      .catch(() => setError('No se pudo cargar el documento. Verificá que la consulta esté registrada.'))
  }, [citaId])
  return { datos, error }
}

function leerFormato(): Formato {
  try {
    return localStorage.getItem('goram_formato_receta') === 'media' ? 'media' : 'carta'
  } catch {
    return 'carta'
  }
}

export function ImprimirRecetaPage() {
  const { citaId } = useParams<{ citaId: string }>()
  const { datos, error } = useDatosClinicos(citaId)
  const [formato, setFormato] = useState<Formato>(leerFormato)
  const urlVerificacion = datos ? `${window.location.origin}/verificar/${datos.consulta.codigoVerificacion}` : null
  const qr = useQr(urlVerificacion)
  const media = formato === 'media'

  function cambiarFormato(f: Formato) {
    setFormato(f)
    try {
      localStorage.setItem('goram_formato_receta', f)
    } catch {
      // preferencia opcional
    }
  }

  const c = datos?.consulta
  const edad = datos ? edadDe(datos.paciente.fechaNacimiento) : null
  const signos = c ? [presion(c) && `PA ${presion(c)} mmHg`, c.pesoKg && `Peso ${c.pesoKg} kg`, c.temperatura && `T ${c.temperatura} °C`].filter(Boolean).join(' · ') : ''

  return (
    <Hoja
      listo={datos !== null && qr !== null}
      error={error}
      formato={formato}
      titulo={datos ? `Receta - ${datos.paciente.nombre}` : 'Receta'}
      barra={
        <div className="inline-flex rounded-md bg-background p-0.5 ring-1 ring-border" role="group" aria-label="Tamaño de papel">
          {(['carta', 'media'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => cambiarFormato(f)}
              className={cn('rounded px-3 py-1.5 text-sm font-medium', formato === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
            >
              {f === 'carta' ? 'Carta' : 'Media carta'}
            </button>
          ))}
        </div>
      }
    >
      {datos && c && (
        <div className={cn('flex flex-col', media ? 'min-h-[7.6in] print:min-h-[7.9in]' : 'min-h-[9.6in] print:min-h-[9.7in]')}>
          <Membrete clinica={datos.clinica} medico={datos.medico} compacto={media} />

          <section className={cn('grid grid-cols-[1fr_auto] gap-x-6 gap-y-0.5 border-b border-slate-200', media ? 'py-2' : 'py-3')}>
            <p>
              <span className="text-slate-500">Paciente: </span>
              <span className="font-semibold">{datos.paciente.nombre}</span>
            </p>
            <p className="text-right">
              <span className="text-slate-500">Fecha: </span>
              {fechaLarga(c.citaFechaHora)}
            </p>
            <p>
              <span className="text-slate-500">Edad: </span>
              {edad !== null ? `${edad} ${edad === 1 ? 'año' : 'años'}` : '—'}
              {datos.paciente.sexo && <span className="text-slate-500"> · {datos.paciente.sexo === 'F' ? 'Femenino' : 'Masculino'}</span>}
            </p>
            {signos && <p className="text-right text-slate-600">{signos}</p>}
            {datos.paciente.alergias && !/^\s*(ninguna|ninguno|no|niega|n\/a|sin alergias)\b/i.test(datos.paciente.alergias) && (
              <p className="col-span-2 font-semibold">Alergias: {datos.paciente.alergias}</p>
            )}
            {c.diagnosticos.length > 0 && (
              <p className="col-span-2">
                <span className="text-slate-500">Dx: </span>
                {c.diagnosticos.map((d) => (d.codigo ? `${d.descripcion} (${d.codigo})` : d.descripcion)).join('; ')}
              </p>
            )}
          </section>

          <section className={cn('flex-1', media ? 'mt-3' : 'mt-5')}>
            <p className={cn('font-serif font-bold italic', media ? 'text-2xl' : 'text-4xl')} style={{ color: AZUL }}>
              Rx
            </p>
            {c.recetaItems.length > 0 ? (
              <ol className={cn('flex flex-col', media ? 'mt-2 gap-2.5' : 'mt-4 gap-4')}>
                {c.recetaItems.map((r, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="w-4 shrink-0 text-right font-semibold text-slate-500">{i + 1}.</span>
                    <div>
                      <p className={cn('font-bold', media ? 'text-[12.5px]' : 'text-[15px]')}>{r.medicamento}</p>
                      {detalleItem(r) && <p>{detalleItem(r)}</p>}
                      {r.indicaciones && <p className="text-slate-600 italic">{r.indicaciones}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className={cn('whitespace-pre-wrap', media ? 'mt-2' : 'mt-4 text-[15px] leading-8')}>{c.receta || 'Sin medicamentos indicados.'}</p>
            )}

            {c.indicaciones && (
              <div className={cn(media ? 'mt-3' : 'mt-6')}>
                <p className="text-[0.85em] font-semibold tracking-wide text-slate-500 uppercase">Indicaciones</p>
                <p className="whitespace-pre-wrap">{c.indicaciones}</p>
              </div>
            )}
            {c.proximoControl && (
              <p className={cn('font-semibold', media ? 'mt-2' : 'mt-4')}>Próximo control: {fechaLarga(c.proximoControl)}</p>
            )}
          </section>

          <footer className={cn('flex items-end justify-between gap-4', media ? 'mt-4' : 'mt-10')}>
            <div className="flex items-end gap-2.5">
              {qr && <img src={qr} alt="Código QR de verificación" className={media ? 'size-14' : 'size-20'} />}
              <div className="text-[0.8em] leading-tight text-slate-500">
                <p className="font-semibold text-slate-700">Receta verificable</p>
                <p>Escaneá el código o ingresá a</p>
                <p>{window.location.host}/verificar</p>
                <p>
                  Código: <span className="font-mono font-semibold text-slate-700">{c.codigoVerificacion}</span>
                </p>
              </div>
            </div>
            <Firma medico={datos.medico} compacto={media} />
          </footer>
        </div>
      )}
    </Hoja>
  )
}

// ---------- constancia e incapacidad ----------

const UNIDADES = ['cero', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte', 'veintiún', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve', 'treinta']

function enLetras(n: number) {
  return n >= 0 && n <= 30 ? UNIDADES[n] : String(n)
}

function isoLocal(fecha: Date) {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
}

function sumar(iso: string, dias: number) {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + dias)
  return isoLocal(d)
}

function genero(p: PacienteResponse, f: string, m: string) {
  return p.sexo === 'F' ? f : p.sexo === 'M' ? m : `${m}(a)`
}

function textoDiagnostico(c: ConsultaResponse) {
  const lista = c.diagnosticos.map((d) => d.descripcion.charAt(0).toLowerCase() + d.descripcion.slice(1))
  if (!lista.length && c.diagnostico) return c.diagnostico
  return lista.length > 1 ? `${lista.slice(0, -1).join(', ')} y ${lista.at(-1)}` : (lista[0] ?? '')
}

function identificacion(p: PacienteResponse) {
  const edad = edadDe(p.fechaNacimiento)
  return [edad !== null ? `de ${edad} años de edad` : null, p.documentoIdentidad ? `con documento de identidad n.º ${p.documentoIdentidad}` : null].filter(Boolean).join(', ')
}

function DocumentoFirmado({ datos, titulo, cuerpo }: { datos: DatosClinicos; titulo: string; cuerpo: string }) {
  return (
    <div className="flex min-h-[9.6in] flex-col print:min-h-[9.7in]">
      <Membrete clinica={datos.clinica} medico={datos.medico} />
      <h1 className="mt-14 text-center text-lg font-bold tracking-[0.2em]" style={{ color: AZUL }}>
        {titulo}
      </h1>
      <div className="mt-10 flex-1 text-[14px] leading-7 whitespace-pre-wrap" style={{ textAlign: 'justify' }}>
        {cuerpo}
      </div>
      <footer className="mt-16 flex justify-center">
        <Firma medico={datos.medico} />
      </footer>
    </div>
  )
}

function PanelEdicion({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-4 rounded-lg border bg-card p-4 shadow-sm">{children}</div>
}

export function ImprimirConstanciaPage() {
  const { citaId } = useParams<{ citaId: string }>()
  const { datos, error } = useDatosClinicos(citaId)
  const [conDiagnostico, setConDiagnostico] = useState(false)
  const [cuerpo, setCuerpo] = useState('')

  useEffect(() => {
    if (!datos) return
    const { paciente: p, consulta: c } = datos
    const id = identificacion(p)
    const dx = textoDiagnostico(c)
    setCuerpo(
      `Por medio de la presente hago constar que ${p.nombre}${id ? `, ${id},` : ''} fue ${genero(p, 'atendida', 'atendido')} en consulta médica en este establecimiento el día ${fechaLarga(c.citaFechaHora)}, a las ${hora(c.citaFechaHora)}` +
        (conDiagnostico && dx ? `, con diagnóstico de ${dx}.` : '.') +
        `\n\nY para los usos que ${genero(p, 'la interesada', 'el interesado')} estime convenientes, se extiende la presente el ${fechaLarga(new Date().toISOString())}.`,
    )
  }, [datos, conDiagnostico])

  return (
    <Hoja
      listo={datos !== null}
      error={error}
      autoImprimir={false}
      titulo={datos ? `Constancia - ${datos.paciente.nombre}` : 'Constancia médica'}
      panel={
        datos && (
          <PanelEdicion>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={conDiagnostico} onChange={(e) => setConDiagnostico(e.target.checked)} className="size-4" />
              Incluir el diagnóstico (solo si el paciente lo autoriza)
            </label>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cuerpo">Texto de la constancia (podés ajustarlo antes de imprimir)</Label>
              <Textarea id="cuerpo" rows={6} value={cuerpo} onChange={(e) => setCuerpo(e.target.value)} />
            </div>
          </PanelEdicion>
        )
      }
    >
      {datos && <DocumentoFirmado datos={datos} titulo="CONSTANCIA MÉDICA" cuerpo={cuerpo} />}
    </Hoja>
  )
}

export function ImprimirIncapacidadPage() {
  const { citaId } = useParams<{ citaId: string }>()
  const { datos, error } = useDatosClinicos(citaId)
  const [dias, setDias] = useState(3)
  const [desde, setDesde] = useState('')
  const [cuerpo, setCuerpo] = useState('')

  useEffect(() => {
    if (datos && !desde) setDesde(isoLocal(new Date(datos.consulta.citaFechaHora)))
  }, [datos, desde])

  useEffect(() => {
    if (!datos || !desde || dias < 1) return
    const { paciente: p, consulta: c } = datos
    const id = identificacion(p)
    const dx = textoDiagnostico(c)
    const hasta = sumar(desde, dias - 1)
    setCuerpo(
      `Por medio de la presente hago constar que ${p.nombre}${id ? `, ${id},` : ''} fue ${genero(p, 'evaluada', 'evaluado')} en consulta médica el día ${fechaLarga(c.citaFechaHora)}` +
        (dx ? ` y presenta ${dx}` : '') +
        `, por lo que se le indica reposo médico por ${enLetras(dias)} (${dias}) ${dias === 1 ? 'día' : 'días'}, ` +
        (dias === 1 ? `el ${fechaLarga(desde)}.` : `del ${fechaLarga(desde)} al ${fechaLarga(hasta)}, ambas fechas inclusive.`) +
        `\n\nSe extiende la presente para los fines que ${genero(p, 'la interesada', 'el interesado')} estime convenientes, el ${fechaLarga(new Date().toISOString())}.`,
    )
  }, [datos, dias, desde])

  return (
    <Hoja
      listo={datos !== null}
      error={error}
      autoImprimir={false}
      titulo={datos ? `Incapacidad - ${datos.paciente.nombre}` : 'Incapacidad médica'}
      panel={
        datos && (
          <PanelEdicion>
            <div className="flex flex-wrap gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="dias">Días de reposo</Label>
                <Input id="dias" type="number" min={1} max={30} value={dias} onChange={(e) => setDias(Math.max(1, Math.min(30, Number(e.target.value) || 1)))} className="w-28" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="desde">A partir del</Label>
                <Input id="desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="w-44" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cuerpo">Texto de la incapacidad (podés ajustarlo antes de imprimir)</Label>
              <Textarea id="cuerpo" rows={6} value={cuerpo} onChange={(e) => setCuerpo(e.target.value)} />
            </div>
          </PanelEdicion>
        )
      }
    >
      {datos && <DocumentoFirmado datos={datos} titulo="INCAPACIDAD MÉDICA" cuerpo={cuerpo} />}
    </Hoja>
  )
}

// ---------- factura ----------

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
                <p className="text-base font-bold" style={{ color: AZUL }}>
                  {electronica ? 'Factura electrónica' : 'Factura'}
                </p>
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
              <tr className="text-left text-xs tracking-wide text-slate-600 uppercase" style={{ borderBottom: `2px solid ${AZUL}` }}>
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
            <div className="flex justify-between py-2 text-base font-bold" style={{ borderTop: `2px solid ${AZUL}` }}>
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

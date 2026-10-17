import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiFetch, ApiRequestError } from '@/lib/api'
import type { CitaResponse, ConsultaResponse, DiagnosticoItem, PacienteResponse, PlantillaConsulta, PlantillaConsultaDatos, RecetaItem } from '@/types'
import { edadDe, fechaLarga } from '@/lib/clinica'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/page-header'
import { CodigoPaciente } from '@/components/codigo-paciente'
import { EstadoChip } from '@/components/estado-chip'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SIGNOS_VACIOS, SignosVitalesEditor, signosANumeros, signosATexto, type SignosTexto } from '@/components/consultas/signos-vitales-editor'
import { DiagnosticoEditor } from '@/components/consultas/diagnostico-editor'
import { RecetaEditor } from '@/components/consultas/receta-editor'
import { ExpedienteLateral } from '@/components/consultas/expediente-lateral'
import { ResumenConsulta } from '@/components/consultas/resumen-consulta'
import { ConsultarFarmaciasBoton } from '@/components/farmacias/farmacias'
import { FacturaFormDialog } from '@/components/facturas/factura-form-dialog'
import { toast } from 'sonner'
import {
  ArrowLeft,
  BookmarkPlus,
  CheckCircle2,
  ChevronDown,
  FileBadge,
  FilePlus2,
  FileText,
  LayoutTemplate,
  Pencil,
  Printer,
  Receipt,
  Save,
  Trash2,
} from 'lucide-react'

interface Formulario {
  motivoConsulta: string
  notas: string
  examenFisico: string
  signos: SignosTexto
  diagnosticos: DiagnosticoItem[]
  diagnostico: string
  recetaItems: RecetaItem[]
  receta: string
  indicaciones: string
  proximoControl: string
}

const VACIO: Formulario = {
  motivoConsulta: '',
  notas: '',
  examenFisico: '',
  signos: SIGNOS_VACIOS,
  diagnosticos: [],
  diagnostico: '',
  recetaItems: [],
  receta: '',
  indicaciones: '',
  proximoControl: '',
}

const claveBorrador = (citaId: string) => `goram_borrador_consulta_${citaId}`

function desdeConsulta(c: ConsultaResponse): Formulario {
  return {
    motivoConsulta: c.motivoConsulta ?? '',
    notas: c.notas ?? '',
    examenFisico: c.examenFisico ?? '',
    signos: signosATexto(c),
    diagnosticos: c.diagnosticos,
    diagnostico: c.diagnostico ?? '',
    recetaItems: c.recetaItems.map((r) => ({ ...r, dosis: r.dosis ?? '', frecuencia: r.frecuencia ?? '', duracion: r.duracion ?? '', indicaciones: r.indicaciones ?? '' })),
    receta: c.receta ?? '',
    indicaciones: c.indicaciones ?? '',
    proximoControl: c.proximoControl ?? '',
  }
}

const nulo = (t: string | null | undefined) => (t && t.trim() ? t.trim() : null)

function sumarDias(dias: number) {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function abrirDocumento(tipo: 'receta' | 'constancia' | 'incapacidad', citaId: string) {
  window.open(`/imprimir/${tipo}/${citaId}`, '_blank', 'noopener')
}

function Hoja({ titulo, descripcion, accion, children, className }: { titulo: string; descripcion?: string; accion?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('flex flex-col gap-3 border-t px-4 py-5 first:border-t-0 sm:px-6', className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[0.9375rem] font-semibold text-tinta">{titulo}</h2>
          {descripcion && <p className="text-xs text-muted-foreground">{descripcion}</p>}
        </div>
        {accion}
      </div>
      {children}
    </section>
  )
}

export function AtencionPage() {
  const { citaId } = useParams<{ citaId: string }>()
  const navigate = useNavigate()
  const [cita, setCita] = useState<CitaResponse | null>(null)
  const [paciente, setPaciente] = useState<PacienteResponse | null>(null)
  const [consulta, setConsulta] = useState<ConsultaResponse | null>(null)
  const [historial, setHistorial] = useState<ConsultaResponse[]>([])
  const [frecuentes, setFrecuentes] = useState<RecetaItem[]>([])
  const [plantillas, setPlantillas] = useState<PlantillaConsulta[]>([])
  const [cargando, setCargando] = useState(true)
  const [editando, setEditando] = useState(false)
  const [recienGuardada, setRecienGuardada] = useState(false)
  const [form, setForm] = useState<Formulario>(VACIO)
  const [enviando, setEnviando] = useState(false)
  const [borradorGuardadoEn, setBorradorGuardadoEn] = useState<Date | null>(null)
  const [plantillaDialogo, setPlantillaDialogo] = useState(false)
  const [nombrePlantilla, setNombrePlantilla] = useState('')
  const [facturarAbierto, setFacturarAbierto] = useState(false)
  const recetaFoco = useRef(0)
  const formRef = useRef<HTMLFormElement>(null)
  const sucio = useRef(false)

  useEffect(() => {
    if (!citaId) return
    let cancelado = false
    ;(async () => {
      setCargando(true)
      try {
        const c = await apiFetch<CitaResponse>(`/api/v1/citas/${citaId}`)
        const [p, h, f, pl] = await Promise.all([
          apiFetch<PacienteResponse>(`/api/v1/pacientes/${c.pacienteId}`),
          apiFetch<ConsultaResponse[]>(`/api/v1/consultas/por-paciente/${c.pacienteId}`),
          apiFetch<RecetaItem[]>('/api/v1/consultas/medicamentos-frecuentes').catch(() => []),
          apiFetch<PlantillaConsulta[]>('/api/v1/plantillas-consulta').catch(() => []),
        ])
        if (cancelado) return
        const actual = h.find((x) => x.citaId === citaId) ?? null
        setCita(c)
        setPaciente(p)
        setConsulta(actual)
        setHistorial(h.filter((x) => x.citaId !== citaId && x.citaFechaHora < c.fechaHora))
        setFrecuentes(f)
        setPlantillas(pl)

        const base = actual ? desdeConsulta(actual) : { ...VACIO, motivoConsulta: c.motivo ?? '' }
        let inicial = base
        let restaurado = false
        try {
          const crudo = localStorage.getItem(claveBorrador(citaId))
          if (crudo) {
            const b = JSON.parse(crudo) as { guardadoEn: string; form: Formulario }
            const referencia = actual ? (actual.actualizadoEn ?? actual.creadoEn) : null
            if (!referencia || b.guardadoEn > referencia) {
              inicial = { ...VACIO, ...b.form }
              restaurado = true
            } else {
              localStorage.removeItem(claveBorrador(citaId))
            }
          }
        } catch {
          // borrador ilegible: se ignora
        }
        setForm(inicial)
        setEditando(!actual || restaurado)
        if (restaurado) {
          toast('Recuperamos el borrador que dejaste sin guardar', {
            action: {
              label: 'Descartar',
              onClick: () => {
                localStorage.removeItem(claveBorrador(citaId))
                setForm(base)
                setEditando(!actual)
              },
            },
          })
        }
      } catch (err) {
        toast.error(err instanceof ApiRequestError && err.status === 403 ? 'No tenés acceso a las notas clínicas' : 'No se pudo abrir la consulta')
        navigate('/consultas')
      } finally {
        if (!cancelado) setCargando(false)
      }
    })()
    return () => {
      cancelado = true
    }
  }, [citaId, navigate])

  const actualizar = useCallback(<K extends keyof Formulario>(campo: K, valor: Formulario[K]) => {
    sucio.current = true
    setForm((f) => ({ ...f, [campo]: valor }))
  }, [])

  // borrador automatico: si se cierra la pestana o se va la luz, no se pierde nada
  useEffect(() => {
    if (!editando || !citaId || !sucio.current) return
    const t = setTimeout(() => {
      try {
        localStorage.setItem(claveBorrador(citaId), JSON.stringify({ guardadoEn: new Date().toISOString(), form }))
        setBorradorGuardadoEn(new Date())
      } catch {
        // almacenamiento lleno o bloqueado: el borrador es una ayuda, no un requisito
      }
    }, 700)
    return () => clearTimeout(t)
  }, [form, editando, citaId])

  // Ctrl+S / Cmd+S guarda
  useEffect(() => {
    if (!editando) return
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        formRef.current?.requestSubmit()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editando])

  const edad = useMemo(() => (paciente ? edadDe(paciente.fechaNacimiento) : null), [paciente])

  function datosPlantilla(): PlantillaConsultaDatos {
    return {
      motivoConsulta: nulo(form.motivoConsulta),
      notas: nulo(form.notas),
      examenFisico: nulo(form.examenFisico),
      diagnosticos: form.diagnosticos,
      diagnostico: nulo(form.diagnostico),
      recetaItems: form.recetaItems.filter((r) => r.medicamento.trim()).map(limpiarItem),
      indicaciones: nulo(form.indicaciones),
    }
  }

  function aplicarPlantilla(p: PlantillaConsulta) {
    const d = p.datos
    const unir = (actual: string, nuevo: string | null) => (!nuevo ? actual : actual.trim() ? `${actual.trim()}\n${nuevo}` : nuevo)
    sucio.current = true
    setForm((f) => ({
      ...f,
      motivoConsulta: f.motivoConsulta.trim() ? f.motivoConsulta : (d.motivoConsulta ?? ''),
      notas: unir(f.notas, d.notas),
      examenFisico: unir(f.examenFisico, d.examenFisico),
      diagnosticos: [...f.diagnosticos, ...d.diagnosticos.filter((n) => !f.diagnosticos.some((x) => x.codigo === n.codigo && x.descripcion === n.descripcion))],
      diagnostico: unir(f.diagnostico, d.diagnostico),
      recetaItems: [...f.recetaItems.filter((r) => r.medicamento.trim()), ...d.recetaItems.map((r) => ({ ...r }))],
      indicaciones: unir(f.indicaciones, d.indicaciones),
    }))
    setEditando(true)
    toast.success(`Plantilla «${p.nombre}» aplicada`)
  }

  async function guardarPlantilla(e: FormEvent) {
    e.preventDefault()
    try {
      const nueva = await apiFetch<PlantillaConsulta>('/api/v1/plantillas-consulta', { method: 'POST', body: { nombre: nombrePlantilla.trim(), datos: datosPlantilla() } })
      setPlantillas((ps) => [...ps, nueva].sort((a, b) => a.nombre.localeCompare(b.nombre)))
      setPlantillaDialogo(false)
      setNombrePlantilla('')
      toast.success('Plantilla guardada; la encontrás en el menú Plantillas')
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? (err.body?.message ?? 'No se pudo guardar la plantilla') : 'No se pudo conectar con el servidor')
    }
  }

  async function eliminarPlantilla(p: PlantillaConsulta) {
    try {
      await apiFetch(`/api/v1/plantillas-consulta/${p.id}`, { method: 'DELETE' })
      setPlantillas((ps) => ps.filter((x) => x.id !== p.id))
      toast.success(`Plantilla «${p.nombre}» eliminada`)
    } catch {
      toast.error('No se pudo eliminar la plantilla')
    }
  }

  async function guardar(e: { preventDefault(): void }, imprimirDespues = false) {
    e.preventDefault()
    if (!cita) return
    const s = signosANumeros(form.signos)
    if ((s.presionSistolica === null) !== (s.presionDiastolica === null)) {
      toast.error('Completá la presión arterial con los dos valores (ej. 120/80)')
      return
    }
    // la pestana de impresion se abre dentro del clic: si se abre despues de
    // esperar al servidor, el navegador la bloquea como ventana emergente
    const ventana = imprimirDespues ? window.open('', '_blank') : null
    setEnviando(true)
    const body = {
      citaId: cita.id,
      motivoConsulta: nulo(form.motivoConsulta),
      notas: nulo(form.notas),
      examenFisico: nulo(form.examenFisico),
      ...s,
      diagnosticos: form.diagnosticos,
      diagnostico: nulo(form.diagnostico),
      recetaItems: form.recetaItems.filter((r) => r.medicamento.trim()).map(limpiarItem),
      receta: nulo(form.receta),
      indicaciones: nulo(form.indicaciones),
      proximoControl: form.proximoControl || null,
    }
    try {
      const guardada = consulta
        ? await apiFetch<ConsultaResponse>(`/api/v1/consultas/${consulta.id}`, { method: 'PUT', body })
        : await apiFetch<ConsultaResponse>('/api/v1/consultas', { method: 'POST', body })
      localStorage.removeItem(claveBorrador(cita.id))
      sucio.current = false
      setBorradorGuardadoEn(null)
      setRecienGuardada(!consulta)
      setConsulta(guardada)
      setForm(desdeConsulta(guardada))
      setEditando(false)
      if (!consulta) setCita({ ...cita, estado: 'COMPLETADA' })
      toast.success(consulta ? 'Cambios guardados' : 'Consulta registrada; la cita quedó como atendida')
      if (ventana) ventana.location.href = `/imprimir/receta/${cita.id}`
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      ventana?.close()
      toast.error(err instanceof ApiRequestError ? (err.body?.message ?? 'Revisá los datos: hay un valor fuera de rango') : 'No se pudo conectar con el servidor')
    } finally {
      setEnviando(false)
    }
  }

  if (cargando || !cita || !paciente) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-14 w-80" />
        <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
          <Skeleton className="h-96" />
          <Skeleton className="h-[32rem]" />
        </div>
      </div>
    )
  }

  const tieneReceta = (consulta?.recetaItems.length ?? 0) > 0 || !!consulta?.receta
  const anterior = historial[0] ?? null

  const menuDocumentos = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Printer />
          Documentos
          <ChevronDown className="opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuItem disabled={!consulta || !tieneReceta} onSelect={() => abrirDocumento('receta', cita.id)}>
          <FileText />
          Receta médica
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!consulta} onSelect={() => abrirDocumento('constancia', cita.id)}>
          <FileBadge />
          Constancia médica
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!consulta} onSelect={() => abrirDocumento('incapacidad', cita.id)}>
          <FilePlus2 />
          Incapacidad médica
        </DropdownMenuItem>
        {!consulta && <p className="px-2 py-1.5 text-xs text-muted-foreground">Guardá la consulta para emitir documentos.</p>}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const menuPlantillas = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <LayoutTemplate />
          Plantillas
          <ChevronDown className="opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Usar una plantilla</DropdownMenuLabel>
        {plantillas.length === 0 && <p className="px-2 pb-2 text-xs text-muted-foreground">Todavía no tenés plantillas. Guardá una consulta típica para reutilizarla.</p>}
        {plantillas.map((p) => (
          <DropdownMenuItem key={p.id} onSelect={() => aplicarPlantilla(p)} className="group justify-between">
            <span className="truncate">{p.nombre}</span>
            <button
              type="button"
              aria-label={`Eliminar plantilla ${p.nombre}`}
              className="rounded p-1 text-muted-foreground opacity-60 group-hover:opacity-100 hover:bg-background hover:text-destructive"
              onClick={(ev) => {
                ev.preventDefault()
                ev.stopPropagation()
                eliminarPlantilla(p)
              }}
            >
              <Trash2 className="size-3.5" />
            </button>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => setPlantillaDialogo(true)} disabled={!editando}>
          <BookmarkPlus />
          Guardar esta consulta como plantilla
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        inicio={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Volver" className="-ml-2" onClick={() => navigate(-1)}>
              <ArrowLeft />
            </Button>
            <CodigoPaciente id={paciente.id} tamano="lg" />
          </div>
        }
        titulo={paciente.nombre}
        descripcion={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="first-letter:uppercase">
              {new Date(cita.fechaHora).toLocaleString('es-SV', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' })} · {cita.doctorNombre}
            </span>
            <EstadoChip estado={cita.estado} />
          </span>
        }
        acciones={
          <>
            {editando && menuPlantillas}
            {menuDocumentos}
            {!editando && (
              <>
                <Button variant="outline" onClick={() => setFacturarAbierto(true)}>
                  <Receipt />
                  Facturar
                </Button>
                <Button onClick={() => setEditando(true)}>
                  <Pencil />
                  Editar consulta
                </Button>
              </>
            )}
          </>
        }
      />

      {recienGuardada && !editando && (
        <div className="flex flex-col gap-3 rounded-lg bg-exito-suave px-4 py-3 ring-1 ring-exito/20 ring-inset sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-sm font-medium text-exito">
            <CheckCircle2 className="size-5" />
            Consulta registrada. ¿Qué sigue?
          </p>
          <div className="flex flex-wrap gap-2">
            {tieneReceta && (
              <Button size="sm" onClick={() => abrirDocumento('receta', cita.id)}>
                <Printer />
                Imprimir receta
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => setFacturarAbierto(true)}>
              <Receipt />
              Facturar consulta
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link to="/panel">Volver a la hoja del día</Link>
            </Button>
          </div>
        </div>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <div className="xl:sticky xl:top-20">
          <ExpedienteLateral paciente={paciente} anteriores={historial} />
        </div>

        {!editando && consulta ? (
          <article className="rounded-lg border bg-card px-4 py-6 sm:px-8">
            <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2 border-b pb-4">
              <h2 className="text-[0.9375rem] font-semibold text-tinta">Nota clínica</h2>
              <p className="text-xs text-muted-foreground">
                Registrada el {fechaLarga(consulta.creadoEn)}
                {consulta.actualizadoEn && ` · editada el ${fechaLarga(consulta.actualizadoEn)}`}
                {' · '}código <span className="font-mono">{consulta.codigoVerificacion}</span>
              </p>
            </div>
            <ResumenConsulta consulta={consulta} edad={edad} />
          </article>
        ) : (
          <form ref={formRef} onSubmit={(e) => guardar(e)} className="relative rounded-lg border bg-card">
            <Hoja titulo="Motivo de consulta">
              <Textarea
                rows={2}
                value={form.motivoConsulta}
                onChange={(e) => actualizar('motivoConsulta', e.target.value)}
                placeholder="¿Por qué consulta hoy? En palabras del paciente."
                className="text-[15px]"
              />
            </Hoja>

            <Hoja titulo="Signos vitales" descripcion={anterior ? `Debajo de cada campo ves el valor de la consulta anterior (${new Date(anterior.citaFechaHora).toLocaleDateString('es-SV', { day: 'numeric', month: 'short' })}).` : 'Los valores fuera de rango se marcan solos.'}>
              <SignosVitalesEditor valor={form.signos} onChange={(v) => actualizar('signos', v)} edad={edad} anteriores={anterior} />
            </Hoja>

            <Hoja titulo="Evolución y examen físico">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="notas" className="text-xs text-muted-foreground">Historia de la enfermedad actual</Label>
                  <Textarea id="notas" rows={5} value={form.notas} onChange={(e) => actualizar('notas', e.target.value)} placeholder="Inicio, evolución, síntomas asociados, tratamientos previos…" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="examen" className="text-xs text-muted-foreground">Examen físico</Label>
                  <Textarea id="examen" rows={5} value={form.examenFisico} onChange={(e) => actualizar('examenFisico', e.target.value)} placeholder="Hallazgos por sistemas…" />
                </div>
              </div>
            </Hoja>

            <Hoja titulo="Diagnóstico">
              <DiagnosticoEditor valor={form.diagnosticos} onChange={(v) => actualizar('diagnosticos', v)} />
              <Textarea rows={2} value={form.diagnostico} onChange={(e) => actualizar('diagnostico', e.target.value)} placeholder="Impresión clínica o comentario (opcional)" />
            </Hoja>

            <Hoja
              titulo="Receta"
              descripcion="Sale impresa con tu membrete, firma y un código QR de verificación."
              accion={<ConsultarFarmaciasBoton terminoInicial={() => form.recetaItems[recetaFoco.current]?.medicamento ?? form.recetaItems[0]?.medicamento ?? ''} />}
            >
              <RecetaEditor valor={form.recetaItems} onChange={(v) => actualizar('recetaItems', v)} frecuentes={frecuentes} onFoco={(i) => (recetaFoco.current = i)} />
              {form.receta && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="receta-texto" className="text-xs text-muted-foreground">Receta anterior (texto libre)</Label>
                  <Textarea id="receta-texto" rows={3} value={form.receta} onChange={(e) => actualizar('receta', e.target.value)} />
                </div>
              )}
            </Hoja>

            <Hoja titulo="Indicaciones y próximo control">
              <Textarea rows={3} value={form.indicaciones} onChange={(e) => actualizar('indicaciones', e.target.value)} placeholder="Dieta, reposo, signos de alarma, exámenes a realizar…" />
              <div className="flex flex-wrap items-center gap-2">
                <Label htmlFor="control" className="mr-1 text-sm">Próximo control</Label>
                <Input id="control" type="date" value={form.proximoControl} min={sumarDias(0)} onChange={(e) => actualizar('proximoControl', e.target.value)} className="w-44" />
                {[
                  ['1 semana', 7],
                  ['2 semanas', 14],
                  ['1 mes', 30],
                  ['3 meses', 90],
                ].map(([etiqueta, dias]) => (
                  <Button key={etiqueta} type="button" size="sm" variant={form.proximoControl === sumarDias(dias as number) ? 'default' : 'outline'} onClick={() => actualizar('proximoControl', sumarDias(dias as number))}>
                    {etiqueta}
                  </Button>
                ))}
                {form.proximoControl && (
                  <Button type="button" size="sm" variant="ghost" onClick={() => actualizar('proximoControl', '')}>
                    Quitar
                  </Button>
                )}
              </div>
            </Hoja>

            <div className="sticky bottom-0 z-10 flex flex-col gap-3 rounded-b-lg border-t bg-card/95 px-4 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-xs text-muted-foreground">
                {borradorGuardadoEn ? `Borrador guardado en este equipo a las ${borradorGuardadoEn.toLocaleTimeString('es-SV', { hour: 'numeric', minute: '2-digit' })}` : 'Se guarda un borrador mientras escribís'}
                <span className="hidden md:inline"> · Ctrl+S para guardar</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {consulta && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      localStorage.removeItem(claveBorrador(cita.id))
                      sucio.current = false
                      setForm(desdeConsulta(consulta))
                      setEditando(false)
                    }}
                  >
                    Cancelar
                  </Button>
                )}
                <Button type="button" variant="outline" disabled={enviando || !form.recetaItems.some((r) => r.medicamento.trim())} onClick={(e) => guardar(e, true)}>
                  <Printer />
                  Guardar e imprimir receta
                </Button>
                <Button type="submit" disabled={enviando}>
                  <Save />
                  {enviando ? 'Guardando…' : consulta ? 'Guardar cambios' : 'Registrar consulta'}
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>

      <Dialog open={plantillaDialogo} onOpenChange={setPlantillaDialogo}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={guardarPlantilla}>
            <DialogHeader>
              <DialogTitle>Guardar como plantilla</DialogTitle>
              <DialogDescription>
                Se guardan el motivo, la evolución, el examen, los diagnósticos, la receta y las indicaciones. Los signos vitales no, porque son de cada paciente.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2 py-4">
              <Label htmlFor="nombre-plantilla">Nombre</Label>
              <Input id="nombre-plantilla" autoFocus required maxLength={120} value={nombrePlantilla} onChange={(e) => setNombrePlantilla(e.target.value)} placeholder="Ej. Control de hipertensión" />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setPlantillaDialogo(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!nombrePlantilla.trim()}>
                Guardar plantilla
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <FacturaFormDialog
        open={facturarAbierto}
        onOpenChange={setFacturarAbierto}
        pacientePreseleccionado={paciente.id}
        onGuardado={() => {
          setFacturarAbierto(false)
          toast.success('Factura registrada')
        }}
      />
    </div>
  )
}

function limpiarItem(r: RecetaItem): RecetaItem {
  return {
    medicamento: r.medicamento.trim(),
    dosis: nulo(r.dosis),
    frecuencia: nulo(r.frecuencia),
    duracion: nulo(r.duracion),
    indicaciones: nulo(r.indicaciones),
  }
}

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { prepararLogo } from '@/lib/imagen'
import { apiFetch, ApiRequestError } from '@/lib/api'
import type { ClinicaResponse, ServicioResponse } from '@/types'
import { PageHeader, Seccion } from '@/components/page-header'
import { EstadoChip } from '@/components/estado-chip'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FarmaciasConfig } from '@/components/farmacias/farmacias-config'
import { toast } from 'sonner'
import { Check, ImageIcon, Pencil, Plus, Upload, X } from 'lucide-react'

const mensajeError = (err: unknown, porDefecto: string) =>
  err instanceof ApiRequestError ? (err.body?.message ?? porDefecto) : 'No se pudo conectar con el servidor'

function LogoClinica({ logo, onCambio }: { logo: string | null; onCambio: (c: ClinicaResponse) => void }) {
  const archivoRef = useRef<HTMLInputElement>(null)
  const [subiendo, setSubiendo] = useState(false)

  async function enviar(valor: string | null) {
    setSubiendo(true)
    try {
      onCambio(await apiFetch<ClinicaResponse>('/api/v1/clinica/logo', { method: 'PUT', body: { logoImagen: valor } }))
      toast.success(valor ? 'Logo actualizado' : 'Logo quitado')
    } catch (err) {
      toast.error(mensajeError(err, 'No se pudo guardar el logo'))
    } finally {
      setSubiendo(false)
      if (archivoRef.current) archivoRef.current.value = ''
    }
  }

  async function elegir(archivo: File | undefined) {
    if (!archivo) return
    try {
      await enviar(await prepararLogo(archivo))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo leer la imagen')
    }
  }

  return (
    <div className="mb-5 flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center">
      <div className="flex h-20 w-40 shrink-0 items-center justify-center rounded-lg border border-dashed bg-white p-2">
        {logo ? <img src={logo} alt="Logo de la clínica" className="max-h-full max-w-full object-contain" /> : <ImageIcon className="size-7 text-slate-300" />}
      </div>
      <div className="flex flex-col gap-2">
        <div>
          <p className="text-sm font-medium text-tinta">Logo</p>
          <p className="text-xs text-muted-foreground">Sale en el membrete de recetas, constancias, incapacidades y facturas. PNG o JPG; mejor con fondo transparente o blanco.</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" disabled={subiendo} onClick={() => archivoRef.current?.click()}>
            <Upload />
            {logo ? 'Cambiar logo' : 'Subir logo'}
          </Button>
          {logo && (
            <Button type="button" variant="ghost" size="sm" disabled={subiendo} onClick={() => enviar(null)}>
              Quitar
            </Button>
          )}
        </div>
        <input ref={archivoRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => elegir(e.target.files?.[0])} />
      </div>
    </div>
  )
}

function DatosClinica() {
  const [clinica, setClinica] = useState<ClinicaResponse | null>(null)
  const [valores, setValores] = useState({ nombre: '', nit: '', nrc: '', giro: '', telefono: '', direccion: '' })
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    apiFetch<ClinicaResponse>('/api/v1/clinica')
      .then((c) => {
        setClinica(c)
        setValores({
          nombre: c.nombre,
          nit: c.nit,
          nrc: c.nrc ?? '',
          giro: c.giro ?? '',
          telefono: c.telefono ?? '',
          direccion: c.direccion ?? '',
        })
      })
      .catch(() => toast.error('No se pudieron cargar los datos de la clínica'))
  }, [])

  function campo(nombre: keyof typeof valores) {
    return { id: nombre, value: valores[nombre], onChange: (e: React.ChangeEvent<HTMLInputElement>) => setValores((v) => ({ ...v, [nombre]: e.target.value })) }
  }

  async function guardar(event: FormEvent) {
    event.preventDefault()
    setGuardando(true)
    try {
      const c = await apiFetch<ClinicaResponse>('/api/v1/clinica', { method: 'PUT', body: valores })
      setClinica(c)
      toast.success('Datos de la clínica guardados')
    } catch (err) {
      toast.error(mensajeError(err, 'No se pudieron guardar los datos'))
    } finally {
      setGuardando(false)
    }
  }

  if (!clinica) {
    return <Skeleton className="h-64 w-full" />
  }

  return (
    <form onSubmit={guardar} className="rounded-lg border bg-card p-5">
      <LogoClinica logo={clinica.logoImagen} onCambio={(c) => setClinica(c)} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="nombre">{clinica.tipoPractica === 'INDIVIDUAL' ? 'Nombre del consultorio' : 'Nombre de la clínica'}</Label>
          <Input required {...campo('nombre')} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="nit">NIT</Label>
          <Input required {...campo('nit')} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="nrc">NRC</Label>
          <Input {...campo('nrc')} />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="giro">Giro o especialidad</Label>
          <Input placeholder="Ej. Servicios médicos de medicina general" {...campo('giro')} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="telefono">Teléfono</Label>
          <Input inputMode="tel" {...campo('telefono')} />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="direccion">Dirección</Label>
          <Input {...campo('direccion')} />
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">Estos datos aparecen en el encabezado de recetas y facturas impresas.</p>
        <Button type="submit" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar datos'}
        </Button>
      </div>
    </form>
  )
}

function ServiciosTarifas() {
  const [servicios, setServicios] = useState<ServicioResponse[] | null>(null)
  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState('')
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [edicion, setEdicion] = useState({ nombre: '', precio: '' })
  const [ocupado, setOcupado] = useState(false)

  function cargar() {
    apiFetch<ServicioResponse[]>('/api/v1/servicios')
      .then(setServicios)
      .catch(() => toast.error('No se pudieron cargar los servicios'))
  }

  useEffect(cargar, [])

  async function agregar(event: FormEvent) {
    event.preventDefault()
    setOcupado(true)
    try {
      await apiFetch('/api/v1/servicios', { method: 'POST', body: { nombre, precio: Number(precio) } })
      setNombre('')
      setPrecio('')
      toast.success('Servicio agregado')
      cargar()
    } catch (err) {
      toast.error(mensajeError(err, 'No se pudo agregar el servicio'))
    } finally {
      setOcupado(false)
    }
  }

  async function guardarEdicion(id: string) {
    setOcupado(true)
    try {
      await apiFetch(`/api/v1/servicios/${id}`, { method: 'PUT', body: { nombre: edicion.nombre, precio: Number(edicion.precio) } })
      setEditandoId(null)
      cargar()
    } catch (err) {
      toast.error(mensajeError(err, 'No se pudo guardar el servicio'))
    } finally {
      setOcupado(false)
    }
  }

  async function cambiarActivo(servicio: ServicioResponse) {
    try {
      await apiFetch(`/api/v1/servicios/${servicio.id}/activo`, { method: 'PATCH', body: { activo: !servicio.activo } })
      cargar()
    } catch (err) {
      toast.error(mensajeError(err, 'No se pudo actualizar el servicio'))
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={agregar} className="grid gap-2 rounded-lg border bg-carton/50 p-3 sm:grid-cols-[minmax(0,1fr)_9rem_auto] sm:items-end">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="servicio-nombre" className="text-xs">Servicio</Label>
          <Input id="servicio-nombre" required placeholder="Ej. Consulta general" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="servicio-precio" className="text-xs">Precio sin IVA</Label>
          <Input id="servicio-precio" required type="number" min={0} step="0.01" value={precio} onChange={(e) => setPrecio(e.target.value)} />
        </div>
        <Button type="submit" disabled={ocupado}>
          <Plus />
          Agregar
        </Button>
      </form>

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Servicio</TableHead>
              <TableHead className="text-right">Precio sin IVA</TableHead>
              <TableHead className="text-right">Con IVA</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {servicios === null && (
              <TableRow>
                <TableCell colSpan={5}><Skeleton className="h-5 w-full" /></TableCell>
              </TableRow>
            )}
            {servicios?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                  Agregá tus servicios (consulta, control, procedimientos) para facturar con un clic.
                </TableCell>
              </TableRow>
            )}
            {servicios?.map((s) =>
              editandoId === s.id ? (
                <TableRow key={s.id}>
                  <TableCell><Input aria-label="Servicio" value={edicion.nombre} onChange={(e) => setEdicion((v) => ({ ...v, nombre: e.target.value }))} /></TableCell>
                  <TableCell><Input aria-label="Precio" type="number" min={0} step="0.01" className="ml-auto w-28 text-right" value={edicion.precio} onChange={(e) => setEdicion((v) => ({ ...v, precio: e.target.value }))} /></TableCell>
                  <TableCell />
                  <TableCell />
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" aria-label="Guardar" disabled={ocupado} onClick={() => guardarEdicion(s.id)}><Check /></Button>
                    <Button size="icon" variant="ghost" aria-label="Cancelar" onClick={() => setEditandoId(null)}><X /></Button>
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow key={s.id}>
                  <TableCell className="font-medium text-tinta">{s.nombre}</TableCell>
                  <TableCell className="text-right">${Number(s.precio).toFixed(2)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">${(Number(s.precio) * 1.13).toFixed(2)}</TableCell>
                  <TableCell><EstadoChip estado={s.activo ? 'ACTIVO' : 'INACTIVO'} /></TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => { setEditandoId(s.id); setEdicion({ nombre: s.nombre, precio: String(s.precio) }) }}>
                      <Pencil />
                      Editar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => cambiarActivo(s)}>
                      {s.activo ? 'Desactivar' : 'Activar'}
                    </Button>
                  </TableCell>
                </TableRow>
              ),
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export function ConfiguracionPage() {
  useEffect(() => {
    if (window.location.hash === '#farmacias') {
      setTimeout(() => document.getElementById('farmacias')?.scrollIntoView({ behavior: 'smooth' }), 300)
    }
  }, [])
  return (
    <div className="flex flex-col gap-8">
      <PageHeader titulo="Configuración" descripcion="Datos de tu clínica, servicios que cobrás y farmacias de referencia." />
      <Seccion titulo="Datos de la clínica">
        <DatosClinica />
      </Seccion>
      <Seccion titulo="Servicios y tarifas">
        <ServiciosTarifas />
      </Seccion>
      <div id="farmacias" className="scroll-mt-20">
        <Seccion titulo="Farmacias de referencia">
          <FarmaciasConfig />
        </Seccion>
      </div>
    </div>
  )
}

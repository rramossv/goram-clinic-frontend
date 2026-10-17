import { useEffect, useRef, useState, type FormEvent } from 'react'
import { apiFetch, ApiRequestError } from '@/lib/api'
import type { PerfilProfesional } from '@/types'
import { prepararFirmaDesdeArchivo } from '@/lib/imagen'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { FirmaPad } from '@/components/perfil/firma-pad'
import { toast } from 'sonner'
import { PenLine, Trash2, Upload } from 'lucide-react'

export function MembreteProfesional() {
  const [perfil, setPerfil] = useState<PerfilProfesional | null>(null)
  const [especialidad, setEspecialidad] = useState('')
  const [jvpm, setJvpm] = useState('')
  const [firma, setFirma] = useState<string | null>(null)
  const [dibujando, setDibujando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const archivoRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    apiFetch<PerfilProfesional>('/api/v1/usuarios/me/perfil-profesional')
      .then((p) => {
        setPerfil(p)
        setEspecialidad(p.especialidad ?? '')
        setJvpm(p.jvpm ?? '')
        setFirma(p.firmaImagen)
      })
      .catch(() => toast.error('No se pudo cargar tu membrete'))
  }, [])

  async function subirFirma(archivo: File | undefined) {
    if (!archivo) return
    try {
      const url = await prepararFirmaDesdeArchivo(archivo)
      if (!url) {
        toast.error('No encontramos una firma en esa imagen: usá una foto con fondo blanco y tinta oscura')
        return
      }
      setFirma(url)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo leer la imagen')
    } finally {
      if (archivoRef.current) archivoRef.current.value = ''
    }
  }

  async function guardar(e: FormEvent) {
    e.preventDefault()
    setGuardando(true)
    try {
      const p = await apiFetch<PerfilProfesional>('/api/v1/usuarios/me/perfil-profesional', {
        method: 'PUT',
        body: { especialidad: especialidad.trim() || null, jvpm: jvpm.trim() || null, firmaImagen: firma },
      })
      setPerfil(p)
      toast.success('Membrete guardado; ya sale en tus recetas y constancias')
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? (err.body?.message ?? 'No se pudo guardar el membrete') : 'No se pudo conectar con el servidor')
    } finally {
      setGuardando(false)
    }
  }

  if (!perfil) return <Skeleton className="h-72 w-full" />

  const cambios = especialidad.trim() !== (perfil.especialidad ?? '') || jvpm.trim() !== (perfil.jvpm ?? '') || firma !== perfil.firmaImagen

  return (
    <form onSubmit={guardar} className="grid gap-6 rounded-lg border bg-card p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="especialidad">Especialidad</Label>
          <Input id="especialidad" maxLength={120} value={especialidad} onChange={(e) => setEspecialidad(e.target.value)} placeholder="Ej. Medicina general, Pediatría, Ginecología" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="jvpm">N.º de J.V.P.M.</Label>
          <Input id="jvpm" maxLength={20} inputMode="numeric" value={jvpm} onChange={(e) => setJvpm(e.target.value)} placeholder="Junta de Vigilancia de la Profesión Médica" className="max-w-56" />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Firma</Label>
          {dibujando ? (
            <FirmaPad
              onCancelar={() => setDibujando(false)}
              onListo={(url) => {
                setFirma(url)
                setDibujando(false)
              }}
            />
          ) : (
            <>
              <div className="flex h-28 items-center justify-center rounded-lg border border-dashed bg-white px-4">
                {firma ? <img src={firma} alt="Tu firma" className="max-h-24 max-w-full object-contain" /> : <p className="text-sm text-slate-400">Sin firma cargada</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => setDibujando(true)}>
                  <PenLine />
                  Dibujar firma
                </Button>
                <Button type="button" variant="outline" onClick={() => archivoRef.current?.click()}>
                  <Upload />
                  Subir foto de la firma
                </Button>
                {firma && (
                  <Button type="button" variant="ghost" onClick={() => setFirma(null)}>
                    <Trash2 />
                    Quitar
                  </Button>
                )}
                <input ref={archivoRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => subirFirma(e.target.files?.[0])} />
              </div>
              <p className="text-xs text-muted-foreground">Si subís una foto, firmá en papel blanco con tinta oscura: el fondo se quita solo. Es una imagen de tu firma, no una firma electrónica con validez legal.</p>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase">Así se ve en tus documentos</p>
        <div className="flex flex-1 flex-col justify-between rounded-md bg-white p-5 text-[12px] text-[#16263d] shadow-[0_4px_18px_-8px_rgb(16_38_59/0.35)] ring-1 ring-slate-200">
          <div className="flex justify-between gap-4 border-b-2 border-[#1f3a5f] pb-2">
            <p className="font-serif text-xl font-bold text-[#1f3a5f] italic">Rx</p>
            <div className="text-right">
              <p className="text-[13px] font-semibold">{perfil.nombre}</p>
              {especialidad.trim() && <p className="text-slate-600">{especialidad}</p>}
              {jvpm.trim() && <p className="text-slate-600">J.V.P.M. n.º {jvpm}</p>}
            </div>
          </div>
          <div className="my-6 flex flex-col gap-1.5">
            <div className="h-2 w-3/4 rounded bg-slate-100" />
            <div className="h-2 w-1/2 rounded bg-slate-100" />
            <div className="h-2 w-2/3 rounded bg-slate-100" />
          </div>
          <div className="ml-auto w-48 text-center">
            <div className="flex h-14 items-end justify-center">{firma && <img src={firma} alt="" className="max-h-full max-w-full object-contain" />}</div>
            <div className="border-t border-slate-400 pt-1">
              <p className="font-semibold">{perfil.nombre}</p>
              <p className="text-[10px] text-slate-500">{jvpm.trim() ? `J.V.P.M. n.º ${jvpm}` : 'Firma y sello'}</p>
            </div>
          </div>
        </div>
        <Button type="submit" disabled={guardando || !cambios} className="self-end">
          {guardando ? 'Guardando…' : 'Guardar membrete'}
        </Button>
      </div>
    </form>
  )
}

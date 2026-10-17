import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import type { ClinicaResponse, HorarioFranja, PacienteResponse, PerfilProfesional, ServicioResponse } from '@/types'
import { Seccion } from '@/components/page-header'
import { cn } from '@/lib/utils'
import { CheckCircle2, ChevronRight, Circle, X } from 'lucide-react'

interface Paso {
  clave: string
  titulo: string
  detalle: string
  ruta: string
  hecho: boolean
}

/** Lista de puesta a punto para un consultorio nuevo; desaparece cuando todo esta listo. */
export function PrimerosPasos() {
  const { sesion } = useAuth()
  const claveOculto = `goram_primeros_pasos_${sesion?.tenantId ?? ''}`
  const [pasos, setPasos] = useState<Paso[] | null>(null)
  const [oculto, setOculto] = useState(() => {
    try {
      return localStorage.getItem(claveOculto) === '1'
    } catch {
      return false
    }
  })
  const esMedico = sesion?.rol === 'DOCTOR' || !!sesion?.atiendePacientes

  useEffect(() => {
    if (oculto) return
    Promise.all([
      apiFetch<ClinicaResponse>('/api/v1/clinica'),
      esMedico ? apiFetch<PerfilProfesional>('/api/v1/usuarios/me/perfil-profesional').catch(() => null) : Promise.resolve(null),
      apiFetch<HorarioFranja[]>('/api/v1/horarios').catch(() => []),
      apiFetch<ServicioResponse[]>('/api/v1/servicios').catch(() => []),
      apiFetch<PacienteResponse[]>('/api/v1/pacientes').catch(() => []),
    ]).then(([clinica, perfil, horarios, servicios, pacientes]) => {
      const lista: Paso[] = [
        {
          clave: 'clinica',
          titulo: 'Datos y logo del consultorio',
          detalle: 'Salen en el membrete de cada receta y factura',
          ruta: '/configuracion',
          hecho: !!clinica.logoImagen && !!clinica.direccion && !!clinica.telefono,
        },
        ...(esMedico
          ? [
              {
                clave: 'membrete',
                titulo: 'Tu J.V.P.M. y tu firma',
                detalle: 'Para recetas, constancias e incapacidades firmadas',
                ruta: '/perfil',
                hecho: !!perfil?.jvpm && !!perfil?.firmaImagen,
              },
            ]
          : []),
        {
          clave: 'horario',
          titulo: 'Horario de atención',
          detalle: 'La agenda marca cuándo no atendés',
          ruta: '/configuracion#horario',
          hecho: horarios.length > 0,
        },
        {
          clave: 'servicios',
          titulo: 'Servicios y tarifas',
          detalle: 'Facturás una consulta con un clic',
          ruta: '/configuracion#servicios',
          hecho: servicios.length > 0,
        },
        {
          clave: 'paciente',
          titulo: 'Tu primer paciente',
          detalle: 'Con alergias y antecedentes a la vista',
          ruta: '/pacientes',
          hecho: pacientes.length > 0,
        },
      ]
      setPasos(lista)
    }).catch(() => {})
  }, [oculto, esMedico])

  if (oculto || !pasos || pasos.every((p) => p.hecho)) return null
  const hechos = pasos.filter((p) => p.hecho).length

  return (
    <Seccion
      titulo="Prepará tu consultorio"
      accion={
        <button
          type="button"
          aria-label="Ocultar primeros pasos"
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={() => {
            setOculto(true)
            try {
              localStorage.setItem(claveOculto, '1')
            } catch {
              // preferencia opcional
            }
          }}
        >
          <X className="size-4" />
        </button>
      }
    >
      <div className="rounded-lg border bg-card">
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-carton">
            <div className="h-full rounded-full bg-exito transition-all" style={{ width: `${(hechos / pasos.length) * 100}%` }} />
          </div>
          <span className="text-xs font-medium text-muted-foreground tabular-nums">
            {hechos} de {pasos.length}
          </span>
        </div>
        <ul className="divide-y">
          {pasos.map((p) => (
            <li key={p.clave}>
              <Link to={p.ruta} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-accent/40">
                {p.hecho ? <CheckCircle2 className="size-4.5 shrink-0 text-exito" /> : <Circle className="size-4.5 shrink-0 text-muted-foreground/60" />}
                <div className="min-w-0 flex-1">
                  <p className={cn('text-sm', p.hecho ? 'text-muted-foreground line-through decoration-1' : 'font-medium text-tinta')}>{p.titulo}</p>
                  {!p.hecho && <p className="text-xs text-muted-foreground">{p.detalle}</p>}
                </div>
                {!p.hecho && <ChevronRight className="size-4 text-muted-foreground" />}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Seccion>
  )
}

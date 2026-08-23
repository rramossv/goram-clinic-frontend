import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { apiFetch } from '@/lib/api'
import type { PlanResponse } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  CalendarDays,
  Stethoscope,
  Receipt,
  BarChart3,
  UserCog,
  Check,
} from 'lucide-react'

const CARACTERISTICAS = [
  {
    icon: Users,
    titulo: 'Pacientes',
    descripcion: 'Expediente completo por paciente: contacto, alergias, antecedentes e historial de citas y facturas.',
  },
  {
    icon: CalendarDays,
    titulo: 'Agenda',
    descripcion: 'Calendario semanal por doctor, sin choques de horario, con recordatorio automatico por correo.',
  },
  {
    icon: Stethoscope,
    titulo: 'Consultas',
    descripcion: 'Notas de la consulta, diagnostico y receta, todo asociado a la cita y al paciente.',
  },
  {
    icon: Receipt,
    titulo: 'Facturacion',
    descripcion: 'Factura simple o electronica segun tu plan, con calculo automatico de IVA.',
  },
  {
    icon: BarChart3,
    titulo: 'Reportes',
    descripcion: 'Ingresos, pacientes nuevos y estado de citas de un vistazo, mes a mes.',
  },
  {
    icon: UserCog,
    titulo: 'Personal',
    descripcion: 'Doctores, recepcionistas y administradores, cada uno con su propio rol y permisos.',
  },
]

export function LandingPage() {
  const { sesion } = useAuth()
  const [planes, setPlanes] = useState<PlanResponse[]>([])

  useEffect(() => {
    apiFetch<PlanResponse[]>('/api/v1/planes', { auth: false })
      .then(setPlanes)
      .catch(() => setPlanes([]))
  }, [])

  if (sesion) {
    return <Navigate to="/panel" replace />
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary font-semibold text-primary-foreground">
              G
            </div>
            <span className="font-semibold">GoRam Clinic</span>
          </div>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link to="/login">Iniciar sesion</Link>
            </Button>
            <Button asChild>
              <Link to="/registro">Registra tu clinica</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative isolate overflow-hidden">
          <img
            src="/images/landing/hero-doctor-paciente.jpg"
            alt="Doctora conversando con su paciente en el consultorio"
            className="absolute inset-0 -z-10 h-full w-full object-cover grayscale"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black via-black/75 to-black/50" />
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-32 text-center sm:py-40">
            <Badge variant="outline" className="border-white/30 text-white">
              Para clinicas y consultorios en El Salvador
            </Badge>
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-6xl">
              El dia a dia de tu clinica, en un solo lugar
            </h1>
            <p className="max-w-xl text-lg text-white/80">
              Agenda, expedientes, consultas, facturacion y reportes. GoRam Clinic reemplaza la libreta, el
              Excel y el WhatsApp con un sistema hecho para como trabaja tu clinica de verdad.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link to="/registro">Registra tu clinica</Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white" asChild>
                <Link to="/login">Ya tengo cuenta</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-3">
          <figure className="group relative aspect-4/3 overflow-hidden sm:aspect-auto">
            <img
              src="/images/landing/cuidado-paciente.jpg"
              alt="Doctora atendiendo a un paciente mayor"
              className="h-full w-full object-cover grayscale transition-all duration-500 group-hover:grayscale-0"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
            <figcaption className="absolute inset-x-0 bottom-0 p-5 text-xs font-medium tracking-wide text-white/90 uppercase">
              Cuidado cercano de tus pacientes
            </figcaption>
          </figure>
          <figure className="group relative aspect-4/3 overflow-hidden sm:aspect-auto">
            <img
              src="/images/landing/doctor-tecnologia.jpg"
              alt="Doctor revisando su telefono con GoRam Clinic"
              className="h-full w-full object-cover grayscale transition-all duration-500 group-hover:grayscale-0"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
            <figcaption className="absolute inset-x-0 bottom-0 p-5 text-xs font-medium tracking-wide text-white/90 uppercase">
              Tu clinica desde el celular
            </figcaption>
          </figure>
          <figure className="group relative aspect-4/3 overflow-hidden sm:aspect-auto">
            <img
              src="/images/landing/equipo-datos.jpg"
              alt="Equipo medico revisando reportes en pantalla"
              className="h-full w-full object-cover grayscale transition-all duration-500 group-hover:grayscale-0"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
            <figcaption className="absolute inset-x-0 bottom-0 p-5 text-xs font-medium tracking-wide text-white/90 uppercase">
              Datos claros para decidir mejor
            </figcaption>
          </figure>
        </section>

        <section className="border-t bg-muted/30 py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold">Todo lo que tu clinica necesita</h2>
              <p className="mt-3 text-muted-foreground">
                Sin instalar nada. Entras desde el navegador, en la computadora de recepcion o tu celular.
              </p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {CARACTERISTICAS.map((item) => (
                <Card key={item.titulo}>
                  <CardHeader>
                    <div className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <item.icon className="size-5" />
                    </div>
                    <CardTitle className="mt-3">{item.titulo}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{item.descripcion}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="precios" className="py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold">Un plan para cada tamano de clinica</h2>
              <p className="mt-3 text-muted-foreground">
                Cambia de plan cuando lo necesites. Sin contratos forzosos.
              </p>
            </div>

            {planes.length > 0 && (
              <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-3">
                {planes.map((plan, indice) => (
                  <Card key={plan.id} className={indice === 1 ? 'border-primary shadow-md' : undefined}>
                    <CardHeader>
                      {indice === 1 && <Badge className="w-fit">Mas elegido</Badge>}
                      <CardTitle className="text-xl">{plan.nombre}</CardTitle>
                      <p className="text-3xl font-semibold">
                        ${plan.precioMensual.toFixed(2)}
                        <span className="text-sm font-normal text-muted-foreground"> /mes</span>
                      </p>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                      <ul className="flex flex-col gap-2 text-sm">
                        <li className="flex items-center gap-2">
                          <Check className="size-4 shrink-0 text-primary" />
                          {plan.limiteUsuarios ? `Hasta ${plan.limiteUsuarios} usuarios` : 'Usuarios ilimitados'}
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="size-4 shrink-0 text-primary" />
                          {plan.limitePacientes
                            ? `Hasta ${plan.limitePacientes} pacientes`
                            : 'Pacientes ilimitados'}
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="size-4 shrink-0 text-primary" />
                          Agenda, consultas y reportes
                        </li>
                        {plan.incluyeFacturacionElectronica ? (
                          <li className="flex items-center gap-2">
                            <Check className="size-4 shrink-0 text-primary" />
                            Facturacion electronica (DTE)
                          </li>
                        ) : (
                          <li className="flex items-center gap-2 text-muted-foreground">
                            <Check className="size-4 shrink-0" />
                            Facturacion simple (sin DTE)
                          </li>
                        )}
                      </ul>
                      <Button asChild className="mt-2">
                        <Link to="/registro">Elegir {plan.nombre}</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="border-t py-20">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 text-center">
            <h2 className="text-3xl font-semibold">Empeza a usar GoRam Clinic hoy</h2>
            <p className="text-muted-foreground">
              El registro toma menos de dos minutos. Vos elegis el plan, nosotros nos encargamos del resto.
            </p>
            <Button size="lg" asChild>
              <Link to="/registro">Registra tu clinica</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex size-6 shrink-0 items-center justify-center rounded bg-primary text-xs font-semibold text-primary-foreground">
              G
            </div>
            <span>GoRam Clinic, un producto de GoRam</span>
          </div>
          <span>&copy; {new Date().getFullYear()} GoRam Clinic</span>
        </div>
      </footer>
    </div>
  )
}

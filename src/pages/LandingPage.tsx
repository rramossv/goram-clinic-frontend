import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { apiFetch } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { PlanResponse } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'

const serif = { fontFamily: "'Source Serif 4', Georgia, serif" }

const CARACTERISTICAS = [
  {
    titulo: 'Pacientes',
    descripcion: 'Expediente completo por paciente: contacto, alergias, antecedentes e historial de citas y facturas.',
  },
  {
    titulo: 'Agenda',
    descripcion: 'Calendario semanal por doctor, sin choques de horario, con recordatorio automatico por correo.',
  },
  {
    titulo: 'Consultas',
    descripcion: 'Notas de la consulta, diagnostico y receta, todo asociado a la cita y al paciente.',
  },
  {
    titulo: 'Facturacion',
    descripcion: 'Factura simple o electronica segun tu plan, con calculo automatico de IVA.',
  },
  {
    titulo: 'Reportes',
    descripcion: 'Ingresos, pacientes nuevos y estado de citas de un vistazo, mes a mes.',
  },
  {
    titulo: 'Personal',
    descripcion: 'Doctores, recepcionistas y administradores, cada uno con su propio rol y permisos.',
  },
]

const ESTADISTICAS = [
  { valor: '6', descripcion: 'Modulos en un solo sistema, sin cambiar de pantalla' },
  { valor: '2 min', descripcion: 'Para registrar tu clinica y empezar a agendar' },
  { valor: '100%', descripcion: 'Pensado para clinicas y consultorios en El Salvador' },
]

export function LandingPage() {
  const { sesion } = useAuth()
  const [planes, setPlanes] = useState<PlanResponse[]>([])
  const [conScroll, setConScroll] = useState(false)

  useEffect(() => {
    apiFetch<PlanResponse[]>('/api/v1/planes', { auth: false })
      .then(setPlanes)
      .catch(() => setPlanes([]))
  }, [])

  useEffect(() => {
    function alHacerScroll() {
      setConScroll(window.scrollY > 40)
    }
    alHacerScroll()
    window.addEventListener('scroll', alHacerScroll, { passive: true })
    return () => window.removeEventListener('scroll', alHacerScroll)
  }, [])

  if (sesion) {
    return <Navigate to="/panel" replace />
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#faf8f6]">
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-40 transition-colors duration-300',
          conScroll ? 'border-b border-black/10 bg-[#faf8f6]' : 'border-b border-transparent',
        )}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[#b5502e] font-semibold text-white">
              G
            </div>
            <span className={cn('font-semibold transition-colors', conScroll ? 'text-[#1c1a18]' : 'text-white')}>
              GoRam Clinic
            </span>
          </div>
          <nav className="flex items-center gap-2">
            <Button
              variant="ghost"
              className={conScroll ? 'text-[#1c1a18] hover:bg-black/5' : 'text-white hover:bg-white/10 hover:text-white'}
              asChild
            >
              <Link to="/login">Iniciar sesion</Link>
            </Button>
            <Button className="bg-[#b5502e] text-white hover:bg-[#9c4224]" asChild>
              <Link to="/registro">Registra tu clinica</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative isolate flex min-h-[92vh] items-end overflow-hidden">
          <img
            src="/images/landing/hero-doctor-paciente.jpg"
            alt="Doctora conversando con su paciente en el consultorio"
            className="absolute inset-0 -z-10 h-full w-full object-cover"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#161311]/95 via-[#161311]/45 to-[#161311]/10" />
          <div className="mx-auto w-full max-w-6xl px-4 pt-40 pb-24">
            <p className="text-sm font-medium tracking-[0.2em] text-[#e8a688] uppercase">
              Para clinicas y consultorios en El Salvador
            </p>
            <h1
              style={serif}
              className="mt-5 max-w-3xl text-6xl leading-[0.98] font-normal text-white sm:text-[5.5rem]"
            >
              El dia a dia de
              <br />
              tu clinica<span className="text-[#e8a688]">.</span>
            </h1>
            <p className="mt-7 max-w-md text-lg text-white/70">
              Agenda, expedientes, consultas, facturacion y reportes. GoRam Clinic reemplaza la libreta, el
              Excel y el WhatsApp con un sistema hecho para como trabaja tu clinica de verdad.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="bg-[#b5502e] text-white hover:bg-[#9c4224]" asChild>
                <Link to="/registro">Registra tu clinica</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
                asChild
              >
                <Link to="/login">Ya tengo cuenta</Link>
              </Button>
            </div>
          </div>
        </section>

        <section
          className="relative grid grid-cols-1 gap-1 bg-[#faf8f6] pt-1 sm:grid-cols-12"
          style={{ clipPath: 'polygon(0 3.5vw, 100% 0, 100% 100%, 0 100%)' }}
        >
          <figure className="group relative col-span-1 aspect-4/3 overflow-hidden sm:col-span-7 sm:aspect-auto">
            <img
              src="/images/landing/cuidado-paciente.jpg"
              alt="Doctora atendiendo a un paciente mayor"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
            <figcaption className="absolute inset-x-0 bottom-0 p-6 text-sm font-medium text-white">
              Cuidado cercano de tus pacientes
            </figcaption>
          </figure>
          <div className="col-span-1 grid grid-rows-2 gap-1 sm:col-span-5">
            <figure className="group relative aspect-4/3 overflow-hidden sm:aspect-auto">
              <img
                src="/images/landing/doctor-tecnologia.jpg"
                alt="Doctor revisando su telefono con GoRam Clinic"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
              <figcaption className="absolute inset-x-0 bottom-0 p-5 text-sm font-medium text-white">
                Tu clinica desde el celular
              </figcaption>
            </figure>
            <figure className="group relative aspect-4/3 overflow-hidden sm:aspect-auto">
              <img
                src="/images/landing/equipo-datos.jpg"
                alt="Equipo medico revisando reportes en pantalla"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
              <figcaption className="absolute inset-x-0 bottom-0 p-5 text-sm font-medium text-white">
                Datos claros para decidir mejor
              </figcaption>
            </figure>
          </div>
        </section>

        <section className="py-24 sm:py-32">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
              <div className="lg:sticky lg:top-32 lg:self-start">
                <h2 style={serif} className="text-4xl leading-tight font-normal text-[#1c1a18] sm:text-5xl">
                  Todo lo que tu clinica necesita
                </h2>
                <p className="mt-4 max-w-xs text-[#5c564f]">
                  Sin instalar nada. Entras desde el navegador, en la computadora de recepcion o tu celular.
                </p>
              </div>
              <div className="flex flex-col">
                {CARACTERISTICAS.map((item, indice) => (
                  <div
                    key={item.titulo}
                    className="flex items-baseline gap-6 border-t border-black/10 py-7 first:border-t-0 first:pt-0"
                  >
                    <span style={serif} className="w-8 shrink-0 text-2xl text-[#b5502e]/50">
                      {String(indice + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <h3 className="font-medium text-[#1c1a18]">{item.titulo}</h3>
                      <p className="mt-1 text-sm text-[#5c564f]">{item.descripcion}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#161311] py-20 text-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:grid-cols-3">
            {ESTADISTICAS.map((stat) => (
              <div key={stat.descripcion}>
                <p style={serif} className="text-5xl font-normal text-[#e8a688] sm:text-6xl">
                  {stat.valor}
                </p>
                <p className="mt-3 text-sm text-white/60">{stat.descripcion}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="precios" className="py-24 sm:py-32">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 style={serif} className="text-4xl font-normal text-[#1c1a18] sm:text-5xl">
                Un plan para cada tamano de clinica
              </h2>
              <p className="mt-3 text-[#5c564f]">Cambia de plan cuando lo necesites. Sin contratos forzosos.</p>
            </div>

            {planes.length > 0 && (
              <div className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-3">
                {planes.map((plan, indice) => (
                  <Card
                    key={plan.id}
                    className={cn(
                      'border-black/10 bg-white',
                      indice === 1 && 'relative z-10 border-[#b5502e] shadow-xl sm:scale-105',
                    )}
                  >
                    <CardHeader>
                      {indice === 1 && <Badge className="w-fit bg-[#b5502e] text-white">Mas elegido</Badge>}
                      <CardTitle className="text-xl text-[#1c1a18]">{plan.nombre}</CardTitle>
                      <p style={serif} className="text-4xl font-normal text-[#1c1a18]">
                        ${plan.precioMensual.toFixed(2)}
                        <span className="font-sans text-sm font-normal text-[#5c564f]"> /mes</span>
                      </p>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                      <ul className="flex flex-col gap-2 text-sm text-[#1c1a18]">
                        <li className="flex items-center gap-2">
                          <Check className="size-4 shrink-0 text-[#b5502e]" />
                          {plan.limiteUsuarios ? `Hasta ${plan.limiteUsuarios} usuarios` : 'Usuarios ilimitados'}
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="size-4 shrink-0 text-[#b5502e]" />
                          {plan.limitePacientes
                            ? `Hasta ${plan.limitePacientes} pacientes`
                            : 'Pacientes ilimitados'}
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="size-4 shrink-0 text-[#b5502e]" />
                          Agenda, consultas y reportes
                        </li>
                        {plan.incluyeFacturacionElectronica ? (
                          <li className="flex items-center gap-2">
                            <Check className="size-4 shrink-0 text-[#b5502e]" />
                            Facturacion electronica (DTE)
                          </li>
                        ) : (
                          <li className="flex items-center gap-2 text-[#5c564f]">
                            <Check className="size-4 shrink-0" />
                            Facturacion simple (sin DTE)
                          </li>
                        )}
                      </ul>
                      <Button asChild className="mt-2 bg-[#b5502e] text-white hover:bg-[#9c4224]">
                        <Link to="/registro">Elegir {plan.nombre}</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="border-t border-black/10 py-24">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 text-center">
            <h2 style={serif} className="text-4xl font-normal text-[#1c1a18] sm:text-5xl">
              Empeza a usar GoRam Clinic hoy
            </h2>
            <p className="text-[#5c564f]">
              El registro toma menos de dos minutos. Vos elegis el plan, nosotros nos encargamos del resto.
            </p>
            <Button size="lg" className="bg-[#b5502e] text-white hover:bg-[#9c4224]" asChild>
              <Link to="/registro">Registra tu clinica</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-black/10 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-sm text-[#5c564f] sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex size-6 shrink-0 items-center justify-center rounded bg-[#b5502e] text-xs font-semibold text-white">
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

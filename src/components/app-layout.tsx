import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { AppSidebar, NAV_ADMINISTRACION, NAV_ATENCION } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
import { esConsultorio, puede, useAuth } from '@/lib/auth-context'
import { BuscadorGlobal } from '@/components/buscador-global'
import { AvisoNotificaciones } from '@/components/notificaciones/aviso-notificaciones'
import { cn } from '@/lib/utils'
import { CalendarDays, LayoutDashboard, Menu, Receipt, Search, Stethoscope, Users } from 'lucide-react'

function tituloDe(pathname: string, consultorio: boolean) {
  if (pathname === '/perfil') return 'Mi perfil'
  if (pathname === '/configuracion') return 'Configuración'
  if (pathname.startsWith('/atencion')) return 'Consulta'
  const item = [...NAV_ATENCION, ...NAV_ADMINISTRACION].find((i) => (i.end ? pathname === i.to : pathname.startsWith(i.to)))
  if (item?.to === '/personal' && consultorio) return 'Mi asistente'
  return item?.label ?? ''
}

/** En el telefono la navegacion vive abajo, al alcance del pulgar, como en una app. */
function BarraInferior() {
  const { sesion } = useAuth()
  const { setOpenMobile } = useSidebar()
  const items = [
    { to: '/panel', label: 'Hoy', icon: LayoutDashboard, end: true },
    { to: '/agenda', label: 'Agenda', icon: CalendarDays, end: false },
    { to: '/pacientes', label: 'Pacientes', icon: Users, end: false },
    puede(sesion, 'clinico')
      ? { to: '/consultas', label: 'Consultas', icon: Stethoscope, end: false }
      : { to: '/facturas', label: 'Facturas', icon: Receipt, end: false },
  ]
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden print:hidden"
    >
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn('flex flex-col items-center gap-0.5 pt-2 pb-1.5 text-[11px] font-medium transition-colors', isActive ? 'text-primary' : 'text-muted-foreground')
          }
        >
          {({ isActive }) => (
            <>
              <span className={cn('flex h-7 w-12 items-center justify-center rounded-full transition-colors', isActive && 'bg-info-suave')}>
                <item.icon className="size-5" />
              </span>
              {item.label}
            </>
          )}
        </NavLink>
      ))}
      <button type="button" onClick={() => setOpenMobile(true)} className="flex flex-col items-center gap-0.5 pt-2 pb-1.5 text-[11px] font-medium text-muted-foreground">
        <span className="flex h-7 w-12 items-center justify-center">
          <Menu className="size-5" />
        </span>
        Más
      </button>
    </nav>
  )
}

export function AppLayout() {
  const { pathname } = useLocation()
  const { sesion } = useAuth()
  const [buscando, setBuscando] = useState(false)
  const hoy = new Date().toLocaleDateString('es-SV', { weekday: 'long', day: 'numeric', month: 'long' })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setBuscando(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur md:px-8 print:hidden">
          <SidebarTrigger className="-ml-1.5 hidden text-muted-foreground hover:text-foreground md:inline-flex" />
          <span className="truncate text-base font-semibold text-tinta md:hidden">{tituloDe(pathname, esConsultorio(sesion))}</span>
          <button
            type="button"
            onClick={() => setBuscando(true)}
            className="hidden h-9 w-72 items-center gap-2 rounded-md border bg-card px-3 text-sm text-muted-foreground transition-colors hover:border-ring/50 hover:text-foreground md:flex"
          >
            <Search className="size-4" />
            Buscar paciente…
            <kbd className="ml-auto rounded border bg-muted px-1.5 py-0.5 text-[11px]">Ctrl K</kbd>
          </button>
          <time className="ml-auto hidden shrink-0 text-sm text-muted-foreground first-letter:uppercase md:block">{hoy}</time>
          <button type="button" aria-label="Buscar" onClick={() => setBuscando(true)} className="-mr-1.5 ml-auto rounded-md p-2 text-muted-foreground hover:bg-muted md:hidden">
            <Search className="size-5" />
          </button>
        </header>
        <AvisoNotificaciones />
        {/* la clave reinicia la animacion: cada modulo entra como una hoja nueva */}
        <main key={pathname} className="hoja-entra mx-auto w-full max-w-[1320px] flex-1 px-4 pt-5 pb-28 md:px-8 md:py-8">
          <Outlet />
        </main>
      </SidebarInset>
      <BarraInferior />
      <BuscadorGlobal abierto={buscando} onAbiertoChange={setBuscando} />
    </SidebarProvider>
  )
}

import { Outlet, useLocation } from 'react-router-dom'
import { AppSidebar, NAV_ADMINISTRACION, NAV_ATENCION } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { esConsultorio, useAuth } from '@/lib/auth-context'

function tituloDe(pathname: string, consultorio: boolean) {
  if (pathname === '/perfil') return 'Mi perfil'
  if (pathname === '/configuracion') return 'Configuración'
  const item = [...NAV_ATENCION, ...NAV_ADMINISTRACION].find((i) =>
    i.end ? pathname === i.to : pathname.startsWith(i.to),
  )
  if (item?.to === '/personal' && consultorio) return 'Mi asistente'
  return item?.label ?? ''
}

export function AppLayout() {
  const { pathname } = useLocation()
  const { sesion } = useAuth()
  const hoy = new Date().toLocaleDateString('es-SV', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4 md:px-8">
          <SidebarTrigger className="-ml-1.5 text-muted-foreground hover:text-foreground" />
          <span className="truncate text-sm font-semibold text-tinta md:hidden">
            {tituloDe(pathname, esConsultorio(sesion))}
          </span>
          <time className="ml-auto shrink-0 text-sm text-muted-foreground first-letter:uppercase">{hoy}</time>
        </header>
        {/* la clave reinicia la animacion: cada modulo entra como una hoja nueva */}
        <main key={pathname} className="hoja-entra mx-auto w-full max-w-[1320px] flex-1 px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

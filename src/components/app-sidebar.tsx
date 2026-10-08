import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from 'next-themes'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { esConsultorio, etiquetaRol, puede, useAuth, type Permiso } from '@/lib/auth-context'
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Stethoscope,
  Receipt,
  UserCog,
  CreditCard,
  BarChart3,
  LogOut,
  User,
  Sun,
  Moon,
  ChevronsUpDown,
  Settings,
} from 'lucide-react'

export const NAV_ATENCION = [
  { to: '/panel', label: 'Hoja del día', icon: LayoutDashboard, end: true },
  { to: '/agenda', label: 'Agenda', icon: CalendarDays, end: false },
  { to: '/pacientes', label: 'Pacientes', icon: Users, end: false },
  { to: '/consultas', label: 'Consultas', icon: Stethoscope, end: false, permiso: 'clinico' as Permiso },
]

export const NAV_ADMINISTRACION = [
  { to: '/facturas', label: 'Facturación', icon: Receipt, end: false },
  { to: '/reportes', label: 'Reportes', icon: BarChart3, end: false, permiso: 'administrar' as Permiso },
  { to: '/personal', label: 'Personal', icon: UserCog, end: false, permiso: 'administrar' as Permiso },
  { to: '/suscripcion', label: 'Suscripción', icon: CreditCard, end: false, permiso: 'administrar' as Permiso },
  { to: '/configuracion', label: 'Configuración', icon: Settings, end: false, permiso: 'administrar' as Permiso },
]

function iniciales(nombre: string) {
  return nombre
    .split(' ')
    .filter(Boolean)
    .filter((parte) => !/^(dr|dra)\.?$/i.test(parte))
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('')
}

/** Marca: un folder de expediente con su pestana y dos bandas de archivo. */
export function MarcaArchivo() {
  return (
    <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden="true">
      <path d="M3 9.5A2.5 2.5 0 0 1 5.5 7h7l2.6 2.6H26.5A2.5 2.5 0 0 1 29 12.1v12.4A2.5 2.5 0 0 1 26.5 27h-21A2.5 2.5 0 0 1 3 24.5Z" fill="#EEF2F6" />
      <rect x="21" y="15" width="3.2" height="8" rx="0.6" fill="#2457A6" />
      <rect x="24.6" y="15" width="3.2" height="8" rx="0.6" fill="#3B8C3E" />
      <rect x="7" y="15" width="10" height="1.6" rx="0.8" fill="#1B3150" opacity="0.55" />
      <rect x="7" y="19" width="7" height="1.6" rx="0.8" fill="#1B3150" opacity="0.35" />
    </svg>
  )
}

interface ItemNav {
  to: string
  label: string
  icon: typeof LayoutDashboard
  end: boolean
  permiso?: Permiso
}

function GrupoNav({ titulo, items }: { titulo: string; items: ItemNav[] }) {
  const { pathname } = useLocation()
  const { isMobile, setOpenMobile } = useSidebar()

  return (
    <SidebarGroup className="py-1 pr-0 pl-3 group-data-[collapsible=icon]:pr-2 group-data-[collapsible=icon]:pl-2">
      <SidebarGroupLabel className="h-7 px-2 text-[11px] font-semibold tracking-[0.06em] text-sidebar-foreground/50 uppercase">
        {titulo}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="gap-px">
          {items.map((item) => {
            const activo = item.end ? pathname === item.to : pathname.startsWith(item.to)
            return (
              <SidebarMenuItem key={item.to}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.label}
                  isActive={activo}
                  className={
                    // La pestana activa toma el color de la hoja y llega hasta el
                    // borde, como el folder que se saca de la gaveta.
                    'h-9 gap-3 rounded-l-md rounded-r-none pl-3 text-[13.5px] text-sidebar-foreground/80 transition-colors duration-150 ' +
                    'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ' +
                    'data-[active=false]:bg-transparent data-[active=false]:hover:bg-sidebar-accent ' +
                    'data-[active=true]:bg-sidebar-primary data-[active=true]:font-semibold data-[active=true]:text-sidebar-primary-foreground ' +
                    'data-[active=true]:shadow-[-2px_1px_3px_-1px_rgb(0_0_0/0.25)] ' +
                    'group-data-[collapsible=icon]:rounded-md [&_svg]:size-[17px]'
                  }
                >
                  <NavLink to={item.to} end={item.end} onClick={() => isMobile && setOpenMobile(false)}>
                    <item.icon />
                    <span>{item.label}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

export function AppSidebar() {
  const { sesion, logout } = useAuth()
  const navigate = useNavigate()
  const { resolvedTheme, setTheme } = useTheme()
  const esOscuro = resolvedTheme === 'dark'
  const consultorio = esConsultorio(sesion)
  const permitido = (item: ItemNav) => !item.permiso || puede(sesion, item.permiso)
  const atencion = NAV_ATENCION.filter(permitido)
  const administracion = (
    consultorio
      ? NAV_ADMINISTRACION.map((item) => (item.to === '/personal' ? { ...item, label: 'Mi asistente' } : item))
      : NAV_ADMINISTRACION
  ).filter(permitido)

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="px-4 pt-5 pb-4 group-data-[collapsible=icon]:px-2">
        <div className="flex items-center gap-3">
          <MarcaArchivo />
          <div className="min-w-0 leading-tight group-data-[collapsible=icon]:hidden">
            <p className="text-[15px] font-semibold tracking-[-0.01em] text-sidebar-accent-foreground">GoRam Clinic</p>
            <p className="truncate text-xs text-sidebar-foreground/65">{sesion?.clinicaNombre ?? (consultorio ? 'Consultorio individual' : 'Clínica')}</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="gap-3">
        <GrupoNav titulo="Atención" items={atencion} />
        {administracion.length > 0 && <GrupoNav titulo="Administración" items={administracion} />}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-3 group-data-[collapsible=icon]:p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="gap-3 rounded-md hover:bg-sidebar-accent data-[state=open]:bg-sidebar-accent"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
                {iniciales(sesion?.nombre ?? '')}
              </span>
              <div className="flex min-w-0 flex-1 flex-col text-left leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate text-sm font-medium text-sidebar-accent-foreground">{sesion?.nombre}</span>
                <span className="truncate text-xs text-sidebar-foreground/65">{etiquetaRol(sesion)}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-60">
            <DropdownMenuItem onSelect={() => navigate('/perfil')}>
              <User />
              Mi perfil
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setTheme(esOscuro ? 'light' : 'dark')}>
              {esOscuro ? <Sun /> : <Moon />}
              {esOscuro ? 'Modo claro' : 'Modo oscuro'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={logout}>
              <LogOut />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

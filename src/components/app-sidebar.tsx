import { NavLink, useNavigate } from 'react-router-dom'
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
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/lib/auth-context'
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
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/panel', label: 'Panel', icon: LayoutDashboard, end: true },
  { to: '/pacientes', label: 'Pacientes', icon: Users, end: false },
  { to: '/agenda', label: 'Agenda', icon: CalendarDays, end: false },
  { to: '/consultas', label: 'Consultas', icon: Stethoscope, end: false },
  { to: '/facturas', label: 'Facturacion', icon: Receipt, end: false },
  { to: '/reportes', label: 'Reportes', icon: BarChart3, end: false },
  { to: '/personal', label: 'Personal', icon: UserCog, end: false },
  { to: '/suscripcion', label: 'Suscripcion', icon: CreditCard, end: false },
]

function iniciales(nombre: string) {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('')
}

export function AppSidebar() {
  const { sesion, logout } = useAuth()
  const navigate = useNavigate()
  const { resolvedTheme, setTheme } = useTheme()
  const esOscuro = resolvedTheme === 'dark'

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary font-semibold text-primary-foreground">
            G
          </div>
          <span className="font-semibold group-data-[collapsible=icon]:hidden">GoRam Clinic</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Clinica</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild tooltip={item.label}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : ''
                      }
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
              <Avatar className="size-6">
                <AvatarFallback className="text-xs">{iniciales(sesion?.nombre ?? '')}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col text-left leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate text-sm font-medium">{sesion?.nombre}</span>
                <span className="truncate text-xs text-muted-foreground">{sesion?.rol}</span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuItem onSelect={() => navigate('/perfil')}>
              <User />
              Mi perfil
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setTheme(esOscuro ? 'light' : 'dark')}>
              {esOscuro ? <Sun /> : <Moon />}
              {esOscuro ? 'Modo claro' : 'Modo oscuro'}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={logout}>
              <LogOut />
              Cerrar sesion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

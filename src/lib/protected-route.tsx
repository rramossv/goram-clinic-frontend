import { Navigate, Outlet } from 'react-router-dom'
import { puede, useAuth, type Permiso } from '@/lib/auth-context'

export function ProtectedRoute() {
  const { sesion, cargando } = useAuth()

  if (cargando) return null

  if (!sesion) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

/** Rutas que un rol no puede usar redirigen a la hoja del dia en vez de mostrar errores. */
export function RequierePermiso({ permiso }: { permiso: Permiso }) {
  const { sesion } = useAuth()
  return puede(sesion, permiso) ? <Outlet /> : <Navigate to="/panel" replace />
}

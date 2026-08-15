import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'

export function ProtectedRoute() {
  const { sesion, cargando } = useAuth()

  if (cargando) return null

  if (!sesion) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

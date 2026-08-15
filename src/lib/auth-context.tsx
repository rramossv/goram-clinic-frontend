import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { apiFetch, SESION_STORAGE_KEY } from '@/lib/api'

export interface SesionUsuario {
  token: string
  usuarioId: string
  tenantId: string | null
  rol: string
  email: string
  nombre: string
}

interface LoginResponse extends SesionUsuario {
  tokenType: string
  expiraEnMinutos: number
}

interface AuthContextValue {
  sesion: SesionUsuario | null
  cargando: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function leerSesionGuardada(): SesionUsuario | null {
  const raw = localStorage.getItem(SESION_STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as SesionUsuario
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<SesionUsuario | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    setSesion(leerSesionGuardada())
    setCargando(false)
  }, [])

  useEffect(() => {
    function alRecibirNoAutorizado() {
      logout()
    }
    window.addEventListener('goram:unauthorized', alRecibirNoAutorizado)
    return () => window.removeEventListener('goram:unauthorized', alRecibirNoAutorizado)
  }, [])

  async function login(email: string, password: string) {
    const response = await apiFetch<LoginResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
    })

    const nuevaSesion: SesionUsuario = {
      token: response.token,
      usuarioId: response.usuarioId,
      tenantId: response.tenantId,
      rol: response.rol,
      email: response.email,
      nombre: response.nombre,
    }

    localStorage.setItem(SESION_STORAGE_KEY, JSON.stringify(nuevaSesion))
    setSesion(nuevaSesion)
  }

  function logout() {
    localStorage.removeItem(SESION_STORAGE_KEY)
    setSesion(null)
  }

  return (
    <AuthContext.Provider value={{ sesion, cargando, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}

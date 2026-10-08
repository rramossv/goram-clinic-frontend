import { useState, type FormEvent } from 'react'
import { useNavigate, Navigate, Link } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { ApiRequestError } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MarcaArchivo } from '@/components/app-sidebar'

// Folders del archivo, dibujados con la gramatica del sistema: cada modulo
// es un expediente con su pestana y sus bandas de color.
const FOLDERS = [
  { titulo: 'Agenda', detalle: 'Citas por hora y por doctor', bandas: ['#2457A6', '#3B8C3E'], desfase: 'ml-0' },
  { titulo: 'Expedientes', detalle: 'Historial, alergias y recetas', bandas: ['#B42318', '#5B3FA0'], desfase: 'ml-10' },
  { titulo: 'Facturación', detalle: 'Factura interna o electrónica DTE', bandas: ['#1F7A8C', '#D9661F'], desfase: 'ml-20' },
]

function ArchivoIlustrado() {
  return (
    <div className="flex flex-col" aria-hidden="true">
      {FOLDERS.map((folder, i) => (
        <div key={folder.titulo} className={`${folder.desfase} relative`} style={{ zIndex: i, marginTop: i === 0 ? 0 : -18 }}>
          <div className="ml-4 inline-flex h-7 items-center rounded-t-md bg-[oklch(0.94_0.012_245)] px-4 text-xs font-semibold text-[oklch(0.3_0.05_256)]">
            {folder.titulo}
          </div>
          <div className="flex h-24 w-[22rem] items-start justify-between rounded-md rounded-tl-none bg-[oklch(0.97_0.006_245)] p-4 shadow-[0_10px_30px_-12px_rgb(0_0_0/0.45)]">
            <div className="flex flex-col gap-2 pt-1">
              <span className="text-sm text-[oklch(0.45_0.035_255)]">{folder.detalle}</span>
              <span className="h-1.5 w-32 rounded-full bg-[oklch(0.88_0.012_245)]" />
              <span className="h-1.5 w-20 rounded-full bg-[oklch(0.9_0.01_245)]" />
            </div>
            <div className="flex overflow-hidden rounded-[3px]">
              {folder.bandas.map((color) => (
                <span key={color} className="h-12 w-4" style={{ backgroundColor: color }} />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function LoginPage() {
  const { sesion, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  if (sesion) {
    return <Navigate to="/panel" replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setEnviando(true)
    try {
      await login(email, password)
      navigate('/panel', { replace: true })
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.body?.message ?? 'No se pudo iniciar sesión')
      } else {
        setError('No se pudo conectar con el servidor')
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="grid min-h-svh bg-background lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-12 text-sidebar-foreground lg:flex">
        <Link to="/" className="flex items-center gap-3">
          <MarcaArchivo />
          <span className="text-[15px] font-semibold text-sidebar-accent-foreground">GoRam Clinic</span>
        </Link>

        <div className="flex flex-col gap-12">
          <div className="max-w-md">
            <h2 className="text-[2rem] leading-[1.15] font-semibold tracking-[-0.02em] text-sidebar-accent-foreground">
              Tu consulta, en orden.
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-sidebar-foreground/75">
              Agenda, expedientes y facturación en un solo archivo, para consultorios y clínicas de El Salvador.
            </p>
          </div>
          <ArchivoIlustrado />
        </div>

        <p className="text-xs text-sidebar-foreground/55">GoRam Clinic · un producto de la marca GoRam</p>
      </aside>

      <main className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-10 flex items-center gap-3 lg:hidden">
            <span className="rounded-md bg-sidebar p-1">
              <MarcaArchivo />
            </span>
            <span className="text-[15px] font-semibold text-tinta">GoRam Clinic</span>
          </Link>

          <h1 className="text-2xl font-semibold tracking-[-0.015em] text-tinta">Ingresar</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Accede al archivo de tu consultorio o clínica.</p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Correo</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                className="h-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <Link to="/olvide-password" className="text-xs font-medium text-primary hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                className="h-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <p role="alert" className="rounded-md bg-peligro-suave px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" disabled={enviando} className="mt-1 h-10 text-sm">
              {enviando ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>

          <p className="mt-8 border-t pt-6 text-sm text-muted-foreground">
            ¿No tenés cuenta?{' '}
            <Link to="/registro" className="font-medium text-primary hover:underline">
              Registra tu consultorio o clínica
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}

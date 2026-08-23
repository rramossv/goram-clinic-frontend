import { Link } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  const { sesion } = useAuth()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-muted/40 p-4 text-center">
      <p className="text-sm font-medium text-muted-foreground">Error 404</p>
      <h1 className="text-3xl font-semibold">Esta pagina no existe</h1>
      <p className="max-w-sm text-muted-foreground">
        Revisa el enlace que usaste, o volve al inicio.
      </p>
      <Button asChild className="mt-2">
        <Link to={sesion ? '/panel' : '/'}>{sesion ? 'Ir a mi panel' : 'Volver al inicio'}</Link>
      </Button>
    </div>
  )
}

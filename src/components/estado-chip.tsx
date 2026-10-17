import type { ComponentType } from 'react'
import {
  Armchair,
  Ban,
  CheckCheck,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  CircleOff,
  Clock,
  FileCheck2,
  Stethoscope,
  UserX,
  XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Tono = 'neutro' | 'info' | 'exito' | 'aviso' | 'peligro'

interface DefinicionEstado {
  etiqueta: string
  tono: Tono
  icono: ComponentType<{ className?: string }>
}

// Un solo vocabulario de estados para toda la app. El estado se lee por
// icono + texto; el color solo refuerza (accesible sin distinguir colores).
const ESTADOS: Record<string, DefinicionEstado> = {
  // citas
  PROGRAMADA: { etiqueta: 'Programada', tono: 'info', icono: Clock },
  CONFIRMADA: { etiqueta: 'Confirmada', tono: 'exito', icono: CircleCheck },
  EN_ESPERA: { etiqueta: 'En sala de espera', tono: 'aviso', icono: Armchair },
  EN_CONSULTA: { etiqueta: 'En consulta', tono: 'info', icono: Stethoscope },
  COMPLETADA: { etiqueta: 'Atendida', tono: 'neutro', icono: CheckCheck },
  CANCELADA: { etiqueta: 'Cancelada', tono: 'peligro', icono: XCircle },
  NO_ASISTIO: { etiqueta: 'No asistió', tono: 'aviso', icono: UserX },
  // facturas
  PENDIENTE: { etiqueta: 'Pendiente', tono: 'aviso', icono: CircleDashed },
  EMITIDA: { etiqueta: 'Emitida', tono: 'exito', icono: FileCheck2 },
  RECHAZADA: { etiqueta: 'Rechazada', tono: 'peligro', icono: CircleAlert },
  ANULADA: { etiqueta: 'Anulada', tono: 'neutro', icono: Ban },
  // suscripcion
  ACTIVA: { etiqueta: 'Activa', tono: 'exito', icono: CircleCheck },
  PENDIENTE_PAGO: { etiqueta: 'Pendiente de pago', tono: 'aviso', icono: CircleDashed },
  SUSPENDIDA: { etiqueta: 'Suspendida', tono: 'peligro', icono: CircleOff },
  // registros (pacientes, personal)
  ACTIVO: { etiqueta: 'Activo', tono: 'exito', icono: CircleCheck },
  INACTIVO: { etiqueta: 'Inactivo', tono: 'neutro', icono: CircleOff },
}

const CLASE_TONO: Record<Tono, string> = {
  neutro: 'bg-muted text-muted-foreground ring-border',
  info: 'bg-info-suave text-info ring-info/20',
  exito: 'bg-exito-suave text-exito ring-exito/20',
  aviso: 'bg-aviso-suave text-aviso ring-aviso/25',
  peligro: 'bg-peligro-suave text-destructive ring-destructive/20',
}

export function etiquetaEstado(estado: string) {
  return ESTADOS[estado]?.etiqueta ?? estado
}

export function tonoEstado(estado: string): Tono {
  return ESTADOS[estado]?.tono ?? 'neutro'
}

export function EstadoChip({ estado, className }: { estado: string; className?: string }) {
  const def = ESTADOS[estado] ?? { etiqueta: estado, tono: 'neutro' as Tono, icono: CircleDashed }
  const Icono = def.icono
  return (
    <span
      className={cn(
        'inline-flex h-6 shrink-0 items-center gap-1.5 rounded-[4px] px-2 text-xs font-medium whitespace-nowrap ring-1 ring-inset',
        CLASE_TONO[def.tono],
        estado === 'CANCELADA' && 'line-through decoration-1',
        className,
      )}
    >
      <Icono className="size-3.5 shrink-0" />
      {def.etiqueta}
    </span>
  )
}

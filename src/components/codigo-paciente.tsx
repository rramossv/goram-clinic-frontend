import { cn } from '@/lib/utils'

// Colores de etiqueta de archivo por digito (sistema de archivo por digito
// terminal). Cada paciente lleva dos bandas derivadas de su id: estables,
// unicas a la vista, y acompanadas siempre de los digitos para no depender
// solo del color.
const COLOR_DIGITO = [
  '#B42318', // 0 rojo
  '#D9661F', // 1 naranja
  '#B8901A', // 2 mostaza
  '#3B8C3E', // 3 verde
  '#1F7A8C', // 4 petroleo
  '#2457A6', // 5 azul
  '#5B3FA0', // 6 morado
  '#8E3B78', // 7 ciruela
  '#7A5638', // 8 cafe
  '#4A5563', // 9 pizarra
]

export function digitosDe(id: string): [number, number] {
  const hex = id.replace(/-/g, '')
  const n = parseInt(hex.slice(-4), 16) % 100
  return [Math.floor(n / 10), n % 10]
}

interface CodigoPacienteProps {
  id: string
  tamano?: 'sm' | 'lg'
  className?: string
}

export function CodigoPaciente({ id, tamano = 'sm', className }: CodigoPacienteProps) {
  const [a, b] = digitosDe(id)
  const grande = tamano === 'lg'
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-stretch overflow-hidden rounded-[3px] ring-1 ring-black/10 dark:ring-white/15',
        grande ? 'h-8' : 'h-[18px]',
        className,
      )}
      title={`Código de expediente ${a}${b}`}
      aria-label={`Código de expediente ${a}${b}`}
      role="img"
    >
      {[a, b].map((digito, i) => (
        <span
          key={i}
          className={cn(
            'flex items-center justify-center font-semibold text-white [font-variant-numeric:tabular-nums]',
            grande ? 'w-6 text-sm' : 'w-[14px] text-[10px]',
          )}
          style={{ backgroundColor: COLOR_DIGITO[digito] }}
        >
          {digito}
        </span>
      ))}
    </span>
  )
}

import type { PlanResponse } from '@/types'
import { cn } from '@/lib/utils'

// Pantallas reales del sistema (capturas con datos de demostracion) y las
// piezas que no son capturas: el telefono con los avisos.

export const PANTALLAS: Record<string, { titulo: string; imagen?: string; ancho?: number; alto?: number }> = {
  'hoja-del-dia': { titulo: 'Hoja del día', imagen: '/landing/hoja-del-dia.png', ancho: 2160, alto: 1350 },
  agenda: { titulo: 'Agenda', imagen: '/landing/agenda.png', ancho: 2160, alto: 1350 },
  consulta: { titulo: 'Consulta', imagen: '/landing/consulta.png', ancho: 2160, alto: 1350 },
  receta: { titulo: 'Receta', imagen: '/landing/receta.png' },
  expediente: { titulo: 'Expediente', imagen: '/landing/expediente.png' },
  facturacion: { titulo: 'Facturación', imagen: '/landing/facturacion.png', ancho: 2160, alto: 1350 },
  avisos: { titulo: 'Avisos en el teléfono' },
  movil: { titulo: 'En el teléfono' },
  seguridad: { titulo: 'Receta verificada' },
  planes: { titulo: 'Planes' },
}

/** Un telefono dibujado: marco, pantalla y contenido. */
export function Telefono({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('gl-telefono', className)}>
      <div className="gl-telefono-pantalla">{children}</div>
    </div>
  )
}

export function Notificacion({ titulo, cuerpo, hora, className }: { titulo: string; cuerpo: string; hora: string; className?: string }) {
  return (
    <div className={cn('gl-notificacion', className)}>
      <img src="/iconos/icono-192.png" alt="" width={36} height={36} />
      <div className="min-w-0">
        <p className="flex items-baseline justify-between gap-2 text-[11px] text-white/70">
          <span className="font-semibold tracking-wide text-white/85 uppercase">GoRam Clinic</span>
          <span>{hora}</span>
        </p>
        <p className="mt-0.5 text-[13px] leading-snug font-semibold text-white">{titulo}</p>
        <p className="text-[12.5px] leading-snug text-white/80">{cuerpo}</p>
      </div>
    </div>
  )
}

/** Pantalla de bloqueo con los avisos reales que manda el sistema. */
export function PantallaAvisos() {
  return (
    <div className="gl-bloqueo">
      <p className="text-center text-[13px] font-medium text-white/80">lunes 26 de octubre</p>
      <p className="text-center text-[64px] leading-none font-semibold tracking-tight text-white tabular-nums">6:30</p>
      <div className="mt-6 flex flex-col gap-2">
        <Notificacion hora="6:30 a. m." titulo="Buenos días: hoy tenés 8 citas" cuerpo="La primera a las 8:00 a. m. con Ana Martínez; la última a las 4:00 p. m." />
        <Notificacion hora="8:51 a. m." titulo="Carlos Rivas llegó" cuerpo="Está en sala de espera · cita de las 9:00 a. m." />
        <Notificacion hora="9:15 a. m." titulo="En 15 min: María López" cuerpo="9:30 a. m. · Primera consulta" />
      </div>
    </div>
  )
}

function Tarifario({ planes }: { planes: PlanResponse[] }) {
  return (
    <div className="gl-tarifario-hoja flex h-full flex-col justify-center gap-0 bg-[var(--gl-hoja)] px-6 py-6 sm:px-10">
      {planes.map((p) => (
        <div key={p.id} className="flex items-baseline justify-between gap-4 border-b border-[var(--gl-filete)] py-4 last:border-b-0">
          <div>
            <p className="text-lg font-semibold text-[var(--gl-tinta)]">{p.nombre}</p>
            <p className="text-sm text-[var(--gl-texto2)]">
              {p.limiteDoctores === null ? 'Médicos sin límite' : p.limiteDoctores === 1 ? '1 médico' : `Hasta ${p.limiteDoctores} médicos`}
              {' · '}
              {p.incluyeFacturacionElectronica ? 'con facturación electrónica DTE' : 'factura interna'}
            </p>
          </div>
          <p className="text-3xl font-semibold tracking-tight text-[var(--gl-tinta)] tabular-nums">
            ${Number(p.precioMensual).toFixed(0)}
            <span className="ml-1 text-sm font-normal text-[var(--gl-texto2)]">/mes</span>
          </p>
        </div>
      ))}
    </div>
  )
}

/**
 * La hoja que sale de la gaveta: una pestaña con el nombre del modulo y la
 * pantalla real debajo. Al cambiar de pantalla, la hoja nueva sube como un
 * folder que se saca del archivo.
 */
export function HojaPantalla({ pantalla, planes, prioridad }: { pantalla: string; planes: PlanResponse[]; prioridad?: boolean }) {
  const def = PANTALLAS[pantalla] ?? PANTALLAS['hoja-del-dia']
  const esTelefono = pantalla === 'avisos' || pantalla === 'movil' || pantalla === 'seguridad'

  return (
    <figure className="gl-folder" aria-label={`Pantalla: ${def.titulo}`}>
      <figcaption className="gl-pestana">
        <span className="gl-bandas" aria-hidden="true">
          <i />
          <i />
        </span>
        {def.titulo}
      </figcaption>
      <div key={pantalla} className={cn('gl-hoja', esTelefono && 'gl-hoja-telefono', pantalla === 'receta' && 'gl-hoja-receta')}>
        {pantalla === 'avisos' && (
          <Telefono>
            <PantallaAvisos />
          </Telefono>
        )}
        {pantalla === 'movil' && (
          <Telefono>
            <img src="/landing/movil-panel.png" alt="Hoja del día de GoRam Clinic en un teléfono" width={1170} height={2532} />
          </Telefono>
        )}
        {pantalla === 'seguridad' && (
          <Telefono>
            <img src="/landing/verificacion.png" alt="Verificación pública de una receta: solo muestra las iniciales del paciente" width={1170} height={2532} />
          </Telefono>
        )}
        {pantalla === 'planes' && <Tarifario planes={planes} />}
        {def.imagen && (
          <img
            src={def.imagen}
            alt={`${def.titulo} de GoRam Clinic con datos de demostración`}
            width={def.ancho}
            height={def.alto}
            loading={prioridad ? 'eager' : 'lazy'}
            decoding="async"
          />
        )}
      </div>
    </figure>
  )
}

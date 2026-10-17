import { useState } from 'react'
import { apiFetch } from '@/lib/api'
import type { PacienteResponse } from '@/types'
import { enlaceWhatsApp, telefonoWhatsApp } from '@/lib/whatsapp'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

/** Logo de WhatsApp en un solo trazo, para el boton. */
function IconoWhatsApp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91A9.85 9.85 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.23 8.23 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24a8.2 8.2 0 0 1 5.83 2.42 8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23a7.5 7.5 0 0 1-1.38-1.72c-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48a.92.92 0 0 0-.67.31c-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.02 2.56.12.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.17-.48-.29Z" />
    </svg>
  )
}

interface Props {
  pacienteId: string
  /** arma el mensaje con el nombre del paciente ya cargado */
  mensaje: (paciente: PacienteResponse) => string
  etiqueta?: string
  variant?: 'outline' | 'ghost' | 'default'
  size?: 'default' | 'sm'
}

export function WhatsAppBoton({ pacienteId, mensaje, etiqueta = 'WhatsApp', variant = 'outline', size = 'default' }: Props) {
  const [cargando, setCargando] = useState(false)

  async function abrir() {
    // la pestana se abre dentro del clic para que el navegador no la bloquee
    const ventana = window.open('', '_blank')
    setCargando(true)
    try {
      const paciente = await apiFetch<PacienteResponse>(`/api/v1/pacientes/${pacienteId}`)
      const telefono = telefonoWhatsApp(paciente.telefono)
      if (!telefono) {
        ventana?.close()
        toast.error(`${paciente.nombre} no tiene un teléfono válido registrado. Agregalo en su ficha.`)
        return
      }
      const url = enlaceWhatsApp(telefono, mensaje(paciente))
      if (ventana) ventana.location.href = url
      else window.location.href = url
    } catch {
      ventana?.close()
      toast.error('No se pudo preparar el mensaje')
    } finally {
      setCargando(false)
    }
  }

  return (
    <Button type="button" variant={variant} size={size} onClick={abrir} disabled={cargando}>
      <IconoWhatsApp className="size-4 text-[#1a9e55]" />
      {etiqueta}
    </Button>
  )
}

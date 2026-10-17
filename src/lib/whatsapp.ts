// WhatsApp sin integracion de pago: un enlace wa.me abre la app (o WhatsApp
// Web) con el mensaje ya escrito; el consultorio solo toca "Enviar".

/** "7123-4567" -> "50371234567". Numeros extranjeros se usan tal cual (con su codigo). */
export function telefonoWhatsApp(telefono: string | null | undefined) {
  if (!telefono) return null
  const digitos = telefono.replace(/\D/g, '')
  if (digitos.length === 8) return `503${digitos}`
  if (digitos.length === 11 && digitos.startsWith('503')) return digitos
  return digitos.length >= 10 ? digitos : null
}

export function enlaceWhatsApp(telefono: string, mensaje: string) {
  return `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`
}

const primerNombre = (nombre: string) => nombre.trim().split(/\s+/)[0]

export function mensajeRecordatorio(opciones: { paciente: string; doctor: string; fechaHora: string; clinica?: string | null; direccion?: string | null }) {
  const fecha = new Date(opciones.fechaHora)
  const dia = fecha.toLocaleDateString('es-SV', { weekday: 'long', day: 'numeric', month: 'long' })
  const hora = fecha.toLocaleTimeString('es-SV', { hour: 'numeric', minute: '2-digit' })
  return [
    `Hola ${primerNombre(opciones.paciente)}, le saludamos de ${opciones.clinica ?? 'su consultorio'}.`,
    `Le recordamos su cita con ${opciones.doctor} el ${dia} a las ${hora}.`,
    opciones.direccion ? `Dirección: ${opciones.direccion}.` : null,
    'Si necesita reprogramar, por favor responda a este mensaje. ¡Le esperamos!',
  ]
    .filter(Boolean)
    .join('\n')
}

export function mensajeIndicaciones(opciones: {
  paciente: string
  doctor: string
  medicamentos: { medicamento: string; detalle: string }[]
  indicaciones?: string | null
  proximoControl?: string | null
}) {
  const lineas = [`Hola ${primerNombre(opciones.paciente)}, estas son las indicaciones de su consulta con ${opciones.doctor}:`]
  if (opciones.medicamentos.length) {
    lineas.push('', '*Medicamentos*')
    opciones.medicamentos.forEach((m, i) => lineas.push(`${i + 1}. ${m.medicamento}${m.detalle ? ` — ${m.detalle}` : ''}`))
  }
  if (opciones.indicaciones) lineas.push('', '*Indicaciones*', opciones.indicaciones)
  if (opciones.proximoControl) {
    const f = new Date(`${opciones.proximoControl}T12:00:00`).toLocaleDateString('es-SV', { weekday: 'long', day: 'numeric', month: 'long' })
    lineas.push('', `*Próximo control:* ${f}`)
  }
  lineas.push('', 'Ante cualquier duda, escríbanos por aquí.')
  return lineas.join('\n')
}

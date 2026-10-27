import { useCallback, useEffect, useRef, useState } from 'react'
import { apiFetch, ApiRequestError } from '@/lib/api'

export interface MensajeAsistente {
  rol: 'usuario' | 'asistente'
  texto: string
}

interface RespuestaAsistente {
  respuesta: string
  pantalla: string | null
  sugerencias: string[]
  origen: string
}

export const SALUDO =
  'Buen día. Soy el asistente de GoRam Clinic y respondo a cualquier hora. Le explico el sistema en dos minutos, le muestro cómo se usa o le ayudo a elegir su plan. ¿Por dónde empezamos?'

export const SUGERENCIAS_INICIALES = ['¿Cuánto cuesta?', 'Enséñeme a usarlo', '¿Cómo hago una receta?', '¿Funciona en el teléfono?', '¿Mis datos están seguros?']

const CLAVE = 'goram_asistente_conversacion'

interface Estado {
  mensajes: MensajeAsistente[]
  pantalla: string
  sugerencias: string[]
}

function leer(): Estado | null {
  try {
    const crudo = sessionStorage.getItem(CLAVE)
    return crudo ? (JSON.parse(crudo) as Estado) : null
  } catch {
    return null
  }
}

/**
 * Conversacion del asistente de la pagina publica. Un solo estado para el
 * asistente de la portada y el flotante: es la misma persona.
 */
export function useAsistente() {
  const inicial = leer()
  const [mensajes, setMensajes] = useState<MensajeAsistente[]>(inicial?.mensajes ?? [{ rol: 'asistente', texto: SALUDO }])
  const [pantalla, setPantalla] = useState(inicial?.pantalla ?? 'hoja-del-dia')
  const [sugerencias, setSugerencias] = useState<string[]>(inicial?.sugerencias ?? SUGERENCIAS_INICIALES)
  const [pensando, setPensando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const enCurso = useRef(false)

  useEffect(() => {
    try {
      sessionStorage.setItem(CLAVE, JSON.stringify({ mensajes, pantalla, sugerencias }))
    } catch {
      // la conversacion se pierde al recargar; no es grave
    }
  }, [mensajes, pantalla, sugerencias])

  const preguntar = useCallback(
    async (texto: string) => {
      const limpio = texto.trim().slice(0, 500)
      if (!limpio || enCurso.current) return
      enCurso.current = true
      setError(null)
      const historial: MensajeAsistente[] = [...mensajes, { rol: 'usuario', texto: limpio }]
      setMensajes(historial)
      setSugerencias([])
      setPensando(true)
      try {
        const r = await apiFetch<RespuestaAsistente>('/api/v1/publico/asistente', {
          method: 'POST',
          auth: false,
          // el saludo es local: no hace falta mandarlo
          body: { mensajes: historial.slice(1).slice(-14) },
        })
        setMensajes((m) => [...m, { rol: 'asistente', texto: r.respuesta }])
        if (r.pantalla) setPantalla(r.pantalla)
        setSugerencias(r.sugerencias.length ? r.sugerencias : SUGERENCIAS_INICIALES)
      } catch (err) {
        const limite = err instanceof ApiRequestError && err.status === 429
        setError(limite ? 'Conversamos bastante en poco tiempo. Vuelva a escribirme en unos minutos.' : 'No pude responder en este momento. Revise su conexión e intente de nuevo.')
        setSugerencias([limpio])
      } finally {
        setPensando(false)
        enCurso.current = false
      }
    },
    [mensajes],
  )

  const reiniciar = useCallback(() => {
    setMensajes([{ rol: 'asistente', texto: SALUDO }])
    setPantalla('hoja-del-dia')
    setSugerencias(SUGERENCIAS_INICIALES)
    setError(null)
  }, [])

  return { mensajes, pantalla, sugerencias, pensando, error, preguntar, reiniciar, setPantalla }
}

export type Asistente = ReturnType<typeof useAsistente>

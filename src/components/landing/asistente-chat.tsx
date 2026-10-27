import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { Asistente } from '@/lib/asistente'
import { cn } from '@/lib/utils'
import { ArrowUp, RotateCcw } from 'lucide-react'

/** Parrafos y listas de guiones, sin interpretar HTML. */
function Texto({ texto }: { texto: string }) {
  const bloques: React.ReactNode[] = []
  let lista: string[] = []
  const cerrarLista = () => {
    if (lista.length) {
      bloques.push(
        <ul key={`l${bloques.length}`} className="flex flex-col gap-1 pl-1">
          {lista.map((item, i) => (
            <li key={i} className="flex gap-2">
              <span aria-hidden="true" className="mt-[0.6em] size-1 shrink-0 rounded-full bg-current opacity-50" />
              <span>{item}</span>
            </li>
          ))}
        </ul>,
      )
      lista = []
    }
  }
  texto.split('\n').forEach((linea) => {
    const l = linea.trim()
    if (!l) return
    if (/^[-•*]\s+/.test(l)) {
      lista.push(l.replace(/^[-•*]\s+/, '').replace(/\*\*/g, ''))
    } else {
      cerrarLista()
      bloques.push(<p key={`p${bloques.length}`}>{l.replace(/\*\*/g, '')}</p>)
    }
  })
  cerrarLista()
  return <div className="flex flex-col gap-2">{bloques}</div>
}

/** Hace aparecer la ultima respuesta a ritmo de lectura (instantaneo si se pidio menos movimiento). */
function useTextoRevelado(texto: string, activo: boolean) {
  const [n, setN] = useState(activo ? 0 : texto.length)
  useEffect(() => {
    if (!activo || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setN(texto.length)
      return
    }
    setN(0)
    const paso = Math.max(2, Math.ceil(texto.length / 90))
    const t = setInterval(() => setN((v) => (v + paso >= texto.length ? (clearInterval(t), texto.length) : v + paso)), 16)
    return () => clearInterval(t)
  }, [texto, activo])
  return texto.slice(0, n)
}

function Burbuja({ rol, texto, revelar }: { rol: 'usuario' | 'asistente'; texto: string; revelar: boolean }) {
  const visible = useTextoRevelado(texto, revelar)
  return rol === 'usuario' ? (
    <div className="gl-burbuja-usuario self-end">{texto}</div>
  ) : (
    <div className="gl-burbuja-asistente self-start">
      <Texto texto={visible} />
    </div>
  )
}

interface Props {
  asistente: Asistente
  /** compacto: el panel flotante; amplio: la portada */
  variante?: 'portada' | 'flotante'
  autoFoco?: boolean
}

/** La conversacion con el asistente: mensajes, sugerencias como pestañas de archivo y campo de pregunta. */
export function AsistenteChat({ asistente, variante = 'portada', autoFoco }: Props) {
  const { mensajes, sugerencias, pensando, error, preguntar, reiniciar } = asistente
  const [texto, setTexto] = useState('')
  const registro = useRef<HTMLDivElement>(null)
  const ultimoVisto = useRef(mensajes.length)
  const campo = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const el = registro.current
    if (!el) return
    if (mensajes.length === 1 && !pensando) {
      el.scrollTo({ top: 0 })
      return
    }
    // una respuesta nueva se lee desde su primera linea, no desde el final
    const ultima = mensajes[mensajes.length - 1]
    const burbujas = el.querySelectorAll<HTMLElement>('.gl-burbuja-asistente, .gl-burbuja-usuario')
    const objetivo = !pensando && ultima?.rol === 'asistente' ? burbujas[mensajes.length - 1] : null
    el.scrollTo({ top: objetivo ? objetivo.offsetTop - 12 : el.scrollHeight, behavior: ultimoVisto.current === mensajes.length ? 'auto' : 'smooth' })
  }, [mensajes, pensando])

  useEffect(() => {
    if (autoFoco) campo.current?.focus()
  }, [autoFoco])

  // solo se "escribe" la respuesta que acaba de llegar, no el historial
  const nuevoDesde = ultimoVisto.current
  useEffect(() => {
    ultimoVisto.current = mensajes.length
  }, [mensajes.length])

  function enviar(e: FormEvent) {
    e.preventDefault()
    preguntar(texto)
    setTexto('')
  }

  return (
    <section className={cn('gl-chat', variante === 'flotante' && 'gl-chat-flotante')} aria-label="Asistente de GoRam Clinic">
      <header className="gl-chat-cabecera">
        <span className="gl-avatar" aria-hidden="true">
          <img src="/iconos/icono-192.png" alt="" width={32} height={32} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-[var(--gl-tinta)]">Asistente GoRam</p>
          <p className="flex items-center gap-1.5 text-[12px] text-[var(--gl-texto2)]">
            <span className="gl-en-linea" aria-hidden="true" />
            En línea las 24 horas
          </p>
        </div>
        {mensajes.length > 1 && (
          <button type="button" onClick={reiniciar} className="gl-icono-boton" aria-label="Empezar de nuevo" title="Empezar de nuevo">
            <RotateCcw className="size-4" />
          </button>
        )}
      </header>

      <div ref={registro} className="gl-chat-registro" role="log" aria-live="polite" aria-busy={pensando}>
        {mensajes.map((m, i) => (
          <Burbuja key={i} rol={m.rol} texto={m.texto} revelar={i >= nuevoDesde && m.rol === 'asistente'} />
        ))}
        {pensando && (
          <div className="gl-burbuja-asistente gl-escribiendo self-start" aria-label="El asistente está escribiendo">
            <i />
            <i />
            <i />
          </div>
        )}
        {error && <p className="gl-chat-error">{error}</p>}
      </div>

      {sugerencias.length > 0 && !pensando && (
        <div className="gl-sugerencias" aria-label="Preguntas sugeridas">
          {sugerencias.map((s) => (
            <button key={s} type="button" className="gl-sugerencia" onClick={() => preguntar(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={enviar} className="gl-chat-campo">
        <input
          ref={campo}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          maxLength={500}
          placeholder="Escriba su pregunta…"
          aria-label="Su pregunta para el asistente"
          enterKeyHint="send"
        />
        <button type="submit" disabled={!texto.trim() || pensando} aria-label="Enviar pregunta" className="gl-enviar">
          <ArrowUp className="size-4" />
        </button>
      </form>
    </section>
  )
}

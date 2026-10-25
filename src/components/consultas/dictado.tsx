import { useEffect, useRef, useState, type ComponentProps } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Mic, Square } from 'lucide-react'

// Web Speech API (Chrome, Edge, Safari). No tiene tipos en lib.dom.
interface Reconocimiento {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
}

function crearReconocimiento(): Reconocimiento | null {
  const w = window as unknown as { SpeechRecognition?: new () => Reconocimiento; webkitSpeechRecognition?: new () => Reconocimiento }
  const Clase = w.SpeechRecognition ?? w.webkitSpeechRecognition
  return Clase ? new Clase() : null
}

export const dictadoDisponible = () => typeof window !== 'undefined' && crearReconocimiento() !== null

// "punto" / "coma" / "nueva linea" dichos en voz alta se vuelven signos.
function puntuar(texto: string) {
  return texto
    .replace(/\s*\b(punto y aparte|nueva l[ií]nea|nuevo p[aá]rrafo)\b\s*/gi, '.\n')
    .replace(/\s*\bpunto y seguido\b\s*/gi, '. ')
    .replace(/\s*\bpunto\b\s*/gi, '. ')
    .replace(/\s*\bcoma\b\s*/gi, ', ')
    .replace(/\s*\bdos puntos\b\s*/gi, ': ')
    .replace(/(^|[.\n]\s*)([a-záéíóúñ])/g, (_, a, b) => a + b.toUpperCase())
    .trim()
}

function unir(actual: string, nuevo: string) {
  if (!actual.trim()) return nuevo.charAt(0).toUpperCase() + nuevo.slice(1)
  const termina = /[.\n:]\s*$/.test(actual)
  const texto = termina ? nuevo.charAt(0).toUpperCase() + nuevo.slice(1) : nuevo
  return actual.replace(/\s+$/, '') + (actual.endsWith('\n') ? '' : ' ') + texto
}

/** Area de texto con boton de dictado: el medico habla y el texto aparece. */
export function TextareaDictable({ value, onValueChange, className, ...props }: Omit<ComponentProps<typeof Textarea>, 'onChange' | 'value'> & { value: string; onValueChange: (v: string) => void }) {
  const [escuchando, setEscuchando] = useState(false)
  const [parcial, setParcial] = useState('')
  const rec = useRef<Reconocimiento | null>(null)
  const valorRef = useRef(value)
  valorRef.current = value
  const disponible = dictadoDisponible()

  useEffect(() => () => rec.current?.stop(), [])

  function alternar() {
    if (escuchando) {
      rec.current?.stop()
      return
    }
    const r = crearReconocimiento()
    if (!r) return
    r.lang = 'es-SV'
    r.continuous = true
    r.interimResults = true
    r.onresult = (e) => {
      let finales = ''
      let provisional = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) finales += t
        else provisional += t
      }
      if (finales.trim()) onValueChange(unir(valorRef.current, puntuar(finales)))
      setParcial(provisional)
    }
    r.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') toast.error('Permití el uso del micrófono para dictar')
      else if (e.error !== 'no-speech' && e.error !== 'aborted') toast.error('El dictado se detuvo; tocá el micrófono para seguir')
    }
    r.onend = () => {
      setEscuchando(false)
      setParcial('')
    }
    rec.current = r
    r.start()
    setEscuchando(true)
  }

  return (
    <div className="relative">
      <Textarea {...props} value={value} onChange={(e) => onValueChange(e.target.value)} className={cn(disponible && 'pr-12', escuchando && 'ring-2 ring-destructive/40', className)} />
      {escuchando && parcial && (
        <p className="pointer-events-none absolute inset-x-3 bottom-2 truncate pr-10 text-sm text-muted-foreground italic">{parcial}…</p>
      )}
      {disponible && (
        <button
          type="button"
          onClick={alternar}
          aria-pressed={escuchando}
          aria-label={escuchando ? 'Terminar dictado' : 'Dictar con la voz'}
          title={escuchando ? 'Terminar dictado' : 'Dictar con la voz (decí "punto", "coma" o "nueva línea")'}
          className={cn(
            'absolute top-2 right-2 flex size-8 items-center justify-center rounded-full transition-colors',
            escuchando ? 'animate-pulse bg-destructive text-white' : 'text-muted-foreground hover:bg-muted hover:text-primary',
          )}
        >
          {escuchando ? <Square className="size-3.5 fill-current" /> : <Mic className="size-4" />}
        </button>
      )}
    </div>
  )
}

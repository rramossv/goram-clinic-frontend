import { useEffect, useRef, useState } from 'react'
import { firmaFinal } from '@/lib/imagen'
import { Button } from '@/components/ui/button'
import { Eraser } from 'lucide-react'

/** Lienzo para firmar con el mouse, el dedo o un lapiz digital. */
export function FirmaPad({ onListo, onCancelar }: { onListo: (dataUrl: string) => void; onCancelar: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dibujando = useRef(false)
  const ultimo = useRef<{ x: number; y: number } | null>(null)
  const [vacio, setVacio] = useState(true)

  useEffect(() => {
    const canvas = canvasRef.current!
    const escala = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * escala
    canvas.height = rect.height * escala
    const ctx = canvas.getContext('2d')!
    ctx.scale(escala, escala)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#16263d'
  }, [])

  function punto(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function mover(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!dibujando.current || !ultimo.current) return
    const ctx = e.currentTarget.getContext('2d')!
    const p = punto(e)
    // el trazo se engrosa con la presion del lapiz cuando el dispositivo la reporta
    ctx.lineWidth = e.pointerType === 'pen' ? 1.2 + e.pressure * 2.4 : 2.2
    ctx.beginPath()
    ctx.moveTo(ultimo.current.x, ultimo.current.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    ultimo.current = p
    setVacio(false)
  }

  function limpiar() {
    const canvas = canvasRef.current!
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height)
    setVacio(true)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative rounded-lg border bg-white">
        <canvas
          ref={canvasRef}
          className="block h-44 w-full cursor-crosshair touch-none"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            dibujando.current = true
            ultimo.current = punto(e)
          }}
          onPointerMove={mover}
          onPointerUp={() => {
            dibujando.current = false
            ultimo.current = null
          }}
          onPointerLeave={() => {
            dibujando.current = false
            ultimo.current = null
          }}
        />
        <div className="pointer-events-none absolute inset-x-8 bottom-10 border-b border-dashed border-slate-300" />
        {vacio && <p className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-sm text-slate-400">Firmá aquí</p>}
      </div>
      <div className="flex flex-wrap justify-between gap-2">
        <Button type="button" variant="ghost" onClick={limpiar} disabled={vacio}>
          <Eraser />
          Borrar
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={onCancelar}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={vacio}
            onClick={() => {
              const url = firmaFinal(canvasRef.current!)
              if (url) onListo(url)
            }}
          >
            Usar esta firma
          </Button>
        </div>
      </div>
    </div>
  )
}

import { useCallback, useEffect, useState, type RefObject } from 'react'

// Detecta si un contenedor con overflow-x tiene mas contenido hacia la
// izquierda/derecha del que se ve ahora mismo -- para mostrar un degradado
// que le avise al usuario que puede deslizar (celular, sobre todo) en vez
// de que el contenido simplemente se corte sin ningun aviso.
export function useScrollShadows(
  containerRef: RefObject<HTMLElement | null>,
  contentRef: RefObject<HTMLElement | null>,
) {
  const [puedeScrollIzq, setPuedeScrollIzq] = useState(false)
  const [puedeScrollDer, setPuedeScrollDer] = useState(false)

  const actualizar = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    setPuedeScrollIzq(el.scrollLeft > 1)
    setPuedeScrollDer(el.scrollLeft < el.scrollWidth - el.clientWidth - 1)
  }, [containerRef])

  useEffect(() => {
    actualizar()
    const container = containerRef.current
    const content = contentRef.current
    if (!container || !content) return
    const resizeObserver = new ResizeObserver(actualizar)
    resizeObserver.observe(container)
    resizeObserver.observe(content)
    return () => resizeObserver.disconnect()
  }, [actualizar, containerRef, contentRef])

  return { puedeScrollIzq, puedeScrollDer, alHacerScroll: actualizar }
}

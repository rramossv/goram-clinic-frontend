// Logos y firmas se guardan como data URL: se reducen en el navegador antes
// de subirlas para que pesen decenas de KB, no megas.

function cargar(archivo: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(archivo)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('No se pudo leer la imagen'))
    }
    img.src = url
  })
}

/** Recorta los bordes transparentes (o casi blancos) para que la firma no flote en un lienzo vacio. */
function recortar(canvas: HTMLCanvasElement, margen = 6) {
  const ctx = canvas.getContext('2d')!
  const { width, height } = canvas
  const datos = ctx.getImageData(0, 0, width, height).data
  let minX = width, minY = height, maxX = -1, maxY = -1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (datos[(y * width + x) * 4 + 3] > 16) {
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
      }
    }
  }
  if (maxX < 0) return null
  minX = Math.max(0, minX - margen)
  minY = Math.max(0, minY - margen)
  maxX = Math.min(width - 1, maxX + margen)
  maxY = Math.min(height - 1, maxY + margen)
  const salida = document.createElement('canvas')
  salida.width = maxX - minX + 1
  salida.height = maxY - minY + 1
  salida.getContext('2d')!.drawImage(canvas, minX, minY, salida.width, salida.height, 0, 0, salida.width, salida.height)
  return salida
}

function escalar(origen: CanvasImageSource, ancho: number, alto: number, maxAncho: number, maxAlto: number) {
  const factor = Math.min(1, maxAncho / ancho, maxAlto / alto)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(ancho * factor)
  canvas.height = Math.round(alto * factor)
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(origen, 0, 0, canvas.width, canvas.height)
  return canvas
}

export async function prepararLogo(archivo: File) {
  if (!archivo.type.startsWith('image/')) throw new Error('El archivo debe ser una imagen PNG o JPG')
  const img = await cargar(archivo)
  return escalar(img, img.naturalWidth, img.naturalHeight, 600, 300).toDataURL('image/png')
}

/**
 * Firma escaneada o fotografiada sobre papel blanco: el blanco se vuelve
 * transparente para que la firma se apoye sobre la linea sin un recuadro.
 */
export async function prepararFirmaDesdeArchivo(archivo: File) {
  if (!archivo.type.startsWith('image/')) throw new Error('El archivo debe ser una imagen PNG o JPG')
  const img = await cargar(archivo)
  const canvas = escalar(img, img.naturalWidth, img.naturalHeight, 900, 400)
  const ctx = canvas.getContext('2d')!
  const imagen = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const d = imagen.data
  for (let i = 0; i < d.length; i += 4) {
    const luz = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
    if (luz > 200) d[i + 3] = 0
    else if (luz > 150) d[i + 3] = Math.round(d[i + 3] * ((200 - luz) / 50))
  }
  ctx.putImageData(imagen, 0, 0)
  return firmaFinal(canvas)
}

export function firmaFinal(canvas: HTMLCanvasElement) {
  const recortada = recortar(canvas)
  if (!recortada) return null
  return escalar(recortada, recortada.width, recortada.height, 600, 200).toDataURL('image/png')
}

const MAX_SIDE = 1200
const MAX_INPUT_BYTES = 15 * 1024 * 1024
const MAX_OUTPUT_BYTES = 2 * 1024 * 1024 - 64 * 1024 // margem sobre o limite da API
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']

export class ImageError extends Error {}

function supportsWebp() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1
  return canvas.toDataURL('image/webp').startsWith('data:image/webp')
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, type, quality),
  )
}

// Reduz para no máximo 1200 px no maior lado, corrige a rotação da foto
// e gera WebP (ou JPEG, se o navegador não suportar). O redesenho descarta
// os metadados do arquivo original.
export async function compressImage(file: File): Promise<File> {
  if (!ACCEPTED.includes(file.type)) {
    throw new ImageError('Use uma imagem JPEG, PNG ou WebP')
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new ImageError('A imagem original é grande demais (máximo de 15 MB)')
  }

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    throw new ImageError('Não foi possível ler a imagem')
  }

  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) {
    bitmap.close()
    throw new ImageError('Seu navegador não conseguiu processar a imagem')
  }

  const webp = supportsWebp()
  const type = webp ? 'image/webp' : 'image/jpeg'

  // JPEG não tem transparência: fundo branco no lugar do preto
  if (!webp) {
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, width, height)
  }
  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  for (const quality of [0.85, 0.75, 0.6]) {
    const blob = await toBlob(canvas, type, quality)
    if (blob && blob.size <= MAX_OUTPUT_BYTES) {
      return new File([blob], webp ? 'imagem.webp' : 'imagem.jpg', { type })
    }
  }

  throw new ImageError('Não foi possível reduzir a imagem para menos de 2 MB')
}
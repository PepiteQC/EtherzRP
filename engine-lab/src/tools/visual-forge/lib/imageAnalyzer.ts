import type { ImageAnalysis } from '../types'

const SAMPLE_SIZE = 32

function toHex(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)))
    .toString(16)
    .padStart(2, '0')
}

export async function analyzeImageFile(file: File): Promise<ImageAnalysis> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Le fichier sélectionné n’est pas une image.')
  }

  const bitmap = await createImageBitmap(file)
  const originalWidth = bitmap.width
  const originalHeight = bitmap.height

  const canvas = document.createElement('canvas')
  canvas.width = SAMPLE_SIZE
  canvas.height = SAMPLE_SIZE

  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) {
    bitmap.close()
    throw new Error('Canvas 2D indisponible.')
  }

  context.drawImage(bitmap, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE)
  const { data } = context.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE)

  const gray: number[] = []
  let red = 0
  let green = 0
  let blue = 0
  let totalBrightness = 0

  for (let index = 0; index < data.length; index += 4) {
    const r = data[index]
    const g = data[index + 1]
    const b = data[index + 2]
    const brightness = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 255

    red += r
    green += g
    blue += b
    totalBrightness += brightness
    gray.push(brightness)
  }

  bitmap.close()

  const count = gray.length
  const brightness = totalBrightness / count
  const variance =
    gray.reduce((sum, value) => sum + (value - brightness) ** 2, 0) / count

  let edgeTotal = 0
  let edgeCount = 0

  for (let y = 0; y < SAMPLE_SIZE; y += 1) {
    for (let x = 0; x < SAMPLE_SIZE; x += 1) {
      const index = y * SAMPLE_SIZE + x
      if (x < SAMPLE_SIZE - 1) {
        edgeTotal += Math.abs(gray[index] - gray[index + 1])
        edgeCount += 1
      }
      if (y < SAMPLE_SIZE - 1) {
        edgeTotal += Math.abs(gray[index] - gray[index + SAMPLE_SIZE])
        edgeCount += 1
      }
    }
  }

  const inverted = gray.map((value) => 1 - value)
  const min = Math.min(...inverted)
  const max = Math.max(...inverted)
  const range = max - min || 1
  const normalized = inverted.map((value) => (value - min) / range)

  return {
    width: originalWidth,
    height: originalHeight,
    aspectRatio: originalWidth / Math.max(1, originalHeight),
    averageColor:
      `#${toHex(red / count)}${toHex(green / count)}${toHex(blue / count)}`,
    brightness,
    contrast: Math.sqrt(variance),
    edgeDensity: edgeCount ? edgeTotal / edgeCount : 0,
    heightField: {
      width: SAMPLE_SIZE,
      height: SAMPLE_SIZE,
      samples: normalized,
    },
  }
}

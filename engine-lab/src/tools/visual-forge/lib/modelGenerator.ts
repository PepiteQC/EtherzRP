import type { GeneratedModel, HeightField } from '../types'

export function smoothHeightField(field: HeightField): HeightField {
  const result = [...field.samples]

  for (let y = 1; y < field.height - 1; y += 1) {
    for (let x = 1; x < field.width - 1; x += 1) {
      const index = y * field.width + x
      const average =
        (
          field.samples[index] +
          field.samples[index - 1] +
          field.samples[index + 1] +
          field.samples[index - field.width] +
          field.samples[index + field.width]
        ) / 5

      result[index] = field.samples[index] * 0.55 + average * 0.45
    }
  }

  return { ...field, samples: result }
}

export function createGeneratedModel(
  fileName: string,
  aspectRatio: number,
  heightField: HeightField
): GeneratedModel {
  const width = Math.max(2, Math.min(8, 4 * aspectRatio))
  const height = Math.max(2, Math.min(8, 4 / Math.max(aspectRatio, 0.01)))

  return {
    id: `visual-forge-${Date.now()}`,
    name: fileName.replace(/\.[^/.]+$/, '') || 'visual-forge-model',
    sourceFileName: fileName,
    createdAt: Date.now(),
    width,
    height,
    depth: 1.4,
    vertices: heightField.width * heightField.height,
    triangles: (heightField.width - 1) * (heightField.height - 1) * 2,
    heightField,
  }
}

export function modelToObj(model: GeneratedModel): string {
  const lines: string[] = [
    '# EtherWorld Engine-Lab Visual Forge',
    `o ${model.name.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
  ]

  const field = model.heightField

  for (let y = 0; y < field.height; y += 1) {
    for (let x = 0; x < field.width; x += 1) {
      const u = x / Math.max(1, field.width - 1)
      const v = y / Math.max(1, field.height - 1)
      const sample = field.samples[y * field.width + x] ?? 0

      const px = (u - 0.5) * model.width
      const py = (0.5 - v) * model.height
      const pz = sample * model.depth

      lines.push(`v ${px.toFixed(6)} ${py.toFixed(6)} ${pz.toFixed(6)}`)
      lines.push(`vt ${u.toFixed(6)} ${(1 - v).toFixed(6)}`)
    }
  }

  for (let y = 0; y < field.height - 1; y += 1) {
    for (let x = 0; x < field.width - 1; x += 1) {
      const a = y * field.width + x + 1
      const b = a + 1
      const c = a + field.width
      const d = c + 1

      lines.push(`f ${a}/${a} ${c}/${c} ${b}/${b}`)
      lines.push(`f ${b}/${b} ${c}/${c} ${d}/${d}`)
    }
  }

  return lines.join('\n')
}

export function downloadObj(model: GeneratedModel) {
  const blob = new Blob([modelToObj(model)], {
    type: 'text/plain;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${model.name}.obj`
  link.click()
  URL.revokeObjectURL(url)
}

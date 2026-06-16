import { useRef, useState } from 'react'
import { ImagePlus, Upload } from 'lucide-react'
import { useVisualForgeStore } from '../VisualForgeStore'

export function SourceDropZone() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const sourceFile = useVisualForgeStore((state) => state.sourceFile)
  const sourceUrl = useVisualForgeStore((state) => state.sourceUrl)
  const importFile = useVisualForgeStore((state) => state.importFile)

  const acceptFile = (file?: File) => {
    if (file) importFile(file)
  }

  return (
    <section
      className={`vf-drop-zone ${dragging ? 'is-dragging' : ''}`}
      onDragEnter={(event) => {
        event.preventDefault()
        setDragging(true)
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => {
        event.preventDefault()
        setDragging(false)
      }}
      onDrop={(event) => {
        event.preventDefault()
        setDragging(false)
        acceptFile(event.dataTransfer.files[0])
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        onChange={(event) => acceptFile(event.target.files?.[0])}
      />

      {sourceUrl ? (
        <img src={sourceUrl} alt={sourceFile?.name ?? 'Source Visual Forge'} />
      ) : (
        <div className="vf-drop-zone__empty">
          <ImagePlus size={34} />
          <strong>Dépose une image</strong>
          <span>PNG, JPG ou WEBP</span>
        </div>
      )}

      <button type="button" onClick={() => inputRef.current?.click()}>
        <Upload size={16} />
        {sourceFile ? 'Changer l’image' : 'Choisir une image'}
      </button>

      {sourceFile && (
        <small>
          {sourceFile.name} · {(sourceFile.size / 1024 / 1024).toFixed(2)} Mo
        </small>
      )}
    </section>
  )
}

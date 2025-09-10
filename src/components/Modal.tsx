import { useEffect, useRef } from 'react'

interface ModalProps {
  isOpen: boolean
  title: string
  body: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
  analyticsEventName?: string
}

export default function Modal({
  isOpen,
  title,
  body,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  analyticsEventName
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const confirmButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) return

    // Focus trap and escape handling
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel()
      } else if (e.key === 'Enter') {
        onConfirm()
      }
    }

    // Focus the confirm button when modal opens
    confirmButtonRef.current?.focus()

    document.addEventListener('keydown', handleKeydown)
    return () => document.removeEventListener('keydown', handleKeydown)
  }, [isOpen, onConfirm, onCancel])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      ref={modalRef}
    >
      <div 
        className="bg-black/95 border-3 border-purple-500 rounded-lg p-6 max-w-lg w-full mx-4"
        style={{ fontFamily: '"Times New Roman", serif' }}
      >
        <h2 
          id="modal-title"
          className="text-2xl text-purple-400 mb-4 text-center font-bold"
          style={{ fontFamily: '"Times New Roman", serif' }}
        >
          {title}
        </h2>
        
        <div 
          className="text-white text-sm leading-relaxed mb-6 text-center px-2"
          style={{ 
            fontFamily: '"Times New Roman", serif',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            hyphens: 'auto',
            maxWidth: '100%'
          }}
        >
          {body}
        </div>
        
        <div className="flex gap-4 justify-center">
          <button
            ref={confirmButtonRef}
            onClick={onConfirm}
            className="bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded text-sm transition-colors font-bold"
            style={{ fontFamily: '"Times New Roman", serif' }}
            aria-label={confirmLabel}
          >
            {confirmLabel}
          </button>
          
          <button
            onClick={onCancel}
            className="bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded text-sm transition-colors font-bold"
            style={{ fontFamily: '"Times New Roman", serif' }}
            aria-label={cancelLabel}
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
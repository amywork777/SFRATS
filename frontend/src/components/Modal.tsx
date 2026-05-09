import { useEffect } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-ink/50 z-[10000] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-paper-light border border-ink shadow-stamp max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-5 pb-3 border-b border-ink">
            <h2 className="font-display font-black text-3xl text-ink leading-tight">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 text-ink-mute hover:text-ink hover:bg-paper-dark transition-colors"
              aria-label="Close"
            >
              <X size={18} strokeWidth={2.2} />
            </button>
          </div>
          <div className="prose max-w-none">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Modal

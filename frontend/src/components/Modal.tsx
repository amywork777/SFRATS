interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-ink/50 z-[10000] flex items-center justify-center p-4">
      <div className="bg-paper-light border-2 border-ink shadow-stamp max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-5 pb-3 rule-thick">
            <h2 className="font-display font-black text-3xl text-ink leading-tight">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="font-mono text-[18px] text-ink-mute hover:text-ink hover:bg-paper-dark px-2 transition-colors"
              aria-label="Close"
            >
              ✕
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

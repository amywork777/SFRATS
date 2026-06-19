import { useEffect, useRef, useState, ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

// Shared dropdown shell for the filter bar: a chip-styled trigger + a popover
// panel that closes on outside-click / Escape. Styled to match the DatePicker
// chips and calendar popover so every control in the bar reads as one set.
export default function FilterDropdown({
  label,
  active = false,
  panelClassName = 'w-[220px]',
  onOpenChange,
  children,
}: {
  label: ReactNode
  active?: boolean
  panelClassName?: string
  onOpenChange?: (open: boolean) => void
  children: ReactNode | ((close: () => void) => ReactNode)
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Notify on open/close via a ref so an inline callback can't churn the effect.
  const onOpenChangeRef = useRef(onOpenChange)
  onOpenChangeRef.current = onOpenChange
  useEffect(() => { onOpenChangeRef.current?.(open) }, [open])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 md:py-1.5 border border-ink font-mono text-[11px] uppercase tracking-[0.14em] font-semibold transition-colors whitespace-nowrap ${
          active
            ? 'bg-bridge-500 text-paper-light shadow-stamp'
            : 'bg-paper-light text-ink-mute hover:text-ink hover:bg-paper'
        }`}
      >
        {label}
        <ChevronDown
          size={13}
          strokeWidth={2.2}
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className={`absolute top-full left-0 mt-2 z-[1500] max-w-[calc(100vw-2rem)] bg-paper-light border border-ink shadow-stamp ${panelClassName}`}>
          {typeof children === 'function' ? children(() => setOpen(false)) : children}
        </div>
      )}
    </div>
  )
}

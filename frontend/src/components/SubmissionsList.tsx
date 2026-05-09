import { useEffect, useState } from 'react'
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { DbItem } from '../types/supabase'
import { api } from '../services/api'
import { format } from 'date-fns'
import { Link } from 'react-router-dom'
import { categoryEmojis } from '../utils/categoryConstants'

export default function SubmissionsList() {
  const [isOpen, setIsOpen] = useState(false)
  const [items, setItems] = useState<DbItem[]>([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!isOpen || loaded) return
    setLoading(true)
    api.getItems()
      .then((data) => {
        // Hide scraper-meta diagnostic rows from the public list
        const visible = data.filter(r => r.posted_by !== 'scraper-meta')
        setItems(visible.slice(0, 6))
      })
      .catch((err) => console.error('Error fetching items:', err))
      .finally(() => {
        setLoading(false)
        setLoaded(true)
      })
  }, [isOpen, loaded])

  return (
    <div className="fixed bottom-5 right-5 w-[320px] z-[1000] pointer-events-none">
      <div className="pointer-events-auto bg-paper-light border-2 border-ink shadow-stamp">
        {/* Header — toggleable. Looks like a punched card. */}
        <button
          onClick={() => setIsOpen(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-paper transition-colors text-left"
        >
          <div className="flex items-center gap-2.5">
            <span className="inline-block w-2 h-2 bg-bridge-500 animate-pulse" aria-hidden />
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] font-semibold text-ink">
              Just&nbsp;Posted
            </span>
            {items.length > 0 && (
              <span className="font-mono text-[10px] text-ink-fade">
                · {items.length}
              </span>
            )}
          </div>
          {isOpen ? (
            <ChevronDownIcon className="h-4 w-4 text-ink-mute" />
          ) : (
            <ChevronUpIcon className="h-4 w-4 text-ink-mute" />
          )}
        </button>

        {isOpen && (
          <div className="max-h-[60vh] overflow-y-auto border-t-2 border-ink">
            {loading ? (
              <div className="p-4 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-mute">Loading…</div>
            ) : items.length === 0 ? (
              <div className="p-4 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-mute">No listings yet.</div>
            ) : (
              <ul>
                {items.map((item, i) => (
                  <li key={item.id} className={i > 0 ? 'border-t border-ink/15' : ''}>
                    <Link
                      to={`/listing/${item.id}`}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-paper transition-colors"
                    >
                      <span
                        className="mt-0.5 inline-flex w-9 h-9 items-center justify-center bg-bridge-500 border-2 border-ink text-paper-light text-base shrink-0"
                        aria-hidden
                      >
                        {categoryEmojis[item.category as keyof typeof categoryEmojis] ?? '📍'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-display font-bold text-[15px] leading-tight text-ink truncate">
                          {item.title}
                        </h3>
                        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-fade mt-1">
                          {format(new Date(item.created_at), 'MMM d · h:mm a')} · {item.category}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

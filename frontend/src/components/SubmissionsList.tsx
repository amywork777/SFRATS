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
      .then((data) => setItems(data.slice(0, 6)))
      .catch((err) => console.error('Error fetching items:', err))
      .finally(() => {
        setLoading(false)
        setLoaded(true)
      })
  }, [isOpen, loaded])

  return (
    <div className="fixed bottom-4 right-4 w-[320px] z-[1000] pointer-events-none">
      <div className="pointer-events-auto rounded-xl border border-stone-200 bg-white/95 backdrop-blur shadow-ring overflow-hidden">
        <button
          onClick={() => setIsOpen(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-stone-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-rust-500 animate-pulse" />
            <span className="text-sm font-semibold text-stone-900">Recent submissions</span>
          </div>
          {isOpen ? (
            <ChevronDownIcon className="h-4 w-4 text-stone-500" />
          ) : (
            <ChevronUpIcon className="h-4 w-4 text-stone-500" />
          )}
        </button>

        {isOpen && (
          <div className="max-h-[60vh] overflow-y-auto border-t border-stone-200">
            {loading ? (
              <div className="p-4 text-sm text-stone-500">Loading…</div>
            ) : items.length === 0 ? (
              <div className="p-4 text-sm text-stone-500">No listings yet.</div>
            ) : (
              <ul className="divide-y divide-stone-100">
                {items.map(item => (
                  <li key={item.id}>
                    <Link
                      to={`/listing/${item.id}`}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-stone-50 transition-colors"
                    >
                      <span className="mt-0.5 inline-flex w-8 h-8 items-center justify-center rounded-lg bg-stone-100 text-base shrink-0">
                        {categoryEmojis[item.category as keyof typeof categoryEmojis] ?? '📍'}
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-stone-900 truncate">{item.title}</h3>
                        <p className="text-xs text-stone-500">
                          {format(new Date(item.created_at), 'MMM d · h:mm a')}
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

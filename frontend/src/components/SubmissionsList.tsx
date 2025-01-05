import { useState } from 'react'
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { DbItem } from '../types/supabase'
import { api } from '../services/api'
import { format } from 'date-fns'
import { Link } from 'react-router-dom'

export default function SubmissionsList() {
  const [isOpen, setIsOpen] = useState(false)
  const [items, setItems] = useState<DbItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchItems = async () => {
    try {
      const data = await api.getItems()
      setItems(data.slice(0, 5))
    } catch (err) {
      console.error('Error fetching items:', err)
    } finally {
      setLoading(false)
    }
  }

  const togglePanel = () => {
    if (!isOpen) {
      fetchItems()
    }
    setIsOpen(!isOpen)
  }

  return (
    <div className="fixed bottom-0 left-0 md:left-auto right-0 w-full md:w-80">
      {/* Panel Content - Position above the button when open */}
      {isOpen && (
        <div className="bg-white border-t md:border-l shadow-lg max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="p-4">Loading...</div>
          ) : (
            <div className="divide-y">
              {items.map(item => (
                <Link
                  key={item.id}
                  to={`/listing/${item.id}`}
                  className="block p-4 hover:bg-gray-50"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">
                      {item.category === 'Food' ? '🍕' :
                       item.category === 'Events' ? '🎉' :
                       item.category === 'Services' ? '🔧' : '📦'}
                    </span>
                    <div>
                      <h3 className="font-medium">{item.title}</h3>
                      <p className="text-sm text-gray-500">
                        {format(new Date(item.created_at), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Toggle Button - Always at the bottom */}
      <button
        onClick={togglePanel}
        className="flex items-center justify-between w-full px-4 py-3 
                 bg-white border-t md:border-l shadow-lg hover:bg-gray-50 
                 transition-colors"
      >
        <span className="font-medium">Recent Submissions</span>
        {isOpen ? (
          <ChevronDownIcon className="h-5 w-5" />
        ) : (
          <ChevronUpIcon className="h-5 w-5" />
        )}
      </button>
    </div>
  )
} 
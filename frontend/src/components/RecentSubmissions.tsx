import { useState } from 'react'
import { ChevronUpIcon } from '@heroicons/react/24/outline'
import ListingPreview from './ListingPreview'
import { DbItem } from '../types/supabase'

interface RecentSubmissionsProps {
  items: DbItem[]
}

export default function RecentSubmissions({ items }: RecentSubmissionsProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Bottom Spacer - This pushes content up to avoid overlap with Recent Submissions */}
      <div className="h-16" /> {/* Adjust height as needed */}

      {/* Recent Submissions Panel */}
      <div 
        className={`
          fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg 
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-y-0' : 'translate-y-[calc(100%-2.5rem)]'}
        `}
      >
        {/* Header with toggle */}
        <div 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <h3 className="font-medium">Recent Submissions</h3>
          <ChevronUpIcon 
            className={`h-5 w-5 text-gray-500 transition-transform duration-300
              ${isOpen ? 'rotate-180' : 'rotate-0'}
            `}
          />
        </div>

        {/* Content */}
        <div 
          className={`
            overflow-x-auto whitespace-nowrap p-4
            transition-all duration-300 ease-in-out
            ${isOpen ? 'max-h-[300px]' : 'max-h-0'}
          `}
        >
          <div className="flex gap-4">
            {items.map(item => (
              <div key={item.id} className="w-[200px] shrink-0">
                <ListingPreview {...item} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
} 
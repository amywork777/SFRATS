import { useState } from 'react'
import { XMarkIcon, FunnelIcon } from '@heroicons/react/24/outline'
import Sidebar from './Sidebar'

interface MobileNavProps {
  onFiltersChange: (filters: any) => void
}

export default function MobileNav({ onFiltersChange }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile Filter Button - Moved higher up */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-[2000] md:hidden bg-blue-500 text-white p-3 rounded-full shadow-lg"
      >
        <FunnelIcon className="h-5 w-5" />
      </button>

      {/* Mobile Filters Drawer */}
      <div className={`
        fixed inset-0 z-[2000] md:hidden transform transition-transform duration-300
        ${isOpen ? 'translate-y-0' : 'translate-y-full'}
      `}>
        <div 
          className="absolute inset-0 bg-gray-500 bg-opacity-75" 
          onClick={() => setIsOpen(false)} 
        />
        <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-xl max-h-[90vh] overflow-y-auto">
          {/* Smaller header text */}
          <div className="sticky top-0 bg-white border-b p-3 flex justify-between items-center">
            <h2 className="text-base font-medium">Filters</h2>
            <button onClick={() => setIsOpen(false)}>
              <XMarkIcon className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          {/* Adjusted padding for mobile */}
          <div className="p-3">
            <Sidebar 
              onFiltersChange={(filters) => {
                onFiltersChange(filters)
                setIsOpen(false)
              }}
              isMobile={true}
            />
          </div>
        </div>
      </div>
    </>
  )
} 
import { useState } from 'react'
import DateFilter from './DateFilter'
import CategoryFilter from './CategoryFilter'
import SearchBar from './SearchBar'

interface SidebarProps {
  onFiltersChange: (filters: any) => void
}

function Sidebar({ onFiltersChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div 
      className={`
        fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white shadow-lg 
        transition-all duration-300 z-[1000]
        ${isCollapsed ? 'w-12' : 'w-80'}
      `}
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-1/2 transform -translate-y-1/2 
                   bg-white rounded-full p-1 shadow-md hover:bg-gray-50"
      >
        {isCollapsed ? (
          <span className="block">→</span>
        ) : (
          <span className="block">←</span>
        )}
      </button>

      <div className={`p-4 space-y-6 ${isCollapsed ? 'hidden' : ''}`}>
        <SearchBar 
          onSearch={(query) => onFiltersChange({ search: query })} 
        />
        
        <DateFilter 
          onChange={(dates) => onFiltersChange({ dates })}
        />
        
        <CategoryFilter 
          onChange={(categories) => onFiltersChange({ categories })}
        />
      </div>
    </div>
  )
}

export default Sidebar 
import { useState } from 'react'
import { categoryEmojis } from '../Legend'

interface CategoryFilterProps {
  onChange: (categories: string[]) => void
}

function CategoryFilter({ onChange }: CategoryFilterProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  const handleCategoryChange = (category: string, checked: boolean) => {
    const newCategories = checked 
      ? [...selectedCategories, category]
      : selectedCategories.filter(c => c !== category)
    
    setSelectedCategories(newCategories)
    onChange(newCategories)
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-700">Categories</h3>
      
      <div className="space-y-2">
        {Object.entries(categoryEmojis).map(([category, emoji]) => (
          <label key={category} className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={selectedCategories.includes(category)}
              onChange={(e) => handleCategoryChange(category, e.target.checked)}
              className="rounded border-gray-300 text-blue-600 
                       focus:ring-blue-500"
            />
            <span className="text-lg">{emoji}</span>
            <span className="text-gray-700">{category}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

export default CategoryFilter 
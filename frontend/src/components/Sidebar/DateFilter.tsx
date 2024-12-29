import { useState } from 'react'

interface DateFilterProps {
  onChange: (dates: { start: Date | null; end: Date | null }) => void
}

function DateFilter({ onChange }: DateFilterProps) {
  const [selectedRange, setSelectedRange] = useState<string>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const handleQuickFilter = (range: string) => {
    setSelectedRange(range)
    
    const now = new Date()
    let start = null
    let end = null

    switch (range) {
      case 'today':
        start = new Date(now.setHours(0, 0, 0, 0))
        end = new Date(now.setHours(23, 59, 59, 999))
        break
      case 'week':
        start = now
        const weekEnd = new Date(now)
        weekEnd.setDate(weekEnd.getDate() + 7)
        end = weekEnd
        break
      case 'month':
        start = now
        const monthEnd = new Date(now)
        monthEnd.setDate(monthEnd.getDate() + 30)
        end = monthEnd
        break
      default:
        break
    }

    // Update input fields
    setStartDate(start ? start.toISOString().split('T')[0] : '')
    setEndDate(end ? end.toISOString().split('T')[0] : '')
    onChange({ start, end })
  }

  const handleClear = () => {
    setSelectedRange('all')
    setStartDate('')
    setEndDate('')
    onChange({ start: null, end: null })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-gray-700">Date</h3>
        <button
          onClick={handleClear}
          className="text-sm text-blue-500 hover:text-blue-600"
        >
          Clear dates
        </button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'all', label: 'All' },
          { id: 'today', label: 'Today' },
          { id: 'week', label: 'Upcoming Week' },
          { id: 'month', label: 'Upcoming Month' }
        ].map(option => (
          <button
            key={option.id}
            onClick={() => handleQuickFilter(option.id)}
            className={`px-3 py-1 rounded-full text-sm
              ${selectedRange === option.id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <input
          type="date"
          value={startDate}
          className="block w-full rounded-md border-gray-300 shadow-sm 
                     focus:border-blue-500 focus:ring-blue-500"
          onChange={(e) => {
            setStartDate(e.target.value)
            onChange({
              start: e.target.value ? new Date(e.target.value) : null,
              end: endDate ? new Date(endDate) : null
            })
          }}
        />
        <input
          type="date"
          value={endDate}
          className="block w-full rounded-md border-gray-300 shadow-sm 
                     focus:border-blue-500 focus:ring-blue-500"
          onChange={(e) => {
            setEndDate(e.target.value)
            onChange({
              start: startDate ? new Date(startDate) : null,
              end: e.target.value ? new Date(e.target.value) : null
            })
          }}
        />
      </div>
    </div>
  )
}

export default DateFilter 
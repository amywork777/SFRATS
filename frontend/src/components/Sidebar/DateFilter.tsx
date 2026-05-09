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

    let start: Date | null = null
    let end: Date | null = null

    switch (range) {
      case 'today': {
        const now = new Date()
        start = new Date(now.setHours(0, 0, 0, 0))
        end   = new Date(now.setHours(23, 59, 59, 999))
        break
      }
      case 'week': {
        start = new Date()
        const weekEnd = new Date()
        weekEnd.setDate(weekEnd.getDate() + 7)
        end = weekEnd
        break
      }
      case 'month': {
        start = new Date()
        const monthEnd = new Date()
        monthEnd.setDate(monthEnd.getDate() + 30)
        end = monthEnd
        break
      }
    }

    setStartDate(start ? start.toISOString().split('T')[0] : '')
    setEndDate(end ? end.toISOString().split('T')[0] : '')
    onChange({ start, end })
  }

  const options = [
    { id: 'all',   label: 'Any' },
    { id: 'today', label: 'Today' },
    { id: 'week',  label: '7 days' },
    { id: 'month', label: '30 days' },
  ]

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-1.5">
        {options.map(option => {
          const active = selectedRange === option.id
          return (
            <button
              key={option.id}
              onClick={() => handleQuickFilter(option.id)}
              className={`px-2 py-1.5 border-2 border-ink font-mono text-[11px] uppercase tracking-[0.1em] font-semibold transition
                ${active
                  ? 'bg-ink text-paper-light'
                  : 'bg-paper-light text-ink hover:bg-paper'
                }`}
            >
              {option.label}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-mute block mb-1">From</span>
          <input
            type="date"
            value={startDate}
            className="w-full bg-paper-light border-2 border-ink px-2 py-1 font-mono text-[12px] text-ink outline-none focus:shadow-[2px_2px_0_0_rgba(24,22,19,1)] transition-shadow"
            onChange={(e) => {
              setStartDate(e.target.value)
              setSelectedRange('custom')
              onChange({
                start: e.target.value ? new Date(e.target.value) : null,
                end: endDate ? new Date(endDate) : null,
              })
            }}
          />
        </label>
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-mute block mb-1">To</span>
          <input
            type="date"
            value={endDate}
            className="w-full bg-paper-light border-2 border-ink px-2 py-1 font-mono text-[12px] text-ink outline-none focus:shadow-[2px_2px_0_0_rgba(24,22,19,1)] transition-shadow"
            onChange={(e) => {
              setEndDate(e.target.value)
              setSelectedRange('custom')
              onChange({
                start: startDate ? new Date(startDate) : null,
                end: e.target.value ? new Date(e.target.value) : null,
              })
            }}
          />
        </label>
      </div>
    </div>
  )
}

export default DateFilter

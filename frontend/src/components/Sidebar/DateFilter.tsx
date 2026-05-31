import { useState } from 'react'

interface DateFilterProps {
  onChange: (dates: { start: Date | null; end: Date | null }) => void
}

// Quick presets (Tonight / This weekend / Next 7 days …) live in the single
// DateChips bar above the map. This control is just the custom From/To range.
function DateFilter({ onChange }: DateFilterProps) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  return (
    <div className="grid grid-cols-2 gap-2">
      <label className="block">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-mute block mb-1">From</span>
        <input
          type="date"
          value={startDate}
          className="w-full bg-paper-light border-2 border-ink px-2 py-1 font-mono text-[12px] text-ink outline-none focus:shadow-[2px_2px_0_0_rgba(24,22,19,1)] transition-shadow"
          onChange={(e) => {
            setStartDate(e.target.value)
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
            onChange({
              start: startDate ? new Date(startDate) : null,
              end: e.target.value ? new Date(e.target.value) : null,
            })
          }}
        />
      </label>
    </div>
  )
}

export default DateFilter

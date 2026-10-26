import { Search } from 'lucide-react'
import FilterDropdown from './FilterDropdown'

// Title search as a compact dropdown. The trigger shows the active term so you
// can tell a filter is applied without opening it.
export default function SearchFilter({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const active = value.trim().length > 0

  return (
    <FilterDropdown
      active={active}
      panelClassName="w-[240px] p-2.5"
      label={
        <span className="inline-flex items-center gap-1.5">
          <Search size={13} strokeWidth={2.2} />
          {active ? value.slice(0, 12) : 'Search'}
        </span>
      }
    >
      <input
        autoFocus
        type="text"
        aria-label="Search events"
        value={value}
        placeholder="concerts, markets, comedy…"
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 bg-paper border border-ink/30 font-sans text-[13px] placeholder:text-ink-fade outline-none focus:bg-paper-light focus:border-ink focus:ring-1 focus:ring-ink transition-shadow"
      />
      {active && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="mt-2 w-full px-1 py-1 font-sans text-[10px] uppercase tracking-[0.14em] text-bridge-700 hover:text-bridge-500 text-left transition-colors"
        >
          Clear
        </button>
      )}
    </FilterDropdown>
  )
}

import { NavLink } from 'react-router-dom'

interface PageTabsProps {
  active: 'events' | 'items'
  className?: string
}

const tabClass = (active: boolean) =>
  `px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] font-semibold border border-ink transition-colors whitespace-nowrap ${
    active
      ? 'bg-ink text-paper-light'
      : 'bg-paper-light text-ink-mute hover:text-ink hover:bg-paper'
  }`

export default function PageTabs({ active, className = '' }: PageTabsProps) {
  return (
    <div className={`flex items-center gap-1.5 overflow-x-auto ${className}`}>
      <NavLink
        to="/"
        aria-current={active === 'events' ? 'page' : undefined}
        className={() => tabClass(active === 'events')}
      >
        Events
      </NavLink>
      <NavLink
        to="/items"
        aria-current={active === 'items' ? 'page' : undefined}
        className={() => tabClass(active === 'items')}
      >
        Free Stuff
      </NavLink>
    </div>
  )
}

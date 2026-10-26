import { NavLink, Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import FilterDropdown from './FilterDropdown'

export default function TopBar() {
  return (
    <header className="site-header">
      <Link to="/" className="site-brand" aria-label="SF Rats home">
        <img src="/sfrats-logo.png" alt="" aria-hidden />
        <span>SF RATS<span className="brand-period">.</span></span>
      </Link>
      <nav aria-label="Main navigation" className="site-nav">
        <NavLink className="site-primary-link" to="/about">About</NavLink>
        <NavLink className="site-primary-link" to="/agents">For AI</NavLink>
        <a className="site-primary-link" href="https://discord.gg/T7jMh7kEPb" target="_blank" rel="noopener noreferrer">Discord</a>
        <div className="site-more">
          <FilterDropdown label="More" panelClassName="w-[180px]">
            {(close) => <>
              <NavLink to="/about" onClick={close}>About SF Rats</NavLink>
              <a href="https://discord.gg/T7jMh7kEPb" target="_blank" rel="noopener noreferrer" onClick={close}>Join our Discord</a>
              <NavLink to="/agents" onClick={close}>For AI</NavLink>
            </>}
          </FilterDropdown>
        </div>
        <Link to="/submit/new" className="post-link" aria-label="Post an event">
          <Plus size={16} aria-hidden /> <span>Post an event</span>
        </Link>
      </nav>
    </header>
  )
}

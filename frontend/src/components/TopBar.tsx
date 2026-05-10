import { useNavigate, NavLink, Link } from 'react-router-dom'
import { Plus } from 'lucide-react'

export default function TopBar() {
  const navigate = useNavigate()

  const navLink = ({ isActive }: { isActive: boolean }) =>
    `text-[10px] sm:text-[12px] tracking-[0.12em] sm:tracking-[0.14em] uppercase font-mono font-medium transition-colors ${
      isActive ? 'text-ink' : 'text-ink-mute hover:text-ink'
    }`

  return (
    <header className="fixed top-0 left-0 right-0 h-14 md:h-16 bg-paper-light/95 backdrop-blur-sm border-b border-ink/15 z-[1100]">
      <div className="h-full max-w-[1500px] mx-auto px-3 md:px-6 flex items-center justify-between gap-2.5 md:gap-6">
        {/* Masthead */}
        <Link to="/" className="flex items-center gap-2 md:gap-3 group min-w-0 shrink-0">
          {/* Rat-on-the-bridge logo */}
          <img
            src="/sfrats-logo.png"
            alt=""
            aria-hidden
            className="w-9 h-9 md:w-11 md:h-11 object-contain group-hover:rotate-[-4deg] transition-transform shrink-0"
          />
          <h1 className="font-display font-black text-[15px] md:text-lg tracking-tight text-ink whitespace-nowrap">
            SF&nbsp;RATS
            <span className="serif-wonk text-bridge-500 italic font-normal">.</span>
          </h1>
        </Link>

        {/* Nav — visible on every breakpoint. Mono labels stay tight on
            phones so they fit alongside the Post CTA. */}
        <nav className="flex items-center gap-2.5 sm:gap-4 md:gap-7 min-w-0">
          <NavLink to="/about"  className={navLink}>About</NavLink>
          <NavLink to="/agents" className={navLink}>For&nbsp;AI</NavLink>
          <a
            href="https://discord.gg/T7jMh7kEPb"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] sm:text-[12px] tracking-[0.12em] sm:tracking-[0.14em] uppercase font-mono font-medium text-ink-mute hover:text-ink transition-colors"
          >
            Discord
          </a>

          {/* Submit — primary CTA. Icon-only on the narrowest phones so
              About / For AI / Discord still fit alongside it. */}
          <button
            onClick={() => navigate('/submit/new')}
            className="group inline-flex items-center justify-center gap-1.5 bg-bridge-500 text-paper-light w-9 h-9 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 md:px-4 md:py-2 border border-ink shadow-stamp hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_rgba(24,22,19,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all font-mono text-[10px] md:text-[11px] tracking-[0.14em] uppercase font-semibold shrink-0"
            aria-label="Post a find"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span className="hidden md:inline">Post a Find</span>
            <span className="hidden sm:inline md:hidden">Post</span>
          </button>
        </nav>
      </div>
    </header>
  )
}

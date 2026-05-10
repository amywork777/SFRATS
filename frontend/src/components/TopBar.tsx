import { useNavigate, NavLink, Link } from 'react-router-dom'
import { Plus } from 'lucide-react'

export default function TopBar() {
  const navigate = useNavigate()

  const today = new Date()
  const issue = `№ ${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}`
  const dateline = today.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).toUpperCase()

  const navLink = (extra = '') => ({ isActive }: { isActive: boolean }) =>
    `text-[12px] tracking-[0.14em] uppercase font-mono font-medium transition-colors ${extra} ${
      isActive ? 'text-ink' : 'text-ink-mute hover:text-ink'
    }`

  return (
    <header className="fixed top-0 left-0 right-0 h-14 md:h-16 bg-paper-light/95 backdrop-blur-sm border-b border-ink/15 z-[1100]">
      <div className="h-full max-w-[1500px] mx-auto px-3 md:px-6 flex items-center justify-between gap-3 md:gap-6">
        {/* Masthead */}
        <Link to="/" className="flex items-center gap-2.5 md:gap-3 group min-w-0">
          {/* Rat-on-the-bridge logo */}
          <img
            src="/sfrats-logo.png"
            alt=""
            aria-hidden
            className="w-9 h-9 md:w-11 md:h-11 object-contain group-hover:rotate-[-4deg] transition-transform shrink-0"
          />

          <div className="flex flex-col leading-none min-w-0">
            <h1 className="font-display font-black text-[15px] md:text-lg tracking-tight text-ink truncate">
              SF&nbsp;RATS
              <span className="serif-wonk text-bridge-500 italic font-normal">.</span>
            </h1>
            <span className="hidden sm:block font-mono text-[10px] tracking-[0.18em] uppercase text-ink-mute mt-0.5 truncate">
              A Field Guide&nbsp;·&nbsp;{issue}&nbsp;·&nbsp;<span className="hidden md:inline">{dateline}</span>
            </span>
          </div>
        </Link>

        {/* Nav. About lives in MobileNav's footer on phones, so we hide
            all secondary links here on small screens to keep room for Post. */}
        <nav className="flex items-center gap-3 md:gap-7">
          <NavLink to="/about"  className={navLink('hidden md:inline')}>About</NavLink>
          <NavLink to="/agents" className={navLink('hidden md:inline')}>For AI</NavLink>
          <a
            href="https://discord.gg/T7jMh7kEPb"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:inline text-[12px] tracking-[0.14em] uppercase font-mono font-medium text-ink-mute hover:text-ink transition-colors"
          >
            Discord
          </a>

          {/* Submit — primary CTA */}
          <button
            onClick={() => navigate('/submit/new')}
            className="group inline-flex items-center gap-1.5 bg-bridge-500 text-paper-light px-3 py-1.5 md:px-4 md:py-2 border border-ink shadow-stamp hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_rgba(24,22,19,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all font-mono text-[10px] md:text-[11px] tracking-[0.14em] uppercase font-semibold"
            aria-label="Post a find"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span className="hidden sm:inline">Post a Find</span>
            <span className="sm:hidden">Post</span>
          </button>
        </nav>
      </div>
    </header>
  )
}

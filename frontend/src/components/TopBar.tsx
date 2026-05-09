import { useNavigate, NavLink, Link } from 'react-router-dom'

export default function TopBar() {
  const navigate = useNavigate()

  // Use today's date as a faux issue number — gives the masthead a paper feel
  const today = new Date()
  const issue = `№ ${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}`
  const dateline = today.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).toUpperCase()

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-[12px] tracking-[0.14em] uppercase font-mono font-medium transition-colors ${
      isActive ? 'text-ink' : 'text-ink-mute hover:text-ink'
    }`

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-paper-light/95 backdrop-blur-sm border-b-2 border-ink z-[1100]">
      <div className="h-full max-w-[1500px] mx-auto px-4 md:px-7 flex items-center justify-between gap-6">
        {/* Masthead */}
        <Link to="/" className="flex items-center gap-3 group min-w-0">
          {/* The rat sigil — a hard-edged tag */}
          <span
            className="relative inline-flex items-center justify-center w-10 h-10 bg-ink text-paper-light text-[20px] leading-none shadow-stamp group-hover:rotate-[-4deg] transition-transform shrink-0"
            aria-hidden
          >
            🐀
          </span>

          <div className="flex flex-col leading-none min-w-0">
            <h1 className="font-display font-black text-[22px] md:text-[26px] tracking-tight text-ink truncate">
              SF&nbsp;RATS
              <span className="serif-wonk text-bridge-500 italic font-normal">.</span>
            </h1>
            <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-mute mt-0.5 truncate">
              A Working Field Guide&nbsp;·&nbsp;{issue}&nbsp;·&nbsp;<span className="hidden sm:inline">{dateline}</span>
            </span>
          </div>
        </Link>

        {/* Right side */}
        <nav className="flex items-center gap-4 md:gap-7">
          <NavLink to="/about"      className={linkClass}>About</NavLink>
          <NavLink to="/guidelines" className={linkClass + ' hidden sm:inline'}>Guide</NavLink>
          <a
            href="https://discord.gg/T7jMh7kEPb"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] tracking-[0.14em] uppercase font-mono font-medium text-ink-mute hover:text-ink transition-colors"
          >
            Discord
          </a>

          {/* Submit — rubber-stamp button */}
          <button
            onClick={() => navigate('/submit/new')}
            className="group ml-1 inline-flex items-center gap-2 bg-bridge-500 text-paper-light px-4 py-2 border-2 border-ink shadow-stamp hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_rgba(24,22,19,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all font-mono text-[11px] tracking-[0.14em] uppercase font-semibold"
          >
            <span aria-hidden>＋</span>
            Post a Find
          </button>
        </nav>
      </div>
    </header>
  )
}

import { useNavigate, NavLink, Link } from 'react-router-dom'

export default function TopBar() {
  const navigate = useNavigate()

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors ${
      isActive ? 'text-stone-900' : 'text-stone-500 hover:text-stone-900'
    }`

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur border-b border-stone-200/80 z-[1100]">
      <div className="h-full max-w-[1400px] mx-auto px-4 md:px-6 flex items-center justify-between">
        {/* Logo + wordmark */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <span
            className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-rust-500 text-white text-lg shadow-soft group-hover:rotate-[-6deg] transition-transform"
            aria-hidden
          >
            🐀
          </span>
          <div className="leading-tight">
            <h1 className="font-display font-bold text-base md:text-lg tracking-tight">
              SF&nbsp;RATS
            </h1>
            <p className="hidden sm:block text-[11px] uppercase tracking-[0.14em] text-stone-500">
              Free Stuff Map
            </p>
          </div>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-4 md:gap-7">
          <NavLink to="/about"      className={linkClass}>About</NavLink>
          <NavLink to="/guidelines" className={linkClass + ' hidden sm:inline'}>Guidelines</NavLink>
          <a
            href="https://discord.gg/T7jMh7kEPb"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors"
          >
            Discord
          </a>
          <button
            onClick={() => navigate('/submit/new')}
            className="ml-1 inline-flex items-center gap-1.5 bg-rust-500 hover:bg-rust-600 active:bg-rust-700 text-white px-3.5 py-1.5 md:px-4 md:py-2 rounded-full text-sm font-semibold shadow-soft transition-colors"
          >
            <span className="text-base leading-none">＋</span>
            Submit
          </button>
        </nav>
      </div>
    </header>
  )
}

import { useNavigate, Link } from 'react-router-dom'

export default function TopBar() {
  const navigate = useNavigate()

  return (
    <div className="fixed top-0 left-0 right-0 h-16 bg-white shadow-sm z-50">
      <div className="h-full max-w-7xl mx-auto px-2 md:px-4 flex items-center justify-between">
        {/* Logo and Title */}
        <Link to="/" className="flex items-center gap-1 md:gap-2">
          <span className="text-xl md:text-3xl">🐀</span>
          <div>
            <h1 className="font-bold text-base md:text-xl leading-tight">SF RATS</h1>
            <p className="hidden sm:block text-xs md:text-sm text-gray-500 leading-tight">SF Free Stuff</p>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-2 md:gap-6">
          <button 
            onClick={() => navigate('/about')}
            className="text-xs md:text-base text-gray-600 hover:text-gray-900"
          >
            About
          </button>
          <button 
            onClick={() => navigate('/guidelines')}
            className="hidden sm:block text-xs md:text-base text-gray-600 hover:text-gray-900"
          >
            Guide
          </button>
          <a 
            href="https://discord.gg/T7jMh7kEPb"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs md:text-base text-gray-600 hover:text-gray-900"
          >
            Discord
          </a>
          <button
            onClick={() => navigate('/submit/new')}
            className="bg-blue-500 text-white px-2 py-1 md:px-4 md:py-2 rounded text-xs md:text-base hover:bg-blue-600"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  )
} 
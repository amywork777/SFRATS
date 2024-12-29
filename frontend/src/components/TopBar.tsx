import { useNavigate, Link } from 'react-router-dom'
import RatLogo from './RatLogo'

interface TopBarProps {
  onSubmitClick: () => void
  onHomeClick: () => void
}

function TopBar({ onSubmitClick, onHomeClick }: TopBarProps) {
  const navigate = useNavigate()

  const handleLogoClick = () => {
    onHomeClick()
    navigate('/')
  }

  return (
    <div className="h-16 bg-white shadow-sm flex items-center px-4 justify-between 
                    sticky top-0 z-50">
      {/* Logo and Title */}
      <button 
        onClick={handleLogoClick}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        <div className="w-8 h-8">
          <RatLogo />
        </div>
        <div>
          <div className="font-bold text-lg">SF RATS</div>
          <div className="text-sm text-gray-500">SF Free Stuff</div>
        </div>
      </button>

      {/* Navigation Links */}
      <div className="flex items-center gap-6">
        <Link to="/about" className="text-gray-600 hover:text-gray-900">
          About
        </Link>
        <Link to="/guidelines" className="text-gray-600 hover:text-gray-900">
          Guidelines
        </Link>
        <a 
          href="https://discord.gg/T7jMh7kEPb"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-600 hover:text-gray-900"
        >
          Discord
        </a>
        <button
          onClick={onSubmitClick}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 
                   transition-colors"
        >
          Submit Free Stuff
        </button>
      </div>
    </div>
  )
}

export default TopBar 
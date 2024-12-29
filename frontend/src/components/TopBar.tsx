import { useNavigate, Link } from 'react-router-dom'
import RatLogo from './RatLogo'

interface TopBarProps {
  onSubmitClick: () => void
  onHomeClick: () => void
}

function TopBar({ onSubmitClick, onHomeClick }: TopBarProps) {
  return (
    <div className="h-16 bg-white border-b flex items-center justify-between px-4">
      <Link 
        to="/" 
        onClick={onHomeClick}
        className="flex items-center hover:opacity-80"
      >
        <RatLogo />
        <div className="flex flex-col">
          <span className="font-bold text-lg leading-tight">SF RATS</span>
          <span className="text-sm text-gray-500 leading-tight">SF Free Stuff</span>
        </div>
      </Link>

      <div className="flex items-center gap-4">
        <Link to="/about" className="text-gray-600 hover:text-gray-800">About</Link>
        <Link to="/guidelines" className="text-gray-600 hover:text-gray-800">Guidelines</Link>
        <Link to="https://discord.gg/T7jMh7kEPb" className="text-gray-600 hover:text-gray-800">Discord</Link>
        <button
          onClick={onSubmitClick}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          Submit Free Stuff
        </button>
      </div>
    </div>
  )
}

export default TopBar 
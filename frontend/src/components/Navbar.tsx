import { Link } from 'react-router-dom'

const Navbar = () => {
  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-2">
            <span className="text-2xl" role="img" aria-label="rat">🐀</span>
            <div className="flex flex-col">
              <Link to="/" className="text-xl font-bold text-gray-800">
                SF RATS
              </Link>
              <span className="text-sm text-gray-600">SF Free Stuff</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/about" className="text-gray-600 hover:text-gray-800">
              About
            </Link>
            <Link to="/guidelines" className="text-gray-600 hover:text-gray-800">
              Guidelines
            </Link>
            <Link to="/submit" className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
              Submit Item
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar 
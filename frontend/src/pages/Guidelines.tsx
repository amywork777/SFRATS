import { Link } from 'react-router-dom'

export default function Guidelines() {
  return (
    <div className="pt-20 px-4 md:px-8 max-w-4xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Guidelines</h1>
      
      <div className="prose prose-lg">
        <h2>Community Guidelines</h2>
        <ul>
          <li>Be respectful and kind to others</li>
          <li>Only post items that are actually free</li>
          <li>Update or remove your listing when items are gone</li>
          <li>Include clear photos and descriptions</li>
          <li>Provide accurate location information</li>
        </ul>

        {/* Add more content as needed */}
      </div>

      <div className="mt-8">
        <Link 
          to="/"
          className="text-blue-500 hover:text-blue-600"
        >
          ← Back to Map
        </Link>
      </div>
    </div>
  )
} 
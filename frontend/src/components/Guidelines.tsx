import { Link } from 'react-router-dom'

const Guidelines = () => {
  return (
    <div className="min-h-screen pt-16 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <span className="text-4xl">📜</span>
            <h1 className="text-3xl font-bold text-gray-800">Community Guidelines</h1>
          </div>

          {/* Guidelines Content */}
          <div className="space-y-8">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔧</span>
              <div>
                <h2 className="text-xl font-semibold mb-2">Be Kind & Respectful</h2>
                <p className="text-gray-600">We're all here to help each other. Treat everyone with respect, 
                whether you're giving or receiving.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-2xl">⏰</span>
              <div>
                <h2 className="text-xl font-semibold mb-2">Be Timely & Reliable</h2>
                <p className="text-gray-600">If you post something, keep it updated. If you say you'll be 
                somewhere, show up. Remove listings once items are taken.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-2xl">✨</span>
              <div>
                <h2 className="text-xl font-semibold mb-2">Keep It Free</h2>
                <p className="text-gray-600">Everything posted should be 100% free. No selling, bartering, 
                or "dm for price" allowed.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-2xl">📍</span>
              <div>
                <h2 className="text-xl font-semibold mb-2">Be Specific & Honest</h2>
                <p className="text-gray-600">Provide accurate locations, clear descriptions, and honest 
                condition assessments of items.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-2xl">🚫</span>
              <div>
                <h2 className="text-xl font-semibold mb-2">What Not to Post</h2>
                <p className="text-gray-600">No illegal items, unsafe food, or expired goods. If you wouldn't 
                take it yourself, don't post it.</p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-12 flex flex-col items-center gap-4 pt-8 border-t">
            <h3 className="text-xl font-semibold">Ready to contribute?</h3>
            <div className="flex gap-4">
              <Link 
                to="/submit" 
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Share Something
              </Link>
              <Link 
                to="/about" 
                className="border-2 border-blue-500 text-blue-500 px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Guidelines 
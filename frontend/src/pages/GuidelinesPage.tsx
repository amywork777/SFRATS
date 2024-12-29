import { FaDiscord } from 'react-icons/fa'

function GuidelinesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Community Guidelines</h1>
      
      <div className="prose max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Sharing Guidelines</h2>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li>Keep it 100% free - no hidden costs or trades</li>
            <li>Be honest about what you're sharing</li>
            <li>Add a photo if you can - it helps!</li>
            <li>Drop a pin at the right spot</li>
            <li>Let others know when something's been claimed</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Safety Tips</h2>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li>Try to meet in public spots</li>
            <li>Keep personal details private</li>
            <li>Use the chat feature to coordinate</li>
            <li>Trust your gut - if something feels off, skip it</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Not Allowed</h2>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li>Anything illegal (obviously!)</li>
            <li>Dangerous stuff</li>
            <li>NSFW content</li>
            <li>Medications</li>
            <li>Recalled products</li>
          </ul>
        </section>
      </div>
    </div>
  )
}

export default GuidelinesPage 
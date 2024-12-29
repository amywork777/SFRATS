import { Link } from 'react-router-dom'

const About = () => {
  return (
    <div className="min-h-screen pt-16 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-4xl">🐀</span>
            <h1 className="text-3xl font-bold text-gray-800">About SF RATS</h1>
          </div>

          {/* Introduction */}
          <div className="prose prose-lg max-w-none">
            <p className="text-lg leading-relaxed">
              Hey! I'm Amy and I absolutely love free food and free stuff. I'm super active in the Buy Nothing 
              community and get way too excited about finding free things - honestly, over half my furniture 
              and clothes came from free sources and I'm pretty proud of that.
            </p>

            {/* Origin Story */}
            <div className="my-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span>🎓</span> Where it Started
              </h2>
              <p className="mb-4">
                This whole thing started back at Stanford where I ran a free food club. Basically, I'd share 
                tips about all these networking events, career fairs, and fireside chats where you could 
                score free food. What started as just hunting for free meals turned into something way 
                cooler - I ended up making some of my closest friends through these adventures!
              </p>
            </div>

            {/* SF Chapter */}
            <div className="my-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span>🌉</span> The SF Chapter
              </h2>
              <p className="mb-4">
                After graduating and moving to SF, I really missed that whole vibe. There's something special 
                about a community of people who get excited about free stuff and sharing resources. So I 
                figured, why not start it up here?
              </p>
            </div>

            {/* Personal Note */}
            <div className="my-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span>✨</span> Plot Twist
              </h2>
              <p className="mb-4">
                Oh, and in classic plot twist fashion - I'm actually a startup founder now (surprise lol). 
                But being scrappy and resourceful is just part of who I am at this point. I love finding 
                creative ways to make the most of what's available, and there's something kind of fun 
                about the whole "rat life" approach to it all.
              </p>
            </div>

            {/* Welcome Message */}
            <div className="my-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span>👋</span> Join the Community
              </h2>
              <p className="mb-4">
                Whether you're here for the free food, the community, or just curious about this whole 
                thing - welcome! Hope you'll join us in embracing the resourceful (and slightly chaotic) 
                spirit of it all.
              </p>
              <p className="mb-4">
                Looking forward to sharing some free food adventures with you all!
              </p>
              <p className="text-lg font-medium">- Amy</p>
            </div>

            {/* Community Guidelines */}
            <div className="my-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span>📜</span> Community Guidelines
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-lg">🔧</span>
                  <div>
                    <h3 className="font-medium">Be Kind & Respectful</h3>
                    <p className="text-gray-600">We're all here to help each other. Treat everyone with respect, 
                    whether you're giving or receiving.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-lg">⏰</span>
                  <div>
                    <h3 className="font-medium">Be Timely & Reliable</h3>
                    <p className="text-gray-600">If you post something, keep it updated. If you say you'll be 
                    somewhere, show up. Remove listings once items are taken.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-lg">✨</span>
                  <div>
                    <h3 className="font-medium">Keep It Free</h3>
                    <p className="text-gray-600">Everything posted should be 100% free. No selling, bartering, 
                    or "dm for price" allowed.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-lg">📍</span>
                  <div>
                    <h3 className="font-medium">Be Specific & Honest</h3>
                    <p className="text-gray-600">Provide accurate locations, clear descriptions, and honest 
                    condition assessments of items.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-lg">🚫</span>
                  <div>
                    <h3 className="font-medium">What Not to Post</h3>
                    <p className="text-gray-600">No illegal items, unsafe food, or expired goods. If you wouldn't 
                    take it yourself, don't post it.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="mt-12 flex flex-col items-center gap-4">
              <h3 className="text-xl font-semibold">Ready to join the community?</h3>
              <div className="flex gap-4">
                <Link 
                  to="/" 
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Explore the Map
                </Link>
                <Link 
                  to="/submit" 
                  className="border-2 border-blue-500 text-blue-500 px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Share Something
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default About 
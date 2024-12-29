function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">About SF RATS</h1>
      
      <div className="prose max-w-none space-y-8">
        {/* Intro Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-gray-700 leading-relaxed mb-6">
            Hey! I'm Amy and I absolutely love free food and free stuff. I'm super active in the Buy Nothing community 
            and get way too excited about finding free things - honestly, over half my furniture and clothes came from 
            free sources and I'm pretty proud of that.
          </p>

          {/* Origin Story */}
          <div className="border-l-4 border-blue-500 pl-4 mb-6">
            <p className="text-gray-700 leading-relaxed">
              This whole thing started back at Stanford where I ran a free food club. Basically, I'd share tips about 
              all these networking events, career fairs, and fireside chats where you could score free food. What started 
              as just hunting for free meals turned into something way cooler - I ended up making some of my closest 
              friends through these adventures!
            </p>
          </div>

          {/* SF Journey */}
          <p className="text-gray-700 leading-relaxed mb-6">
            After graduating and moving to SF, I really missed that whole vibe. There's something special about a 
            community of people who get excited about free stuff and sharing resources. So I figured, why not start 
            it up here?
          </p>

          {/* Personal Note */}
          <p className="text-gray-700 leading-relaxed mb-6">
            Oh, and in classic plot twist fashion - I'm actually a startup founder now (surprise lol). But being 
            scrappy and resourceful is just part of who I am at this point. I love finding creative ways to make 
            the most of what's available, and there's something kind of fun about the whole "rat life" approach to it all.
          </p>

          {/* Welcome Message */}
          <p className="text-gray-700 leading-relaxed mb-6">
            Whether you're here for the free food, the community, or just curious about this whole thing - welcome! 
            Hope you'll join us in embracing the resourceful (and slightly chaotic) spirit of it all.
          </p>

          {/* Sign off */}
          <div className="mt-8">
            <p className="text-gray-700 leading-relaxed mb-2">
              Looking forward to sharing some free food adventures with you all!
            </p>
            <p className="text-gray-800 font-medium">
              Amy
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AboutPage 
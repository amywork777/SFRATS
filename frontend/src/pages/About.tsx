import { Link } from 'react-router-dom'

export default function About() {
  return (
    <div className="pt-20 px-4 md:px-8 max-w-4xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">About SF RATS</h1>
      
      <div className="prose prose-lg">
        <h2>What is SF RATS?</h2>
        <p>
          SF RATS (San Francisco Really Awesome Things Sharing) is a real-time map of free items, food, 
          and events around San Francisco. Our mission is to reduce waste, build community, and make it 
          easier for everyone to find and share free resources in the city.
        </p>

        <h2>Features</h2>
        <ul>
          <li>Real-time map of free items across SF</li>
          <li>Easy submission system for sharing items</li>
          <li>Categories for food, items, events, and services</li>
          <li>Mobile-friendly interface</li>
          <li>No account required - just post and share!</li>
        </ul>

        <h2>Why RATS?</h2>
        <p>
          Just like rats are expert urban scavengers who know where all the good stuff is, 
          SF RATS helps you find the best free resources in the city. Plus, rats are actually 
          quite community-oriented animals who share information about food locations with their 
          social groups - just like we do!
        </p>

        <h2>About the Creator</h2>
        <p>
          Hey! I'm Amy and I absolutely love free food and free stuff. I'm active in the SF Buy Nothing 
          community and get way too excited about sidewalk scores - honestly, over half my furniture 
          and clothes came from free piles! During my time at Stanford, I ran a free food club that 
          helped students find and share information about free food events on campus. This experience 
          showed me how powerful community resource sharing can be, and inspired the creation of SF RATS.
        </p>

        <h2>Join the Community</h2>
        <p>
          SF RATS is a community project that gets better the more people use it. Whether you're 
          decluttering your apartment, sharing leftover catering food, or organizing a free event, 
          posting on SF RATS helps build a more sustainable and connected San Francisco.
        </p>
        
        <p>
          Join our <a href="https://discord.gg/T7jMh7kEPb" target="_blank" rel="noopener noreferrer" 
          className="text-blue-500 hover:text-blue-600">Discord community</a> to connect with other 
          members and get notifications about new free items!
        </p>
      </div>

      <div className="mt-8 mb-12">
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
import { Link } from 'react-router-dom'

export default function About() {
  return (
    <div className="pt-24 pb-20 px-4 md:px-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <span className="label">A Field Guide · Editor's Note</span>
        <h1 className="font-display font-black text-5xl md:text-6xl text-ink leading-[0.95] mt-3 tracking-tight">
          About SF&nbsp;RATS<span className="serif-wonk text-bridge-500 italic font-normal">.</span>
        </h1>
        <div className="rule-thick mt-6" />
      </div>

      <div className="space-y-7 text-[16px] leading-[1.7] text-ink-soft">
        <p className="font-display text-[20px] leading-[1.5] text-ink">
          A real-time map of free items, food, and events around San Francisco —
          built so neighbors can share what they don't need with the people who do.
        </p>

        <section>
          <h2 className="font-display font-bold text-2xl text-ink mb-2">What is SF RATS?</h2>
          <p>
            SF RATS (San Francisco Really Awesome Things Sharing) is a community map of free
            stuff in the city. Reduce waste, build community, make it easier for everyone to
            find and share resources.
          </p>
        </section>

        <section>
          <h2 className="font-display font-bold text-2xl text-ink mb-3">Features</h2>
          <ul className="space-y-2 font-mono text-[13px] uppercase tracking-[0.08em] text-ink">
            <li className="flex gap-3"><span className="text-bridge-500">▸</span> Real-time map of free items across SF</li>
            <li className="flex gap-3"><span className="text-bridge-500">▸</span> Easy submission system for sharing</li>
            <li className="flex gap-3"><span className="text-bridge-500">▸</span> Categories: food, items, events, services</li>
            <li className="flex gap-3"><span className="text-bridge-500">▸</span> Mobile-friendly</li>
            <li className="flex gap-3"><span className="text-bridge-500">▸</span> No account required — post and share</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display font-bold text-2xl text-ink mb-2">Why rats?</h2>
          <p>
            Rats are expert urban scavengers — they know where the good stuff is, and they
            share that information with their social groups. We do the same.
          </p>
        </section>

        <section>
          <h2 className="font-display font-bold text-2xl text-ink mb-2">About the creator</h2>
          <p>
            Hey! I'm Amy and I love free food and free stuff. Active in SF Buy Nothing,
            way too excited about sidewalk scores — over half my furniture and clothes
            came from free piles. At Stanford I ran a free-food club to help students
            find leftover catering. SF RATS is the same idea, citywide.
          </p>
        </section>

        <section>
          <h2 className="font-display font-bold text-2xl text-ink mb-2">Join the community</h2>
          <p>
            SF RATS gets better the more people use it. Whether you're decluttering,
            sharing leftover catering, or organizing a free event — posting helps
            build a more sustainable, connected San Francisco.
          </p>
          <p className="mt-3">
            Join the{' '}
            <a
              href="https://discord.gg/T7jMh7kEPb"
              target="_blank"
              rel="noopener noreferrer"
              className="text-bridge-600 underline underline-offset-4 decoration-2 hover:text-bridge-700"
            >
              Discord
            </a>{' '}
            to connect with other members and get notifications about new posts.
          </p>
        </section>
      </div>

      <div className="rule-thick mt-12 pt-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.14em] text-ink hover:text-bridge-600"
        >
          <span aria-hidden>←</span> Back to map
        </Link>
      </div>
    </div>
  )
}

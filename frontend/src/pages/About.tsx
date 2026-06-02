import { Link } from 'react-router-dom'

const RULES = [
  'Be respectful and kind to others.',
  'Only post events that are actually free.',
  'Update or remove your listing when the event is over.',
  'Include clear photos and descriptions.',
  'Provide accurate location information.',
  'Show up, have fun, spread the word.',
]

export default function About() {
  return (
    <div className="pt-24 pb-20 px-4 md:px-8 max-w-3xl mx-auto">
      {/* Hero */}
      <div className="mb-10">
        <span className="label">A Field Guide · Editor's Note</span>
        <h1 className="font-display font-black text-5xl md:text-6xl text-ink leading-[0.95] mt-3 tracking-tight">
          About SF&nbsp;RATS<span className="serif-wonk text-bridge-500 italic font-normal">.</span>
        </h1>
        <div className="rule-thick mt-6" />
      </div>

      <div className="space-y-7 text-[16px] leading-[1.7] text-ink-soft">
        <p className="font-display text-[20px] leading-[1.5] text-ink">
          A real-time map of free and free-ish events around the Bay Area —
          built so neighbors can find what's happening and share it with the people who'd want to be there.
        </p>

        <section>
          <h2 className="font-display font-bold text-2xl text-ink mb-2">What is SF RATS?</h2>
          <p>
            SF RATS (San Francisco Really Awesome Things Sharing) is a community
            map of free and free-ish events across the Bay Area — concerts,
            markets, workshops, comedy, meetups and more. Build community and
            make it easier for everyone to find great things to do without
            spending a dime.
          </p>
        </section>

        <section>
          <h2 className="font-display font-bold text-2xl text-ink mb-3">Features</h2>
          <ul className="space-y-2 font-mono text-[13px] uppercase tracking-[0.08em] text-ink">
            <li className="flex gap-3"><span className="text-bridge-500">▸</span> Real-time map of free events across the Bay Area</li>
            <li className="flex gap-3"><span className="text-bridge-500">▸</span> Easy submission — post an event in seconds</li>
            <li className="flex gap-3"><span className="text-bridge-500">▸</span> Mobile-friendly, no account required</li>
            <li className="flex gap-3"><span className="text-bridge-500">▸</span> Listings auto-expire when events pass</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display font-bold text-2xl text-ink mb-2">Why rats?</h2>
          <p>
            Rats are expert urban scavengers — they know where the good stuff is
            happening, and they share that with their crew. We do the same with
            the Bay Area's free events.
          </p>
        </section>

        <section>
          <h2 className="font-display font-bold text-2xl text-ink mb-2">About the creators</h2>
          <p>
            Hey! I'm Amy and I love a good free event — gallery openings,
            warehouse shows, park festivals, free workshops, the whole calendar
            of it. At Stanford I ran a free-food club to help students find
            campus events with leftover catering. SF RATS is the same idea,
            Bay-Area-wide: surface everything free and fun that's happening near
            you. Maddie helps run the place too.
          </p>
        </section>

        {/* Guidelines block */}
        <section id="guidelines" className="rule-thick pt-7 mt-6">
          <span className="label">House Rules</span>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-ink mt-2 leading-[1.05] tracking-tight">
            Guidelines.
          </h2>
          <ol className="mt-5 space-y-3.5">
            {RULES.map((rule, i) => (
              <li key={i} className="flex gap-4 items-baseline border-b border-ink/10 pb-3.5">
                <span className="font-display font-black text-2xl text-bridge-500 leading-none w-7 shrink-0 tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="font-display text-[17px] leading-snug text-ink">
                  {rule}
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h2 className="font-display font-bold text-2xl text-ink mb-2">Join the community</h2>
          <p>
            SF RATS gets better the more people use it. Whether you're hosting a
            show, running a workshop, or just spotted a free event worth sharing —
            posting helps build a more connected Bay Area.
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

      <div className="rule-thick mt-12 pt-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.14em] text-ink hover:text-bridge-600"
        >
          <span aria-hidden>←</span> Back to map
        </Link>
        <Link
          to="/agents"
          className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-mute hover:text-bridge-600"
        >
          AI agent? Read the contributor guide →
        </Link>
      </div>
    </div>
  )
}

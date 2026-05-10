import { ArrowUpRight } from 'lucide-react'
import PageTabs from '../components/PageTabs'

interface Resource {
  name: string
  emoji: string
  url?: string
  type: string
  blurb: string
  tip?: string
}

const PRIMARY: Resource[] = [
  {
    name: 'Craigslist Free',
    emoji: '🪑',
    url: 'https://sfbay.craigslist.org/search/sfc/zip',
    type: 'Site',
    blurb: 'The classic. Filter "free" within San Francisco — couches, plants, art supplies, the lot. Listings move fast; refresh often, especially Saturday mornings, and reply quickly.',
  },
  {
    name: 'Buy Nothing',
    emoji: '🎁',
    url: 'https://buynothingapp.com',
    type: 'App · Facebook',
    blurb: 'Hyperlocal gifting communities, one per neighborhood. The official app is the modern way in; the older Facebook groups still run too — search "Buy Nothing San Francisco" or your specific neighborhood.',
    tip: 'Each group is gated to a few blocks, so pickup is usually walkable.',
  },
  {
    name: 'Freecycle',
    emoji: '♻️',
    url: 'https://freecycle.org/town/SanFrancisco',
    type: 'Network',
    blurb: 'The email-list elder of the gift economy. Less active than Buy Nothing these days, but consistent for furniture and household goods.',
  },
  {
    name: 'Trash Nothing',
    emoji: '🗑️',
    url: 'https://trashnothing.com',
    type: 'Aggregator',
    blurb: 'Web and mobile interface that aggregates Freecycle and other gift-economy posts. Easier to scan than the Freecycle email digest.',
  },
  {
    name: 'Facebook Marketplace · Free',
    emoji: '🛋️',
    url: 'https://www.facebook.com/marketplace/sanfrancisco/free',
    type: 'Facebook',
    blurb: 'Set the price filter to $0 within San Francisco. Lots of curb-alert-style posts — pickup-now-or-lose-it furniture, moving leftovers.',
  },
  {
    name: 'Nextdoor',
    emoji: '🏘️',
    url: 'https://nextdoor.com',
    type: 'Neighborhood',
    blurb: 'Look for the "For Sale & Free" or "Free Items" section, scoped to your neighborhood. Quality varies, but small-radius pickups are common.',
  },
]

const FACEBOOK_GROUPS: { name: string; blurb: string }[] = [
  {
    name: 'SF Bay Area Free Stuff and Services',
    blurb: 'Large general group covering the whole Bay Area. Search Facebook for the exact name and request to join.',
  },
  {
    name: 'Buy Nothing / Trade Something (SF Bay Area Families)',
    blurb: 'Family-oriented — kids\' clothes, baby gear, toys, strollers. Same drill: search Facebook and request to join.',
  },
]

export default function Items() {
  return (
    <div className="pt-14 md:pt-16">
      <div className="px-3 md:px-5 py-2.5 bg-paper-light border-b border-ink/15 sticky top-14 md:top-16 z-[900]">
        <PageTabs active="items" />
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-8 pt-10 md:pt-14 pb-16">
        <header className="mb-10">
          <span className="label">A Field Guide · Free Stuff</span>
          <h1 className="font-display font-black text-5xl md:text-6xl text-ink leading-[0.95] mt-3 tracking-tight">
            Free stuff in SF<span className="serif-wonk text-bridge-500 italic font-normal">.</span>
          </h1>
          <p className="font-display text-[18px] md:text-[20px] leading-snug text-ink-soft mt-5 max-w-2xl">
            The communities, apps, and lists where San Franciscans give things
            away. Different stuff turns up in each one, so it's worth bookmarking
            a few.
          </p>
          <div className="rule-thick mt-7" />
        </header>

        <section className="mb-14">
          <span className="label">The big ones</span>
          <ul className="mt-5 space-y-4">
            {PRIMARY.map(r => (
              <li key={r.name}>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block bg-paper-light border border-ink/20 px-5 py-5 hover:border-ink hover:shadow-stamp transition-all"
                >
                  <div className="flex items-start gap-4">
                    <span className="shrink-0 inline-flex items-center justify-center w-12 h-12 text-[26px] bg-paper border border-ink/15 leading-none">
                      {r.emoji}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-3 flex-wrap mb-1.5">
                        <h3 className="font-display font-bold text-[20px] leading-tight text-ink">
                          {r.name}
                        </h3>
                        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-bridge-700 bg-bridge-50 border border-bridge-200 px-2 py-0.5">
                          {r.type}
                        </span>
                      </div>
                      <p className="text-[14px] leading-snug text-ink-soft">
                        {r.blurb}
                      </p>
                      {r.tip && (
                        <p className="font-mono text-[11px] tracking-[0.04em] text-ink-mute mt-2">
                          ▸ {r.tip}
                        </p>
                      )}
                      <div className="mt-3 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-bridge-600 group-hover:text-bridge-700">
                        Visit <ArrowUpRight size={12} strokeWidth={2.5} />
                      </div>
                    </div>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-14">
          <span className="label">Facebook groups</span>
          <p className="text-[14px] leading-snug text-ink-soft mt-3 max-w-2xl">
            Active groups you can request to join. Search Facebook for the exact name —
            we don't link directly because group URLs change.
          </p>
          <ul className="mt-5 space-y-3">
            {FACEBOOK_GROUPS.map(g => (
              <li key={g.name} className="flex items-start gap-4 bg-paper-light border border-ink/15 px-5 py-4">
                <span className="shrink-0 inline-flex items-center justify-center w-10 h-10 text-[20px] bg-paper border border-ink/15 leading-none">
                  👥
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold text-[16px] leading-tight text-ink">
                    "{g.name}"
                  </h3>
                  <p className="text-[13px] leading-snug text-ink-soft mt-1">
                    {g.blurb}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <div className="rule-hair my-8" />

        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-mute leading-relaxed max-w-xl">
          Got something to give away yourself? Post it on one of the above —
          they're already big and active, so your couch will find a home faster.
        </p>
      </div>
    </div>
  )
}

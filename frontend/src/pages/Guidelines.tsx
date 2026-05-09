import { Link } from 'react-router-dom'

export default function Guidelines() {
  const rules = [
    'Be respectful and kind to others.',
    'Only post items that are actually free.',
    'Update or remove your listing when items are gone.',
    'Include clear photos and descriptions.',
    'Provide accurate location information.',
    'Take what you need. Leave the rest.',
  ]

  return (
    <div className="pt-24 pb-20 px-4 md:px-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <span className="label">House Rules</span>
        <h1 className="font-display font-black text-5xl md:text-6xl text-ink leading-[0.95] mt-3 tracking-tight">
          Guidelines<span className="serif-wonk text-bridge-500 italic font-normal">.</span>
        </h1>
        <div className="rule-thick mt-6" />
      </div>

      <ol className="space-y-4">
        {rules.map((rule, i) => (
          <li
            key={i}
            className="flex gap-5 items-baseline border-b border-ink/15 pb-4"
          >
            <span className="font-display font-black text-4xl text-bridge-500 leading-none w-12 shrink-0 tabular-nums">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="font-display text-[19px] leading-snug text-ink">
              {rule}
            </span>
          </li>
        ))}
      </ol>

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

import { PartyPopper, Pizza, Wrench, MapPin, type LucideIcon } from 'lucide-react'

// Events is the only user-facing category. Old data uses Food/Services/Items —
// kept here in the lookup so historical rows still render with a sensible icon.
const map: Record<string, LucideIcon> = {
  Events:   PartyPopper,
  Food:     Pizza,        // legacy
  Services: Wrench,       // legacy
}

export const CATEGORY_ORDER = ['Events'] as const
export type Category = typeof CATEGORY_ORDER[number]

interface CategoryIconProps extends React.SVGAttributes<SVGSVGElement> {
  category: string
  size?: number
}

export function CategoryIcon({ category, size = 16, strokeWidth = 2.2, ...rest }: CategoryIconProps) {
  const Icon = map[category] ?? MapPin
  return <Icon size={size} strokeWidth={strokeWidth} {...rest} />
}

// ─────────────────────────────────────────────────────────────────────────
// EMOJI INFERENCE — pick a contextual emoji from a listing's title + body.
// Order matters: more specific keywords first, generic fall-throughs last.
// Used by both the scraper (server-side) and SubmitForm (client-side hint).
// ─────────────────────────────────────────────────────────────────────────

const EMOJI_RULES: Array<[RegExp, string]> = [
  // Specific event types
  [/\b(pottery|ceram(ic|ist)|clay)\b/i,                                '🏺'],
  [/\b(market|marketplace|flea\s*market|bazaar|swap\s*meet|vendor)\b/i, '🛒'],
  [/\b(comedy|standup|stand-?up|open\s*mic|improv|sketch)\b/i,         '😂'],
  [/\b(vintage|thrift|secondhand|second-?hand|estate\s*sale)\b/i,      '👗'],
  [/\b(makers?\s*fair|maker\s*market|maker)\b/i,                        '📦'],
  [/\b(craft|knit(ting)?|sewing|embroidery|crochet|weaving)\b/i,        '✂️'],
  [/\b(zine|print|risograph|riso|letterpress|silk\s*screen|screen\s*print)\b/i, '🖨️'],
  [/\b(music|concert|dj|band|jazz|opera|symphony|orchestra|choir|live\s*music|gig)\b/i, '🎵'],
  [/\b(dance|salsa|tango|disco|rave)\b/i,                               '💃'],
  [/\b(film|movie|screening|cinema|premiere)\b/i,                       '🎬'],
  [/\b(art|gallery|painting|sculpt|exhibition|exhibit|opening)\b/i,     '🎨'],
  [/\b(book|reading|poetry|author|literature|library|zine\s*release)\b/i, '📖'],
  [/\b(workshop|class|lesson|course|seminar)\b/i,                       '🛠️'],
  [/\b(repair\s*caf|fix-?it|bike\s*repair)\b/i,                         '🔧'],
  [/\b(yoga|meditation|qigong|tai\s*chi|breathwork)\b/i,                '🧘'],
  [/\b(pizza|tacos?|burrito|dim\s*sum|sushi|ramen)\b/i,                 '🍕'],
  [/\b(brunch|breakfast|lunch|dinner|supper)\b/i,                       '🍳'],
  [/\b(coffee|caf[eé]|espresso|latte)\b/i,                              '☕'],
  [/\b(beer|brewery|happy\s*hour|wine|tasting|cocktail)\b/i,            '🍺'],
  [/\b(food|snack|catering|leftover|free\s*food|free\s*meal)\b/i,       '🍱'],
  [/\b(party|festival|celebration|fest\b|fiesta|gala|carnival)\b/i,     '🎉'],
  [/\b(panel|talk|lecture|conference|symposium|keynote)\b/i,            '🎤'],
  [/\b(tour|walking\s*tour|history\s*walk)\b/i,                         '🚶'],
  [/\b(bike|biking|cycling|cyclist)\b/i,                                '🚲'],
  [/\b(haircut|salon|beauty|nail|barber)\b/i,                           '💇'],
  [/\b(vaccin|flu\s*shot|clinic|health\s*screening|blood\s*drive)\b/i,  '💉'],
  [/\b(legal|lawyer|attorney|tenant|housing)\b/i,                       '⚖️'],
  [/\b(garden|gardening|compost|seed)\b/i,                              '🌱'],
]

export function inferEmoji(
  title?: string | null,
  description?: string | null,
  category?: string | null
): string {
  const text = `${title ?? ''} ${description ?? ''}`
  for (const [re, emoji] of EMOJI_RULES) {
    if (re.test(text)) return emoji
  }
  // Default
  if (category === 'Events') return '📅'
  return '✿'
}

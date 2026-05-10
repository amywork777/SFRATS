// Run after applying database/add-emoji-column.sql to populate emoji
// on existing rows that don't have one yet.
//
// Usage:
//   SUPABASE_URL=… SUPABASE_ANON_KEY=… node scripts/backfill-emoji.mjs

const URL = process.env.SUPABASE_URL || 'https://uflkltmvzvhziysheccd.supabase.co'
const KEY = process.env.SUPABASE_ANON_KEY
if (!KEY) {
  console.error('Set SUPABASE_ANON_KEY env var (your project anon key).')
  process.exit(1)
}
const REST = `${URL}/rest/v1/items`
const HEAD = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }

const RULES = [
  [/\b(pottery|ceram(ic|ist)|clay)\b/i, '🏺'],
  [/\b(market|marketplace|flea\s*market|bazaar|swap\s*meet|vendor)\b/i, '🛒'],
  [/\b(comedy|standup|stand-?up|open\s*mic|improv|sketch)\b/i, '😂'],
  [/\b(vintage|thrift|secondhand|second-?hand|estate\s*sale)\b/i, '👗'],
  [/\b(makers?\s*fair|maker\s*market|maker)\b/i, '📦'],
  [/\b(craft|knit(ting)?|sewing|embroidery|crochet|weaving)\b/i, '✂️'],
  [/\b(zine|print|risograph|riso|letterpress|silk\s*screen|screen\s*print)\b/i, '🖨️'],
  [/\b(music|concert|dj|band|jazz|opera|symphony|orchestra|choir|live\s*music|gig)\b/i, '🎵'],
  [/\b(dance|salsa|tango|disco|rave)\b/i, '💃'],
  [/\b(film|movie|screening|cinema|premiere)\b/i, '🎬'],
  [/\b(art|gallery|painting|sculpt|exhibition|exhibit|opening)\b/i, '🎨'],
  [/\b(book|reading|poetry|author|literature|library|zine\s*release)\b/i, '📖'],
  [/\b(workshop|class|lesson|course|seminar)\b/i, '🛠️'],
  [/\b(repair\s*caf|fix-?it|bike\s*repair)\b/i, '🔧'],
  [/\b(yoga|meditation|qigong|tai\s*chi|breathwork)\b/i, '🧘'],
  [/\b(pizza|tacos?|burrito|dim\s*sum|sushi|ramen)\b/i, '🍕'],
  [/\b(brunch|breakfast|lunch|dinner|supper)\b/i, '🍳'],
  [/\b(coffee|caf[eé]|espresso|latte)\b/i, '☕'],
  [/\b(beer|brewery|happy\s*hour|wine|tasting|cocktail)\b/i, '🍺'],
  [/\b(food|snack|catering|leftover|free\s*food|free\s*meal)\b/i, '🍱'],
  [/\b(party|festival|celebration|fest\b|fiesta|gala|carnival)\b/i, '🎉'],
  [/\b(panel|talk|lecture|conference|symposium|keynote)\b/i, '🎤'],
  [/\b(tour|walking\s*tour|history\s*walk)\b/i, '🚶'],
  [/\b(bike|biking|cycling|cyclist)\b/i, '🚲'],
  [/\b(haircut|salon|beauty|nail|barber)\b/i, '💇'],
  [/\b(vaccin|flu\s*shot|clinic|health\s*screening|blood\s*drive)\b/i, '💉'],
  [/\b(legal|lawyer|attorney|tenant|housing)\b/i, '⚖️'],
  [/\b(furniture|couch|sofa|chair|table|desk|dresser|shelv|bookcase)\b/i, '🛋️'],
  [/\b(plant|succulent|cactus|monstera|cutting)\b/i, '🪴'],
  [/\b(garden|gardening|compost|seed)\b/i, '🌱'],
  [/\b(books?\s*(for|free)|free\s*books?)\b/i, '📚'],
  [/\b(clothes|clothing|shirt|jacket|dress|shoes)\b/i, '👕'],
  [/\b(electronics?|laptop|monitor|cable|kitchen|appliance)\b/i, '🔌'],
  [/\b(curb\s*alert|sidewalk\s*score|free\s*pile|free\s*stuff)\b/i, '🚮'],
]

function infer(title = '', description = '', category = '') {
  const t = `${title} ${description}`
  for (const [re, e] of RULES) if (re.test(t)) return e
  if (category === 'Events') return '📅'
  if (category === 'Items')  return '📦'
  return '✿'
}

const rows = await (await fetch(`${REST}?select=id,title,description,category,emoji&emoji=is.null`, { headers: HEAD })).json()
console.log('rows missing emoji:', rows.length)
let touched = 0
for (const r of rows) {
  const e = infer(r.title, r.description, r.category)
  const res = await fetch(`${REST}?id=eq.${r.id}`, {
    method: 'PATCH', headers: HEAD,
    body: JSON.stringify({ emoji: e }),
  })
  if (res.ok) { touched++; console.log(`  ${r.id} → ${e}  ${(r.title || '').slice(0, 60)}`) }
  else        console.error(`  ${r.id} FAILED status=${res.status}`)
}
console.log(`backfilled ${touched}`)

import type { DbItem } from '../types/supabase'

// Decode imported feed text in a detached text-only element. Render the result
// as React text, never HTML; the original database record remains unchanged.
export function displayText(value: string | null | undefined): string {
  let text = value || ''
  const decoder = document.createElement('textarea')
  for (let pass = 0; pass < 2; pass++) {
    decoder.innerHTML = text.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    text = decoder.value
  }
  return text.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<\/?[a-z][^>]*>/gi, ' ').replace(/\s+/g, ' ').trim()
}

export function displayItem(item: DbItem): DbItem {
  return { ...item, title: displayText(item.title), description: displayText(item.description) }
}

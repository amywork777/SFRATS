import { Package, Pizza, PartyPopper, Wrench, MapPin, type LucideIcon } from 'lucide-react'

const map: Record<string, LucideIcon> = {
  Items:    Package,
  Food:     Pizza,
  Events:   PartyPopper,
  Services: Wrench,
}

export const CATEGORY_ORDER = ['Items', 'Food', 'Events', 'Services'] as const
export type Category = typeof CATEGORY_ORDER[number]

interface CategoryIconProps extends React.SVGAttributes<SVGSVGElement> {
  category: string
  size?: number
}

export function CategoryIcon({ category, size = 16, strokeWidth = 2.2, ...rest }: CategoryIconProps) {
  const Icon = map[category] ?? MapPin
  return <Icon size={size} strokeWidth={strokeWidth} {...rest} />
}

// Used by Leaflet's L.divIcon, which only takes raw HTML strings.
// Keep paths in sync with lucide-react. Source: https://lucide.dev
const RAW_SVG_PATHS: Record<string, string> = {
  Items:
    '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="m7.5 4.27 9 5.15"/>',
  Food:
    '<path d="M15 11h.01"/><path d="M11 15h.01"/><path d="M16 16h.01"/><path d="m2 16 20 6-6-20A20 20 0 0 0 2 16"/><path d="M5.71 17.11a17.04 17.04 0 0 1 11.4-11.4"/>',
  Events:
    '<path d="M5.8 11.3 2 22l10.7-3.79"/><path d="M4 3h.01"/><path d="M22 8h.01"/><path d="M15 2h.01"/><path d="M22 20h.01"/><path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10"/><path d="m22 13-1.99.75a2.9 2.9 0 0 1-3.08-2.06c-.27-.84-1.05-1.43-1.93-1.43h-.18c-.86 0-1.6-.6-1.76-1.44L13 8"/><path d="M18.42 9.61a5 5 0 1 1-7.93 6.16Z"/>',
  Services:
    '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  Default:
    '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
}

export function categoryIconSvg(category: string, color = 'currentColor', size = 18): string {
  const path = RAW_SVG_PATHS[category] ?? RAW_SVG_PATHS.Default
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`
}

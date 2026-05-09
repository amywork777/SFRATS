import { Package, PartyPopper, Pizza, Wrench, MapPin, type LucideIcon } from 'lucide-react'

// Two user-facing categories. Old data uses Food/Services — kept here in
// the lookup so historical rows still render with a sensible icon.
const map: Record<string, LucideIcon> = {
  Items:    Package,
  Events:   PartyPopper,
  Food:     Pizza,        // legacy — remapped to Items going forward
  Services: Wrench,       // legacy — remapped to Events going forward
}

export const CATEGORY_ORDER = ['Items', 'Events'] as const
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

/**
 * Teardrop map pin with the category icon embedded in the round part.
 * The SVG viewBox is 40×48 and the bottom tip sits at (20, 48), so the
 * caller's iconAnchor should point to the tip for proper geo-anchoring.
 */
export function categoryPinSvg(
  category: string,
  { fill = '#FF4F00', stroke = '#181613', height = 48 } = {}
): string {
  const path = RAW_SVG_PATHS[category] ?? RAW_SVG_PATHS.Default
  const width = Math.round(height * (40 / 48))
  // Icon positioning math:
  //   teardrop round part: center (20, 18), usable radius ~13
  //   icon source viewBox: 24×24, center (12, 12)
  //   scale 0.7 → 16.8 px icon, sits inside the round part with breathing room
  //   translate = center − 12*scale = (20 − 8.4, 18 − 8.4) = (11.6, 9.6)
  return `
    <svg width="${width}" height="${height}" viewBox="0 0 40 48" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M20 0 C8.95 0 0 8.95 0 20 C0 32 14 42 20 48 C26 42 40 32 40 20 C40 8.95 31.05 0 20 0 Z"
        fill="${fill}" stroke="${stroke}" stroke-width="2.4" stroke-linejoin="round"/>
      <g transform="translate(11.6 9.6) scale(0.7)"
         fill="none" stroke="#ffffff" stroke-width="2.6"
         stroke-linecap="round" stroke-linejoin="round">${path}</g>
    </svg>
  `.trim()
}

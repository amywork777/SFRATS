import { MapPin } from 'lucide-react'
import NearMe from './NearMe'
import FilterDropdown from './FilterDropdown'

// "Near me" radius filter as a compact dropdown wrapping the existing NearMe
// control (geolocation + radius slider). The trigger shows the radius once a
// location is set.
export default function NearMeFilter({
  location,
  radiusMiles,
  onChange,
}: {
  location: { lat: number; lng: number } | null
  radiusMiles: number
  onChange: (next: { location: { lat: number; lng: number } | null; radiusMiles: number }) => void
}) {
  const active = !!location

  return (
    <FilterDropdown
      active={active}
      panelClassName="w-[240px] p-3"
      label={
        <span className="inline-flex items-center gap-1.5">
          <MapPin size={13} strokeWidth={2.2} />
          {active ? `${radiusMiles} mi` : 'Near me'}
        </span>
      }
    >
      <NearMe location={location} radiusMiles={radiusMiles} onChange={onChange} />
    </FilterDropdown>
  )
}

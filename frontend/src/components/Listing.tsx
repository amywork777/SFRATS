import InterestButton from './InterestButton'
import { DbItem } from '../types/supabase'
import { format } from 'date-fns'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useState } from 'react'
import { Pencil, ArrowUpRight } from 'lucide-react'
import EditListing from './EditListing'
import { api } from '../services/api'
import { inferEmoji } from '../utils/categoryIcons'

// Vite doesn't auto-bundle Leaflet's default marker assets, so we
// build our own divIcon with the listing's emoji — matches the main
// map's marker style.
const buildEmojiIcon = (glyph: string) =>
  L.divIcon({
    className: 'custom-marker',
    html: `<div class="marker-pin"><span class="marker-emoji">${glyph}</span></div>`,
    iconSize: [56, 56],
    iconAnchor: [28, 28],
  })

interface ListingProps {
  listing: DbItem;
  onRefresh?: () => void;
}

export default function Listing({ listing: initialListing, onRefresh }: ListingProps) {
  const [listing, setListing] = useState(initialListing)
  const [showEditModal, setShowEditModal] = useState(false)

  const fetchItem = async () => {
    try {
      const updated = await api.getItem(listing.id.toString())
      setListing(updated)
      onRefresh?.()
    } catch (err) {
      console.error('Error fetching item:', err)
    }
  }

  const formatDate = (date: string | Date) =>
    format(new Date(date), 'MMM d, yyyy · h:mm a')

  const statusLabel = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

  return (
    <div className="space-y-8 p-4 md:p-8 max-w-3xl mx-auto relative">
      {/* Title block */}
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-11 h-11 text-[24px] bg-paper border border-ink/30 leading-none">
            {listing.emoji || inferEmoji(listing.title, listing.description, listing.category)}
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-mute">
            {listing.category}
          </span>
        </div>
        <h1 className="font-display font-black text-4xl md:text-5xl leading-[1.0] tracking-tight text-ink">
          {listing.title}
        </h1>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="stamp text-bridge-600">
            {statusLabel(listing.status)}
          </span>
          <InterestButton
            itemId={listing.id}
            initialCount={listing.interest_count}
          />
        </div>
        <div className="rule-thick" />
      </header>

      {/* Description */}
      {listing.description && (
        <section>
          <span className="label">Notes</span>
          <p className="mt-2 font-display text-[19px] leading-[1.55] text-ink-soft whitespace-pre-wrap">
            {listing.description}
          </p>
        </section>
      )}

      {/* Location */}
      <section>
        <span className="label">Where</span>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1 bg-paper-light border-2 border-ink p-4 space-y-3">
            <p className="text-[14px] leading-snug text-ink">
              {listing.location_address || 'No address provided.'}
            </p>
            {listing.location_lat && listing.location_lng && (
              <a
                href={`https://www.google.com/maps?q=${listing.location_lat},${listing.location_lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-bridge-600 hover:text-bridge-700 underline underline-offset-4 decoration-2"
              >
                Open in Google Maps <ArrowUpRight size={12} strokeWidth={2.5} />
              </a>
            )}
          </div>
          {listing.location_lat && listing.location_lng && (
            <div className="md:col-span-2 h-[220px] border-2 border-ink overflow-hidden relative z-0">
              <MapContainer
                center={[listing.location_lat, listing.location_lng]}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  attribution='&copy; OSM &copy; CARTO'
                  subdomains="abcd"
                  detectRetina
                />
                <Marker
                  position={[listing.location_lat, listing.location_lng]}
                  icon={buildEmojiIcon(listing.emoji || inferEmoji(listing.title, listing.description, listing.category))}
                />
              </MapContainer>
            </div>
          )}
        </div>
      </section>

      {/* Details grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-paper-light border-2 border-ink p-4 space-y-1">
          <span className="label">When</span>
          <p className="font-mono text-[12px] uppercase tracking-[0.08em] text-ink mt-1">
            From&nbsp;&nbsp;{formatDate(listing.available_from)}
          </p>
          {listing.available_until && (
            <p className="font-mono text-[12px] uppercase tracking-[0.08em] text-ink">
              Until&nbsp;{formatDate(listing.available_until)}
            </p>
          )}
        </div>

        <div className="bg-paper-light border-2 border-ink p-4 space-y-1">
          <span className="label">Posted by</span>
          <p className="font-display text-[15px] text-ink mt-1">
            {listing.posted_by || 'Anonymous'}
          </p>
          {listing.contact_info && (
            <p className="font-mono text-[11px] tracking-[0.05em] text-ink-mute">
              {listing.contact_info}
            </p>
          )}
        </div>

        {listing.url && (
          <div className="md:col-span-2 bg-paper-light border-2 border-ink p-4">
            <span className="label">Link</span>
            <div className="mt-1">
              <a
                href={listing.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[12px] text-bridge-600 hover:text-bridge-700 break-all underline underline-offset-4 decoration-2"
              >
                {listing.url}
              </a>
            </div>
          </div>
        )}
      </section>

      {/* Images */}
      {listing.images && listing.images.length > 0 && (
        <section>
          <span className="label">Photos</span>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            {listing.images.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`${listing.title} — ${i + 1}`}
                className="w-full h-64 object-cover border-2 border-ink"
              />
            ))}
          </div>
        </section>
      )}

      {/* Edit */}
      <div className="rule-thick pt-5">
        <button
          onClick={() => setShowEditModal(true)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-paper-light border border-ink px-4 py-3 sm:py-2 font-mono text-[12px] sm:text-[11px] uppercase tracking-[0.14em] font-semibold text-ink shadow-stamp hover:bg-paper hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_rgba(24,22,19,1)] transition-all"
        >
          <Pencil size={14} strokeWidth={2.2} /> Edit listing
        </button>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 z-[9999]">
          <EditListing
            item={listing}
            onClose={() => setShowEditModal(false)}
            onSave={() => { fetchItem(); setShowEditModal(false) }}
          />
        </div>
      )}

      <div className="h-12" />
    </div>
  )
}

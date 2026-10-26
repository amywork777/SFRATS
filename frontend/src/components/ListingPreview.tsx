import { formatEventWhen, stripTimeTba } from '../utils/timeTba'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Pencil, Share2, Map as MapIcon, Check, ArrowRight } from 'lucide-react'
import EditListing from './EditListing'
import AddToCalendar from './AddToCalendar'
import { EventIcon, eventEmoji } from './EventIcon'
import { eventType } from '../utils/eventTypes'

interface ListingPreviewProps {
  id: number
  title: string
  description: string
  category: string
  emoji?: string | null
  location_address?: string
  location_lat?: number
  location_lng?: number
  available_from?: string | Date | null
  available_until?: string | Date | null
  created_at: string
  showDirections?: boolean
  showActions?: boolean
  inPopup?: boolean
  onViewDetails?: () => void
  showCategory?: boolean
  showTimestamp?: boolean
  onRefresh?: () => void
  item?: any
}

function ListingPreview({
  id,
  title,
  description,
  category,
  emoji,
  location_address,
  location_lat,
  location_lng,
  available_from,
  showDirections = true,
  showActions = true,
  inPopup = false,
  onViewDetails,
  onRefresh,
  item,
  available_until,
  created_at,
}: ListingPreviewProps) {
  const type = eventType({ emoji, title, description, category: category as any })
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const url = `${window.location.origin}/listing/${id}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleViewDetails = () => {
    if (inPopup && onViewDetails) onViewDetails()
    else navigate(`/listing/${id}`)
  }

  const openInGoogleMaps = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!location_lat || !location_lng) return
    window.open(`https://www.google.com/maps?q=${location_lat},${location_lng}`, '_blank')
  }

  return (
    <div className="listing-preview-card space-y-3 w-[260px]">
      {/* Category stamp + title */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="inline-flex items-center justify-center w-8 h-8 text-[18px] bg-paper-light border border-ink/30 leading-none">
            <EventIcon type={type} emoji={eventEmoji({ emoji, title, description, category: category as any })} />
          </span>
          <span className="font-sans text-[10px] uppercase tracking-[0.16em] text-ink-mute">
            {category}
          </span>
        </div>
        <h3 className="font-display font-bold text-[18px] leading-tight text-ink">
          {title}
        </h3>
      </div>

      {/* Description */}
      {description && (
        <p className="text-[13px] leading-snug text-ink-soft line-clamp-3">
          {stripTimeTba(description)}
        </p>
      )}

      <div className="rule-hair" />

      {/* Metadata */}
      <div className="space-y-1 font-sans text-[11px] uppercase tracking-[0.08em] text-ink-mute">
        {location_address && (
          <div className="flex items-start gap-1.5">

            <span className="truncate flex-1">{location_address}</span>
          </div>
        )}
        <div className="flex items-start gap-1.5">

          <span>{formatEventWhen(available_from, description)}</span>
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="pt-2 space-y-2">
          {category === 'Events' && available_from && (
            <AddToCalendar
              title={title}
              description={description}
              location={location_address}
              startsAt={available_from}
              endsAt={available_until}
              url={typeof window !== 'undefined' ? `${window.location.origin}/listing/${id}` : undefined}
              variant="primary"
              fullWidth
              dropUp
            />
          )}
          <div className="flex gap-2">
            <button
              onClick={handleViewDetails}
              className="flex-1 inline-flex items-center justify-center gap-1.5 bg-ink text-paper-light px-3 py-2.5 sm:py-1.5 border border-ink font-sans text-[11px] sm:text-[10px] uppercase tracking-[0.14em] font-semibold hover:bg-bridge-500 transition-colors"
            >
              Open <ArrowRight size={12} strokeWidth={2.5} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setShowEditModal(true) }}
              className="px-3 sm:px-2 py-2.5 sm:py-1.5 bg-paper-light text-ink border border-ink hover:bg-paper transition-colors"
              title="Edit listing"
              aria-label="Edit listing"
            >
              <Pencil size={14} strokeWidth={2.2} />
            </button>
            <button
              onClick={handleShare}
              className="px-3 sm:px-2 py-2.5 sm:py-1.5 bg-paper-light text-ink border border-ink hover:bg-paper transition-colors"
              title="Copy link"
              aria-label="Copy link"
            >
              {copied ? <Check size={14} strokeWidth={2.5} /> : <Share2 size={14} strokeWidth={2.2} />}
            </button>
            {showDirections && location_lat && location_lng && (
              <button
                onClick={openInGoogleMaps}
                className="px-3 sm:px-2 py-2.5 sm:py-1.5 bg-paper-light text-ink border border-ink hover:bg-paper transition-colors"
                title="Open in Google Maps"
                aria-label="Open in Google Maps"
              >
                <MapIcon size={14} strokeWidth={2.2} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Edit modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[100]">
          <EditListing
            item={{
              ...item,
              id, title, description, category,
              location_address: location_address || '',
              location_lat: location_lat || 0,
              location_lng: location_lng || 0,
              available_from, available_until, created_at,
              status: item?.status || 'available',
              edit_code: item?.edit_code || '__legacy__',
              contact_info: item?.contact_info || '',
              url: item?.url || '',
              images: item?.images || [],
              interest_count: item?.interest_count || 0,
            }}
            onClose={() => setShowEditModal(false)}
            onSave={() => { onRefresh?.(); setShowEditModal(false) }}
          />
        </div>
      )}

    </div>
  )
}

export default ListingPreview

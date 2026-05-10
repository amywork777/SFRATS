import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Pencil, Share2, Map as MapIcon, Check, ArrowRight } from 'lucide-react'
import EditListing from './EditListing'
import { inferEmoji } from '../utils/categoryIcons'

interface ListingPreviewProps {
  id: number
  title: string
  description: string
  category: string
  emoji?: string | null
  location_address?: string
  location_lat?: number
  location_lng?: number
  available_from: Date
  available_until: Date | null
  created_at: string
  showDirections?: boolean
  showActions?: boolean
  inPopup?: boolean
  onViewDetails?: () => void
  showCategory?: boolean
  showTimestamp?: boolean
  onRefresh?: () => void
  item?: any
  edit_code?: string
  isNewListing?: boolean
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
  edit_code,
  isNewListing = false,
  available_until,
  created_at,
}: ListingPreviewProps) {
  const glyph = emoji || inferEmoji(title, description, category)
  const navigate = !inPopup ? useNavigate() : null
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
    else if (navigate) navigate(`/listing/${id}`)
  }

  const openInGoogleMaps = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!location_lat || !location_lng) return
    window.open(`https://www.google.com/maps?q=${location_lat},${location_lng}`, '_blank')
  }

  return (
    <div className="space-y-3 w-[260px]">
      {/* Category stamp + title */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="inline-flex items-center justify-center w-8 h-8 text-[18px] bg-paper-light border border-ink/30 leading-none">
            {glyph}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-mute">
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
          {description}
        </p>
      )}

      <div className="rule-hair" />

      {/* Metadata */}
      <div className="space-y-1 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-mute">
        {location_address && (
          <div className="flex items-start gap-1.5">
            <span className="text-bridge-500">▸</span>
            <span className="truncate flex-1">{location_address}</span>
          </div>
        )}
        <div className="flex items-start gap-1.5">
          <span className="text-bridge-500">▸</span>
          <span>{format(new Date(available_from), 'MMM d · h:mm a')}</span>
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleViewDetails}
            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-ink text-paper-light px-3 py-1.5 border border-ink font-mono text-[10px] uppercase tracking-[0.14em] font-semibold hover:bg-bridge-500 transition-colors"
          >
            Open <ArrowRight size={11} strokeWidth={2.5} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setShowEditModal(true) }}
            className="px-2 py-1.5 bg-paper-light text-ink border border-ink hover:bg-paper transition-colors"
            title="Edit listing"
            aria-label="Edit listing"
          >
            <Pencil size={13} strokeWidth={2.2} />
          </button>
          <button
            onClick={handleShare}
            className="px-2 py-1.5 bg-paper-light text-ink border border-ink hover:bg-paper transition-colors"
            title="Copy link"
            aria-label="Copy link"
          >
            {copied ? <Check size={13} strokeWidth={2.5} /> : <Share2 size={13} strokeWidth={2.2} />}
          </button>
          {showDirections && location_lat && location_lng && (
            <button
              onClick={openInGoogleMaps}
              className="px-2 py-1.5 bg-paper-light text-ink border border-ink hover:bg-paper transition-colors"
              title="Open in Google Maps"
              aria-label="Open in Google Maps"
            >
              <MapIcon size={13} strokeWidth={2.2} />
            </button>
          )}
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
              edit_code: item?.edit_code || '',
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

      {/* Edit code reveal for newly-submitted listings */}
      {isNewListing && edit_code && (
        <div className="mt-2 p-3 bg-paper border border-ink">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink mb-2">
            Save this edit code
          </p>
          <div className="flex justify-between items-center bg-paper-light border border-ink p-2">
            <code className="font-mono text-[14px] text-ink">{edit_code}</code>
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(edit_code)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-bridge-600 hover:text-bridge-700 inline-flex items-center gap-1.5"
            >
              {copied ? <><Check size={11} strokeWidth={2.5}/> Copied</> : 'Copy'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ListingPreview

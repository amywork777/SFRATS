import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { customAlphabet } from 'nanoid'
import LocationPicker from './LocationPicker'
import { api } from '../services/api'
import { DbItem } from '../types/supabase'
import { supabase } from '../utils/supabase'

interface SubmitFormProps {
  initialData?: Partial<DbItem>
  editMode?: boolean
  editCode?: string
  onClose?: () => void
}

interface FormData {
  location_lat: number
  location_lng: number
  title: string
  description: string
  category: string
  location_address: string
  available_from: string
  available_until: string | null
  url: string
  posted_by: string
  contact_info: string
  edit_code: string
  status: 'available' | 'gone' | 'pending'
}

const CATEGORIES = ['Items', 'Food', 'Events', 'Services'] as const
const categoryEmojis: Record<string, string> = {
  Items: '📦', Food: '🍕', Events: '🎉', Services: '🔧',
}

const inputCls =
  'w-full bg-paper-light border-2 border-ink px-3 py-2 font-sans text-[14px] text-ink placeholder:text-ink-fade outline-none focus:shadow-[2px_2px_0_0_rgba(24,22,19,1)] transition-shadow'

// Drop confusing chars (0/O/1/I/L) so users reading codes aloud don't fumble.
const codeAlphabet = customAlphabet('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 8)
function generateEditCode() {
  const raw = codeAlphabet()
  return `${raw.slice(0, 4)}-${raw.slice(4)}`
}

function SubmitForm({ initialData, editMode = false, editCode, onClose }: SubmitFormProps) {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submittedItem, setSubmittedItem] = useState<DbItem | null>(null)
  const [moreOpen, setMoreOpen] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)

  const initialEditCode = useMemo(
    () => editCode || generateEditCode(),
    [editCode]
  )

  const [formData, setFormData] = useState<FormData>({
    location_lat: (initialData as any)?.location_lat ?? 0,
    location_lng: (initialData as any)?.location_lng ?? 0,
    title: initialData?.title || '',
    description: initialData?.description || '',
    category: initialData?.category || 'Items',
    location_address: initialData?.location_address || '',
    available_from: initialData?.available_from || new Date().toISOString(),
    available_until: initialData?.available_until || null,
    url: initialData?.url || '',
    posted_by: initialData?.posted_by || '',
    contact_info: initialData?.contact_info || '',
    edit_code: initialEditCode,
    status: (initialData?.status as any) || 'available',
  })

  const [existingImages, setExistingImages] = useState<string[]>(initialData?.images || [])
  const [images, setImages] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setFormData(prev => ({ ...prev, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      // Image uploads
      const newImageUrls: string[] = []
      for (const image of images) {
        const fileName = `${Date.now()}-${image.name}`
        const { data, error } = await supabase.storage
          .from('item-images')
          .upload(fileName, image, {
            cacheControl: '3600',
            upsert: false,
            onUploadProgress: (p: any) => setUploadProgress((p.loaded / p.total) * 100),
          } as any)
        if (error) throw error
        const { data: { publicUrl } } = supabase.storage.from('item-images').getPublicUrl(data.path)
        newImageUrls.push(publicUrl)
      }

      const submitData = { ...formData, images: [...existingImages, ...newImageUrls] }

      if (!submitData.title.trim()) throw new Error('Add a title — even a short one.')
      if (!submitData.location_lat || !submitData.location_lng || !submitData.location_address)
        throw new Error('Pick a location on the map or search for an address.')

      let data: DbItem
      if (editMode && initialData?.id) {
        data = await api.updateItem(initialData.id.toString(), editCode || '', submitData as any) as any
      } else {
        data = await api.createItem(submitData as any)
        // Save the auto-generated code to localStorage so the user can find it later on the same device
        try {
          const saved = JSON.parse(localStorage.getItem('sfrats:edit-codes') || '{}')
          saved[String((data as any).id)] = submitData.edit_code
          localStorage.setItem('sfrats:edit-codes', JSON.stringify(saved))
        } catch {/* ignore quota errors */}
      }

      if (editMode && onClose) {
        onClose()
        return
      }
      setSubmittedItem(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit listing')
    } finally {
      setSubmitting(false)
    }
  }

  // ──────────── SUCCESS SCREEN ────────────
  if (submittedItem) {
    const code = formData.edit_code
    return (
      <div className="space-y-7">
        <div>
          <span className="label text-bridge-600">✓ Posted</span>
          <h2 className="font-display font-black text-5xl md:text-6xl text-ink leading-[0.95] mt-2 tracking-tight">
            Listing live<span className="serif-wonk text-bridge-500 italic font-normal">.</span>
          </h2>
          <p className="font-display text-[18px] leading-snug text-ink-soft mt-3">
            Your post is on the map. Anyone in San Francisco can see it now.
          </p>
        </div>

        <div className="rule-thick" />

        {/* Edit code reveal — the most important info */}
        <div className="bg-paper-light border-2 border-ink shadow-stamp p-5">
          <span className="label">Save this edit code</span>
          <p className="text-[13px] text-ink-soft mt-1">
            You'll need it if you want to update or remove the listing later.
            We've saved it on this browser, but copy it somewhere safe — like a note on your phone.
          </p>
          <div className="mt-4 flex items-center justify-between gap-3 bg-paper border-2 border-ink px-4 py-3">
            <code className="font-mono text-[20px] tracking-[0.18em] text-ink select-all">
              {code}
            </code>
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(code)
                setCopiedCode(true)
                setTimeout(() => setCopiedCode(false), 2000)
              }}
              className="bg-ink text-paper-light border-2 border-ink px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] font-semibold hover:bg-bridge-500 transition-colors"
            >
              {copiedCode ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/')}
            className="bg-bridge-500 text-paper-light border-2 border-ink shadow-stamp px-5 py-3 font-mono text-[12px] uppercase tracking-[0.14em] font-semibold hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_rgba(24,22,19,1)] transition-all"
          >
            See it on the map →
          </button>
          <button
            onClick={() => {
              const fresh = generateEditCode()
              setSubmittedItem(null)
              setMoreOpen(false)
              setExistingImages([])
              setImages([])
              setFormData({
                location_lat: 0, location_lng: 0,
                title: '', description: '',
                category: 'Items', location_address: '',
                available_from: new Date().toISOString(),
                available_until: null,
                url: '', posted_by: '', contact_info: '',
                edit_code: fresh, status: 'available',
              })
            }}
            className="bg-paper-light text-ink border-2 border-ink shadow-stamp px-5 py-3 font-mono text-[12px] uppercase tracking-[0.14em] font-semibold hover:bg-paper hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_rgba(24,22,19,1)] transition-all"
          >
            + Post another
          </button>
        </div>
      </div>
    )
  }

  // ──────────── FORM ────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      {/* ESSENTIAL: TITLE */}
      <label className="block">
        <span className="label">What is it?</span>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => update('title', e.target.value)}
          className={`mt-1.5 ${inputCls} font-display text-[20px]`}
          placeholder="Free couch, must take today"
          autoFocus
          required
        />
      </label>

      {/* ESSENTIAL: CATEGORY (small chips, picks the marker icon) */}
      <div>
        <span className="label">Type</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {CATEGORIES.map((c, i) => {
            const active = formData.category === c
            const tilt = ['rotate-[-1.5deg]', 'rotate-[1deg]', 'rotate-[-0.5deg]', 'rotate-[1.5deg]'][i % 4]
            return (
              <button
                key={c}
                type="button"
                onClick={() => update('category', c)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-ink font-mono text-[11px] uppercase tracking-[0.12em] font-semibold transition ${tilt} ${
                  active
                    ? 'bg-bridge-500 text-paper-light shadow-stamp'
                    : 'bg-paper-light text-ink hover:bg-paper'
                }`}
              >
                <span className="text-[13px] leading-none">{categoryEmojis[c]}</span>
                {c}
              </button>
            )
          })}
        </div>
      </div>

      {/* ESSENTIAL: LOCATION */}
      <div>
        <span className="label">Where?</span>
        <div className="mt-2">
          <LocationPicker
            initialAddress={formData.location_address}
            initialLat={formData.location_lat}
            initialLng={formData.location_lng}
            onLocationSelected={(loc) => {
              update('location_address', loc.address)
              update('location_lat', loc.lat)
              update('location_lng', loc.lng)
            }}
          />
        </div>
      </div>

      {/* PROGRESSIVE DISCLOSURE: optional fields */}
      <div className="rule-hair pt-2">
        <button
          type="button"
          onClick={() => setMoreOpen(v => !v)}
          className="w-full flex items-center justify-between py-2 group"
        >
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-mute group-hover:text-ink transition-colors">
            {moreOpen ? '— Hide details' : '+ Add description, photos, dates, link'}
          </span>
          <span className="font-mono text-[10px] text-ink-fade">
            {moreOpen ? 'optional' : 'all optional'}
          </span>
        </button>

        {moreOpen && (
          <div className="space-y-6 pt-4">
            {/* Description */}
            <label className="block">
              <span className="label">Description</span>
              <textarea
                value={formData.description}
                onChange={(e) => update('description', e.target.value)}
                rows={3}
                className={`mt-1.5 ${inputCls}`}
                placeholder="Comfy 3-seater, has a small tear on the arm…"
              />
            </label>

            {/* Photos */}
            <div>
              <span className="label">Photos</span>

              {existingImages.length > 0 && (
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {existingImages.map((url, i) => (
                    <div key={url} className="relative aspect-square">
                      <img src={url} alt={`Existing ${i + 1}`} className="w-full h-full object-cover border-2 border-ink" />
                      <button
                        type="button"
                        onClick={() => setExistingImages(prev => prev.filter(u => u !== url))}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-bridge-500 text-paper-light border-2 border-ink font-mono text-[12px] flex items-center justify-center"
                        aria-label="Remove image"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <label className="block mt-2 cursor-pointer border-2 border-dashed border-ink/40 hover:border-ink py-3 px-3 text-center bg-paper-light transition-colors">
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink">
                  + Drop or pick images
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => e.target.files && setImages(prev => [...prev, ...Array.from(e.target.files!)])}
                  className="hidden"
                />
              </label>

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-2 w-full h-2 bg-paper-dark border border-ink">
                  <div className="h-full bg-bridge-500" style={{ width: `${uploadProgress}%` }} />
                </div>
              )}

              {images.length > 0 && (
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {images.map((image, i) => (
                    <div key={i} className="relative aspect-square">
                      <img src={URL.createObjectURL(image)} alt={`New ${i + 1}`} className="w-full h-full object-cover border-2 border-ink" />
                      <button
                        type="button"
                        onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-bridge-500 text-paper-light border-2 border-ink font-mono text-[12px] flex items-center justify-center"
                        aria-label="Remove image"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="label">Available From</span>
                <input
                  type="datetime-local"
                  value={formData.available_from.slice(0, 16)}
                  onChange={(e) => update('available_from', e.target.value)}
                  className={`mt-1.5 ${inputCls} font-mono`}
                />
              </label>
              <label className="block">
                <span className="label">Available Until</span>
                <input
                  type="datetime-local"
                  value={formData.available_until?.slice(0, 16) || ''}
                  onChange={(e) => update('available_until', e.target.value || null)}
                  className={`mt-1.5 ${inputCls} font-mono`}
                />
              </label>
            </div>

            {/* Link & contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="label">Link</span>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => update('url', e.target.value)}
                  className={`mt-1.5 ${inputCls} font-mono`}
                  placeholder="https://…"
                />
              </label>
              <label className="block">
                <span className="label">Contact</span>
                <input
                  type="text"
                  value={formData.contact_info}
                  onChange={(e) => update('contact_info', e.target.value)}
                  className={`mt-1.5 ${inputCls}`}
                  placeholder="How should people reach you?"
                />
              </label>
            </div>

            {/* Nickname */}
            <label className="block">
              <span className="label">Your Nickname</span>
              <input
                type="text"
                value={formData.posted_by}
                onChange={(e) => update('posted_by', e.target.value)}
                className={`mt-1.5 ${inputCls}`}
                placeholder="Anonymous"
              />
            </label>
          </div>
        )}
      </div>

      {error && (
        <div className="border-2 border-bridge-700 bg-bridge-50 p-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-bridge-700">⚠ </span>
          <span className="font-mono text-[12px] text-bridge-700">{error}</span>
        </div>
      )}

      {/* CTA */}
      <div className="rule-thick pt-5 sticky bottom-4 bg-paper">
        <button
          type="submit"
          disabled={submitting}
          className={`w-full bg-bridge-500 text-paper-light border-2 border-ink shadow-stamp py-3.5 px-4 font-mono text-[13px] uppercase tracking-[0.14em] font-semibold transition-all ${
            submitting
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_rgba(24,22,19,1)]'
          }`}
        >
          {submitting ? 'Posting…' : editMode ? 'Save Changes' : 'Post Listing'}
        </button>
        {!editMode && (
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-fade text-center mt-2">
            We'll auto-generate an edit code so you can manage it later.
          </p>
        )}
      </div>

      <div className="h-12 md:hidden" />
    </form>
  )
}

export default SubmitForm

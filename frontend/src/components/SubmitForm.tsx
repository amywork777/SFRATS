import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { customAlphabet } from 'nanoid'
import { Check, Plus, X, ArrowRight } from 'lucide-react'
import LocationPicker from './LocationPicker'
import { api } from '../services/api'
import { DbItem } from '../types/supabase'
import { supabase } from '../utils/supabase'
import { CATEGORY_ORDER } from '../utils/categoryIcons'

const CATEGORY_EMOJI: Record<string, string> = { Items: '📦', Events: '📅' }

interface SubmitFormProps {
  initialData?: Partial<DbItem>
  editMode?: boolean
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

const inputCls =
  'w-full bg-paper-light border-2 border-ink px-3 py-2 font-sans text-[14px] text-ink placeholder:text-ink-fade outline-none focus:shadow-[2px_2px_0_0_rgba(24,22,19,1)] transition-shadow'

// Hidden internal token — never shown to users. The DB column is NOT NULL,
// so we generate a unique value per submission. With open-edit (no edit
// code gate) it's effectively just an internal id we don't act on.
const codeAlphabet = customAlphabet('abcdefghjkmnpqrstuvwxyz23456789', 14)
const generateEditCode = () => 'web-' + codeAlphabet()

function SubmitForm({ initialData, editMode = false, onClose }: SubmitFormProps) {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submittedItem, setSubmittedItem] = useState<DbItem | null>(null)
  const [moreOpen, setMoreOpen] = useState(false)

  const initialEditCode = useMemo(() => generateEditCode(), [])

  const [formData, setFormData] = useState<FormData>({
    location_lat: (initialData as any)?.location_lat ?? 0,
    location_lng: (initialData as any)?.location_lng ?? 0,
    title: initialData?.title || '',
    description: initialData?.description || '',
    category: initialData?.category || 'Events',
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
        data = await api.updateItem(initialData.id.toString(), submitData as any) as any
      } else {
        data = await api.createItem(submitData as any)
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
    return (
      <div className="space-y-7">
        <div>
          <span className="label text-bridge-600 inline-flex items-center gap-1.5">
            <Check size={12} strokeWidth={2.5} /> Posted
          </span>
          <h2 className="font-display font-black text-5xl md:text-6xl text-ink leading-[0.95] mt-2 tracking-tight">
            Listing live<span className="serif-wonk text-bridge-500 italic font-normal">.</span>
          </h2>
          <p className="font-display text-[18px] leading-snug text-ink-soft mt-3">
            Your post is on the map. Anyone in San Francisco can see it now —
            and anyone can update or take it down when it's gone.
          </p>
        </div>

        <div className="rule-thick" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center justify-center gap-2 bg-bridge-500 text-paper-light border border-ink shadow-stamp px-5 py-3 font-mono text-[12px] uppercase tracking-[0.14em] font-semibold hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_rgba(24,22,19,1)] transition-all"
          >
            See it on the map <ArrowRight size={14} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => {
              setSubmittedItem(null)
              setMoreOpen(false)
              setExistingImages([])
              setImages([])
              setFormData({
                location_lat: 0, location_lng: 0,
                title: '', description: '',
                category: 'Events', location_address: '',
                available_from: new Date().toISOString(),
                available_until: null,
                url: '', posted_by: '', contact_info: '',
                edit_code: generateEditCode(), status: 'available',
              })
            }}
            className="inline-flex items-center justify-center gap-2 bg-paper-light text-ink border border-ink shadow-stamp px-5 py-3 font-mono text-[12px] uppercase tracking-[0.14em] font-semibold hover:bg-paper hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_rgba(24,22,19,1)] transition-all"
          >
            <Plus size={14} strokeWidth={2.5} /> Post another
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
          {CATEGORY_ORDER.map((c, i) => {
            const active = formData.category === c
            const tilt = ['rotate-[-1.5deg]', 'rotate-[1deg]', 'rotate-[-0.5deg]', 'rotate-[1.5deg]'][i % 4]
            return (
              <button
                key={c}
                type="button"
                onClick={() => update('category', c)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 border border-ink font-mono text-[11px] uppercase tracking-[0.12em] font-semibold transition ${tilt} ${
                  active
                    ? 'bg-bridge-500 text-paper-light shadow-stamp'
                    : 'bg-paper-light text-ink hover:bg-paper'
                }`}
              >
                <span className="text-[14px] leading-none">{CATEGORY_EMOJI[c] ?? '📍'}</span>
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
                        className="absolute -top-2 -right-2 w-6 h-6 bg-bridge-500 text-paper-light border border-ink flex items-center justify-center"
                        aria-label="Remove image"
                      >
                        <X size={12} strokeWidth={2.5} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <label className="block mt-2 cursor-pointer border-2 border-dashed border-ink/40 hover:border-ink py-4 px-3 text-center bg-paper-light transition-colors">
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink inline-flex items-center gap-2">
                  <Plus size={14} strokeWidth={2.5} /> Drop or pick images
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
                        className="absolute -top-2 -right-2 w-6 h-6 bg-bridge-500 text-paper-light border border-ink flex items-center justify-center"
                        aria-label="Remove image"
                      >
                        <X size={12} strokeWidth={2.5} />
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
            Posts are public · anyone can update or remove
          </p>
        )}
      </div>

      <div className="h-12 md:hidden" />
    </form>
  )
}

export default SubmitForm

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LocationPicker from './LocationPicker'
import { api } from '../services/api'
import { DbItem } from '../types/supabase'
import { supabase } from '../utils/supabase'
import ListingPreview from './ListingPreview'

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

function SubmitForm({ initialData, editMode = false, editCode, onClose }: SubmitFormProps) {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submittedItem, setSubmittedItem] = useState<DbItem | null>(null)

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
    edit_code: editCode || '',
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

      if (!submitData.title.trim()) throw new Error('Title is required')
      if (!submitData.description.trim()) throw new Error('Description is required')
      if (!submitData.location_lat || !submitData.location_lng || !submitData.location_address)
        throw new Error('Please pick a location on the map or search for an address')
      if (!editMode && !submitData.edit_code) throw new Error('Please enter an edit code')
      if (!editMode && submitData.edit_code.length < 6) throw new Error('Edit code must be at least 6 characters')
      if (!editMode && submitData.edit_code.length > 20) throw new Error('Edit code must be at most 20 characters')

      let data: DbItem
      if (editMode && initialData?.id) {
        data = await api.updateItem(initialData.id.toString(), editCode || '', submitData as any) as any
      } else {
        data = await api.createItem(submitData as any)
      }

      if (!editMode) navigate('/')
      else if (onClose) onClose()
      setSubmittedItem(data)
    } catch (err) {
      console.error('Error submitting form:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit listing')
    } finally {
      setSubmitting(false)
    }
  }

  // Success screen
  if (submittedItem) {
    return (
      <div className="space-y-6">
        <div>
          <span className="label text-bridge-600">✓ Posted</span>
          <h2 className="font-display font-black text-4xl md:text-5xl text-ink leading-[0.95] mt-2">
            Listing live<span className="serif-wonk text-bridge-500 italic font-normal">.</span>
          </h2>
          <p className="font-display text-[18px] leading-snug text-ink-soft mt-3">
            Save the edit code below if you want to update or remove this listing later.
          </p>
        </div>
        <div className="rule-thick" />
        <div className="bg-paper-light border-2 border-ink shadow-stamp p-5">
          <ListingPreview {...submittedItem} isNewListing showDirections={false} />
        </div>
        <button
          onClick={() => setSubmittedItem(null)}
          className="bg-ink text-paper-light border-2 border-ink shadow-stamp px-5 py-2.5 font-mono text-[12px] uppercase tracking-[0.14em] font-semibold hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_rgba(24,22,19,1)] transition-all"
        >
          Post another
        </button>
      </div>
    )
  }

  // Tailwind class shortcut for inputs
  const inputCls =
    'w-full bg-paper-light border-2 border-ink px-3 py-2 font-sans text-[14px] text-ink placeholder:text-ink-fade outline-none focus:shadow-[2px_2px_0_0_rgba(24,22,19,1)] transition-shadow'

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      {/* Title */}
      <label className="block">
        <span className="label">Title <span className="text-bridge-600">*</span></span>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => update('title', e.target.value)}
          className={`mt-1.5 ${inputCls} font-display text-[18px]`}
          placeholder="Free couch, must take today"
          required
        />
      </label>

      {/* Description */}
      <label className="block">
        <span className="label">Description <span className="text-bridge-600">*</span></span>
        <textarea
          value={formData.description}
          onChange={(e) => update('description', e.target.value)}
          rows={4}
          className={`mt-1.5 ${inputCls}`}
          placeholder="Comfy 3-seater, has a small tear on the arm…"
          required
        />
      </label>

      {/* Category — chip selector */}
      <div>
        <span className="label">Category <span className="text-bridge-600">*</span></span>
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

      {/* Location */}
      <div>
        <span className="label">Where <span className="text-bridge-600">*</span></span>
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
        {formData.location_address && (
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-mute">
            ▸ {formData.location_address}
          </p>
        )}
      </div>

      {/* When */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <span className="label">Available From <span className="text-bridge-600">*</span></span>
          <input
            type="datetime-local"
            value={formData.available_from.slice(0, 16)}
            onChange={(e) => update('available_from', e.target.value)}
            className={`mt-1.5 ${inputCls} font-mono`}
            required
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

      {/* URL + Contact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <span className="label">Link (optional)</span>
          <input
            type="url"
            value={formData.url}
            onChange={(e) => update('url', e.target.value)}
            className={`mt-1.5 ${inputCls} font-mono`}
            placeholder="https://…"
          />
        </label>
        <label className="block">
          <span className="label">Contact (optional)</span>
          <input
            type="text"
            value={formData.contact_info}
            onChange={(e) => update('contact_info', e.target.value)}
            className={`mt-1.5 ${inputCls}`}
            placeholder="How should people reach you?"
          />
        </label>
      </div>

      {/* Posted by + Edit code */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <span className="label">Your Nickname (optional)</span>
          <input
            type="text"
            value={formData.posted_by}
            onChange={(e) => update('posted_by', e.target.value)}
            className={`mt-1.5 ${inputCls}`}
            placeholder="Anonymous"
          />
        </label>
        {!editMode && (
          <label className="block">
            <span className="label">Edit Code <span className="text-bridge-600">*</span></span>
            <input
              type="text"
              value={formData.edit_code}
              onChange={(e) => update('edit_code', e.target.value)}
              className={`mt-1.5 ${inputCls} font-mono`}
              placeholder="6–20 chars; you'll need this to edit"
              required
              minLength={6}
              maxLength={20}
            />
          </label>
        )}
      </div>

      {/* Images */}
      <div>
        <span className="label">Photos (optional)</span>

        {existingImages.length > 0 && (
          <div className="mt-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-mute mb-2">Current</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {existingImages.map((url, i) => (
                <div key={url} className="relative">
                  <img src={url} alt={`Existing ${i + 1}`} className="w-full h-32 object-cover border-2 border-ink" />
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
          </div>
        )}

        <div className="mt-3">
          <label className="block w-full cursor-pointer border-2 border-dashed border-ink/40 hover:border-ink py-4 px-3 text-center bg-paper-light transition-colors">
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink">
              + Add images
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => e.target.files && setImages(prev => [...prev, ...Array.from(e.target.files!)])}
              className="hidden"
            />
          </label>
        </div>

        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mt-2 w-full h-2 bg-paper-dark border border-ink">
            <div className="h-full bg-bridge-500" style={{ width: `${uploadProgress}%` }} />
          </div>
        )}

        {images.length > 0 && (
          <div className="mt-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-mute mb-2">New</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {images.map((image, i) => (
                <div key={i} className="relative">
                  <img src={URL.createObjectURL(image)} alt={`New ${i + 1}`} className="w-full h-32 object-cover border-2 border-ink" />
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
          </div>
        )}
      </div>

      {error && (
        <div className="border-2 border-bridge-700 bg-bridge-50 p-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-bridge-700">⚠ Error · </span>
          <span className="font-mono text-[12px] text-bridge-700">{error}</span>
        </div>
      )}

      <div className="rule-thick pt-5">
        <button
          type="submit"
          disabled={submitting}
          className={`w-full bg-bridge-500 text-paper-light border-2 border-ink shadow-stamp py-3 px-4 font-mono text-[12px] uppercase tracking-[0.14em] font-semibold transition-all ${
            submitting
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_rgba(24,22,19,1)]'
          }`}
        >
          {submitting ? 'Posting…' : editMode ? 'Save Changes' : 'Post Listing'}
        </button>
      </div>

      {/* Mobile bottom space */}
      <div className="h-24 md:hidden" />
    </form>
  )
}

export default SubmitForm

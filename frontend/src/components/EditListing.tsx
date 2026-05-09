import { useState, useRef } from 'react'
import { Lock, X, AlertTriangle, Pencil, Trash2, Save, Plus } from 'lucide-react'
import { api } from '../services/api'
import { DbItem } from '../types/supabase'
import LocationPicker from './LocationPicker'

interface EditListingProps {
  item: DbItem
  onClose: () => void
  onSave: () => void
}

const inputCls =
  'w-full bg-paper-light border border-ink px-3 py-2 font-sans text-[14px] text-ink placeholder:text-ink-fade outline-none focus:shadow-[2px_2px_0_0_rgba(24,22,19,1)] transition-shadow'

export default function EditListing({ item, onClose, onSave }: EditListingProps) {
  const [editCode, setEditCode] = useState('')
  const [formData, setFormData] = useState({
    title: item.title,
    description: item.description,
    category: item.category,
    location_address: item.location_address || '',
    location_lat: item.location_lat ?? 0,
    location_lng: item.location_lng ?? 0,
    available_from: item.available_from,
    available_until: item.available_until,
    contact_info: item.contact_info || '',
    url: item.url || '',
    status: item.status || 'available',
    images: item.images || [],
  })
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'verify' | 'edit'>('verify')
  const [newImages, setNewImages] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const isValid = await api.verifyEditCode(item.id.toString(), editCode)
      if (isValid) {
        setMode('edit')
        setError('')
      }
    } catch {
      setError('Invalid edit code')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const formattedData = {
        ...formData,
        available_from: new Date(formData.available_from).toISOString(),
        available_until: formData.available_until
          ? new Date(formData.available_until).toISOString()
          : null,
      }
      await api.updateItem(item.id.toString(), editCode, formattedData as any, newImages)
      onSave()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update listing')
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this listing? This can\'t be undone.')) return
    try {
      await api.deleteItem(item.id.toString(), editCode)
      onSave()
      onClose()
    } catch {
      setError('Error deleting listing')
    }
  }

  // STAGE 1 — Verify edit code
  if (mode === 'verify') {
    return (
      <div className="fixed inset-0 bg-ink/50 flex items-center justify-center p-4 z-[9999]">
        <div className="bg-paper-light border border-ink shadow-stamp p-6 max-w-md w-full">
          <div className="mb-5 pb-3 border-b border-ink">
            <span className="label inline-flex items-center gap-1.5">
              <Lock size={11} strokeWidth={2.5} /> Restricted
            </span>
            <h2 className="font-display font-black text-3xl text-ink mt-1 leading-tight">
              Enter your edit code
            </h2>
          </div>

          {error && (
            <div className="border border-bridge-700 bg-bridge-50 p-3 mb-4 flex items-start gap-2">
              <AlertTriangle size={14} strokeWidth={2.2} className="text-bridge-700 mt-0.5 shrink-0" />
              <span className="font-mono text-[12px] text-bridge-700">{error}</span>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            <label className="block">
              <span className="label">Edit Code</span>
              <input
                type="text"
                value={editCode}
                onChange={(e) => setEditCode(e.target.value)}
                className={`mt-1.5 ${inputCls} font-mono`}
                placeholder="The code you set when you posted"
                required
                autoFocus
              />
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-paper-light text-ink border border-ink font-mono text-[11px] uppercase tracking-[0.14em] font-semibold hover:bg-paper transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-bridge-500 text-paper-light border border-ink shadow-stamp font-mono text-[11px] uppercase tracking-[0.14em] font-semibold hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_rgba(24,22,19,1)] transition-all"
              >
                Verify
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  // STAGE 2 — Edit form
  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="min-h-screen px-4 py-8 flex items-start justify-center">
        <div className="fixed inset-0 bg-ink/50" onClick={onClose} />
        <div className="relative bg-paper-light border border-ink shadow-stamp p-6 md:p-8 max-w-2xl w-full">
          <div className="mb-6 pb-3 border-b border-ink flex items-start justify-between gap-4">
            <div>
              <span className="label inline-flex items-center gap-1.5">
                <Pencil size={11} strokeWidth={2.5} /> Editing · № {String(item.id).padStart(4, '0')}
              </span>
              <h2 className="font-display font-black text-3xl md:text-4xl text-ink mt-1 leading-tight">
                Edit listing<span className="serif-wonk text-bridge-500 italic font-normal">.</span>
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-ink-mute hover:text-ink hover:bg-paper-dark transition-colors"
              aria-label="Close"
            >
              <X size={18} strokeWidth={2.2} />
            </button>
          </div>

          {error && (
            <div className="border border-bridge-700 bg-bridge-50 p-3 mb-5 flex items-start gap-2">
              <AlertTriangle size={14} strokeWidth={2.2} className="text-bridge-700 mt-0.5 shrink-0" />
              <span className="font-mono text-[12px] text-bridge-700">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block">
              <span className="label">Status</span>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className={`mt-1.5 ${inputCls} font-mono`}
              >
                <option value="available">Available</option>
                <option value="gone">Gone</option>
                <option value="pending">Pending</option>
              </select>
            </label>

            <label className="block">
              <span className="label">Title</span>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={`mt-1.5 ${inputCls} font-display text-[18px]`}
                required
              />
            </label>

            <label className="block">
              <span className="label">Description</span>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`mt-1.5 ${inputCls} h-32`}
                required
              />
            </label>

            <div className="grid md:grid-cols-2 gap-4">
              <label className="block">
                <span className="label">Category</span>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={`mt-1.5 ${inputCls} font-mono`}
                >
                  <option value="Items">Items</option>
                  <option value="Events">Events</option>
                </select>
              </label>

              <div>
                <span className="label">Location</span>
                <div className="mt-1.5">
                  <LocationPicker
                    initialAddress={formData.location_address}
                    initialLat={formData.location_lat}
                    initialLng={formData.location_lng}
                    onLocationSelected={({ address, lat, lng }) => {
                      setFormData({
                        ...formData,
                        location_address: address,
                        location_lat: lat,
                        location_lng: lng,
                      })
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <label className="block">
                <span className="label">Available From</span>
                <input
                  type="datetime-local"
                  value={new Date(formData.available_from).toISOString().slice(0, 16)}
                  onChange={(e) => setFormData({ ...formData, available_from: e.target.value })}
                  className={`mt-1.5 ${inputCls} font-mono`}
                />
              </label>
              <label className="block">
                <span className="label">Available Until</span>
                <input
                  type="datetime-local"
                  value={formData.available_until ? new Date(formData.available_until).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setFormData({ ...formData, available_until: e.target.value || null })}
                  className={`mt-1.5 ${inputCls} font-mono`}
                />
              </label>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <label className="block">
                <span className="label">Contact</span>
                <input
                  type="text"
                  value={formData.contact_info}
                  onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
                  className={`mt-1.5 ${inputCls}`}
                  placeholder="How to reach you"
                />
              </label>
              <label className="block">
                <span className="label">Link</span>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className={`mt-1.5 ${inputCls} font-mono`}
                  placeholder="https://"
                />
              </label>
            </div>

            <div>
              <span className="label">Images</span>
              {formData.images?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.images.map((url, i) => (
                    <div key={url} className="relative w-20 h-20">
                      <img src={url} alt={`#${i + 1}`} className="w-full h-full object-cover border border-ink" />
                    </div>
                  ))}
                </div>
              )}

              {newImages.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {newImages.map((file, i) => (
                    <div key={i} className="relative w-20 h-20">
                      <img src={URL.createObjectURL(file)} alt={`new ${i + 1}`} className="w-full h-full object-cover border border-ink" />
                      <button
                        type="button"
                        onClick={() => setNewImages(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-bridge-500 text-paper-light border border-ink flex items-center justify-center"
                      >
                        <X size={10} strokeWidth={2.5} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 w-full py-2 px-3 border-2 border-dashed border-ink/40 hover:border-ink bg-paper-light font-mono text-[11px] uppercase tracking-[0.14em] text-ink transition-colors inline-flex items-center justify-center gap-2"
              >
                <Plus size={13} strokeWidth={2.5} /> Add images
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setNewImages(prev => [...prev, ...Array.from(e.target.files || [])])}
                className="hidden"
              />
            </div>

            <div className="border-t border-ink pt-5 flex justify-between items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-bridge-500 text-paper-light border border-ink shadow-stamp font-mono text-[11px] uppercase tracking-[0.14em] font-semibold hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_rgba(24,22,19,1)] transition-all"
              >
                <Trash2 size={13} strokeWidth={2.2} /> Delete
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-paper-light text-ink border border-ink font-mono text-[11px] uppercase tracking-[0.14em] font-semibold hover:bg-paper transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-ink text-paper-light border border-ink shadow-stamp font-mono text-[11px] uppercase tracking-[0.14em] font-semibold hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_rgba(24,22,19,1)] transition-all"
                >
                  <Save size={13} strokeWidth={2.2} /> Save
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

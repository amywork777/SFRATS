import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Check, XCircle, Pencil, Trash2, AlertTriangle, ArrowLeft } from 'lucide-react'
import { api } from '../services/api'

export default function ManagePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const setStatus = async (status: 'available' | 'gone' | 'pending') => {
    if (!id) return
    setError(null)
    setBusy(true)
    try {
      await api.updateItem(id, { status } as any)
      navigate(`/listing/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status')
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    if (!id) return
    if (!window.confirm('Delete this listing? This can\'t be undone.')) return
    setError(null)
    setBusy(true)
    try {
      await api.deleteItem(id)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete listing')
      setBusy(false)
    }
  }

  return (
    <div className="max-w-md mx-auto pt-24 pb-16 px-4">
      <div className="bg-paper-light border border-ink shadow-stamp p-6 md:p-7">
        <div className="mb-6 pb-3 border-b border-ink">
          <h1 className="font-display font-black text-3xl md:text-4xl text-ink leading-tight">
            Listing controls<span className="serif-wonk text-bridge-500 italic font-normal">.</span>
          </h1>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-fade mt-3">
            Anyone can update or remove a listing — no code needed.
          </p>
        </div>

        {error && (
          <div className="mb-5 border border-bridge-700 bg-bridge-50 p-3 flex items-start gap-2">
            <AlertTriangle size={14} strokeWidth={2.2} className="text-bridge-700 mt-0.5 shrink-0" />
            <span className="font-mono text-[12px] text-bridge-700">{error}</span>
          </div>
        )}

        <div className="space-y-2">
          <span className="label block">Actions</span>
          <button
            onClick={() => setStatus('available')}
            disabled={busy}
            className="mt-2 w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-paper-light text-ink border border-ink font-mono text-[11px] uppercase tracking-[0.14em] font-semibold hover:bg-paper disabled:opacity-40 transition-colors"
          >
            <Check size={14} strokeWidth={2.5} /> Mark available
          </button>
          <button
            onClick={() => setStatus('gone')}
            disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-paper-light text-ink border border-ink font-mono text-[11px] uppercase tracking-[0.14em] font-semibold hover:bg-paper disabled:opacity-40 transition-colors"
          >
            <XCircle size={14} strokeWidth={2.2} /> Mark gone
          </button>
          <button
            onClick={() => navigate(`/listing/${id}/edit`)}
            disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-ink text-paper-light border border-ink shadow-stamp font-mono text-[11px] uppercase tracking-[0.14em] font-semibold hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_rgba(24,22,19,1)] disabled:opacity-40 transition-all"
          >
            <Pencil size={14} strokeWidth={2.2} /> Edit listing
          </button>
          <button
            onClick={handleDelete}
            disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-bridge-500 text-paper-light border border-ink shadow-stamp font-mono text-[11px] uppercase tracking-[0.14em] font-semibold hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_rgba(24,22,19,1)] disabled:opacity-40 transition-all"
          >
            <Trash2 size={14} strokeWidth={2.2} /> Delete listing
          </button>
        </div>

        <div className="mt-6 pt-5 border-t border-ink/15">
          <button
            onClick={() => navigate(`/listing/${id}`)}
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-mute hover:text-ink inline-flex items-center gap-2"
          >
            <ArrowLeft size={12} strokeWidth={2.2} /> Back to listing
          </button>
        </div>
      </div>
    </div>
  )
}

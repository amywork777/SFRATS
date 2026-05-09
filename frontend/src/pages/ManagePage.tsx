import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../services/api'

const inputCls =
  'w-full bg-paper-light border-2 border-ink px-3 py-2 font-sans text-[14px] text-ink placeholder:text-ink-fade outline-none focus:shadow-[2px_2px_0_0_rgba(24,22,19,1)] transition-shadow'

export default function ManagePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [editCode, setEditCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showAdminMode, setShowAdminMode] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)

  const handleAdminLogin = () => {
    if (adminPassword === 'shocking') {
      setIsAdmin(true)
      setShowAdminMode(false)
      setAdminPassword('')
      setError(null)
    } else {
      setError('Invalid admin password')
    }
  }

  const callWith = (code: string) => isAdmin ? 'shocking' : code

  const handleStatusChange = async (status: string) => {
    setError(null)
    try {
      await api.updateItem(id!, callWith(editCode), { status } as any)
      navigate(`/listing/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status')
    }
  }

  const handleDelete = async () => {
    setError(null)
    if (!window.confirm('Delete this listing? This can\'t be undone.')) return
    try {
      await api.deleteItem(id!, callWith(editCode))
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete listing')
    }
  }

  const handleEdit = async () => {
    setError(null)
    try {
      await api.verifyEditCode(id!, callWith(editCode))
      navigate(`/listing/${id}/edit/${callWith(editCode)}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify edit code')
    }
  }

  const disabled = !isAdmin && !editCode

  return (
    <div className="max-w-md mx-auto pt-24 pb-16 px-4">
      <div className="bg-paper-light border-2 border-ink shadow-stamp p-6 md:p-7">
        <div className="mb-6 pb-3 rule-thick">
          <span className="label">Manage · № {id?.padStart(4, '0')}</span>
          <h1 className="font-display font-black text-3xl md:text-4xl text-ink mt-1 leading-tight">
            Listing controls<span className="serif-wonk text-bridge-500 italic font-normal">.</span>
          </h1>
        </div>

        {!showAdminMode ? (
          <div className="space-y-5">
            <label className="block">
              <span className="label">Edit Code</span>
              <input
                type="text"
                value={editCode}
                onChange={(e) => setEditCode(e.target.value)}
                className={`mt-1.5 ${inputCls} font-mono`}
                placeholder="The code you set when you posted"
                required={!isAdmin}
                disabled={isAdmin}
              />
            </label>

            <div>
              {!isAdmin ? (
                <button
                  onClick={() => setShowAdminMode(true)}
                  className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-mute hover:text-ink underline underline-offset-4 decoration-1"
                >
                  👑 Admin mode
                </button>
              ) : (
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-bridge-600">
                  👑 Admin mode active
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <label className="block">
              <span className="label">Admin Password</span>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className={`mt-1.5 ${inputCls} font-mono`}
                placeholder="Enter admin password"
              />
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleAdminLogin}
                className="px-4 py-2 bg-ink text-paper-light border-2 border-ink shadow-stamp font-mono text-[11px] uppercase tracking-[0.14em] font-semibold hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_rgba(24,22,19,1)] transition-all"
              >
                Log in
              </button>
              <button
                onClick={() => { setShowAdminMode(false); setAdminPassword(''); setError(null) }}
                className="px-4 py-2 bg-paper-light text-ink border-2 border-ink font-mono text-[11px] uppercase tracking-[0.14em] font-semibold hover:bg-paper"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-5 border-2 border-bridge-700 bg-bridge-50 p-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-bridge-700">⚠ </span>
            <span className="font-mono text-[12px] text-bridge-700">{error}</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-6 pt-5 rule-hair space-y-2">
          <span className="label">Actions</span>
          <button
            onClick={() => handleStatusChange('available')}
            disabled={disabled}
            className="mt-2 w-full py-3 px-4 bg-paper-light text-ink border-2 border-ink font-mono text-[11px] uppercase tracking-[0.14em] font-semibold flex items-center justify-center gap-2 hover:bg-paper disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ✓ Mark available
          </button>
          <button
            onClick={() => handleStatusChange('gone')}
            disabled={disabled}
            className="w-full py-3 px-4 bg-paper-light text-ink border-2 border-ink font-mono text-[11px] uppercase tracking-[0.14em] font-semibold flex items-center justify-center gap-2 hover:bg-paper disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ✗ Mark gone
          </button>
          <button
            onClick={handleEdit}
            disabled={disabled}
            className="w-full py-3 px-4 bg-ink text-paper-light border-2 border-ink shadow-stamp font-mono text-[11px] uppercase tracking-[0.14em] font-semibold flex items-center justify-center gap-2 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_rgba(24,22,19,1)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            ✏︎ Edit listing
          </button>
          <button
            onClick={handleDelete}
            disabled={disabled}
            className="w-full py-3 px-4 bg-bridge-500 text-paper-light border-2 border-ink shadow-stamp font-mono text-[11px] uppercase tracking-[0.14em] font-semibold flex items-center justify-center gap-2 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_rgba(24,22,19,1)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            🗑 Delete listing
          </button>
        </div>

        <div className="mt-5 pt-5 rule-hair">
          <button
            onClick={() => navigate(`/listing/${id}`)}
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-mute hover:text-ink inline-flex items-center gap-2"
          >
            <span aria-hidden>←</span> Back to listing
          </button>
        </div>
      </div>
    </div>
  )
}

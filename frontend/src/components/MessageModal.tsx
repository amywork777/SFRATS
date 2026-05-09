import { useState } from 'react'
import Modal from './Modal'

interface MessageModalProps {
  isOpen: boolean
  onClose: () => void
  itemId: number
  itemTitle: string
}

function MessageModal({ isOpen, onClose, itemId, itemTitle }: MessageModalProps) {
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch(`http://localhost:3001/api/items/${itemId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })
      if (!response.ok) throw new Error('Failed to send message')
      setMessage('')
      onClose()
      alert('Message sent successfully!')
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message. Please try again.')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Re: ${itemTitle}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="label">Your Message</span>
          <textarea
            rows={5}
            required
            placeholder="I'm interested in this item…"
            className="mt-2 block w-full bg-paper-light border-2 border-ink p-3 font-sans text-[14px] text-ink placeholder:text-ink-fade outline-none focus:shadow-[2px_2px_0_0_rgba(24,22,19,1)] transition-shadow"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </label>
        <button
          type="submit"
          className="w-full bg-bridge-500 text-paper-light border-2 border-ink shadow-stamp py-3 px-4 font-mono text-[12px] uppercase tracking-[0.14em] font-semibold hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_rgba(24,22,19,1)] transition-all"
        >
          Send Message
        </button>
      </form>
    </Modal>
  )
}

export default MessageModal

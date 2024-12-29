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
        headers: {
          'Content-Type': 'application/json',
        },
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
    <Modal isOpen={isOpen} onClose={onClose} title={`Message about: ${itemTitle}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700">
            Your Message
          </label>
          <textarea
            id="message"
            rows={4}
            required
            placeholder="I'm interested in this item..."
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={message}
            onChange={e => setMessage(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Send Message
        </button>
      </form>
    </Modal>
  )
}

export default MessageModal 
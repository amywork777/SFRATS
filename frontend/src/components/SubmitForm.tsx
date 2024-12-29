import { useState } from 'react'
import { categoryEmojis } from './Legend'
import LocationPicker from './LocationPicker'

interface SubmitFormProps {
  initialData?: any
  editMode?: boolean
  editCode?: string
  onClose?: () => void
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function SubmitForm({ initialData, editMode, editCode, onClose }: SubmitFormProps) {
  console.log('SubmitForm props:', { initialData, editMode, editCode })

  // Format dates for input fields
  const formatDateForInput = (date: string | null) => {
    if (!date) return ''
    return new Date(date).toISOString().slice(0, 16) // Format: "YYYY-MM-DDThh:mm"
  }

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    category: initialData?.category || 'Items',
    location_lat: initialData?.location_lat?.toString() || '',
    location_lng: initialData?.location_lng?.toString() || '',
    location_address: initialData?.location_address || '',
    available_from: formatDateForInput(initialData?.available_from) || '',
    available_until: formatDateForInput(initialData?.available_until) || '',
    contact_info: initialData?.contact_info || '',
    url: initialData?.url || '',
    posted_by: initialData?.posted_by || '',
    edit_code: editMode ? editCode : '',
  })

  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [submittedData, setSubmittedData] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Skip edit code validation if in edit mode
    if (!editMode) {
      // Basic validation for new submissions
      if (!formData.title.trim()) {
        setError('Title is required')
        return
      }
      if (!formData.description.trim()) {
        setError('Description is required')
        return
      }
      if (!formData.edit_code || formData.edit_code.length < 6) {
        setError('Please enter an edit code (minimum 6 characters)')
        return
      }
    }
    
    try {
      const submitData = {
        ...formData,
        location_lat: formData.location_lat ? parseFloat(formData.location_lat) : null,
        location_lng: formData.location_lng ? parseFloat(formData.location_lng) : null,
        available_from: formData.available_from ? new Date(formData.available_from).toISOString() : null,
        available_until: formData.available_until ? new Date(formData.available_until).toISOString() : null,
      }

      const url = editMode 
        ? `${API_URL}/api/items/${initialData.id}`
        : `${API_URL}/api/items`

      console.log('Submitting data:', {
        url,
        method: editMode ? 'PUT' : 'POST',
        data: submitData
      })

      const response = await fetch(url, {
        method: editMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      const data = await response.json()
      console.log('Response:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit')
      }

      if (!editMode) {
        setSubmittedData(data)
      }
      setSubmitted(true)
      if (onClose) onClose()
    } catch (err) {
      console.error('Submission error:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit')
    }
  }

  if (submitted) {
    if (editMode) {
      // For edits, just close the form
      if (onClose) onClose()
      return null
    }

    // For new submissions, show the success message
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-green-600 mb-4">
          Successfully Posted! 🎉
        </h2>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">
            Your Listing Details
          </h3>
          <p className="text-blue-600 mb-4">
            Your listing is now live! Here's your listing information:
          </p>
          <div className="space-y-4">
            <div>
              <div className="font-medium text-gray-700">Listing URL:</div>
              <div className="bg-white p-3 rounded border border-blue-300 font-mono text-sm break-all">
                {`${window.location.origin}/listing/${submittedData.id}`}
              </div>
            </div>
            <div>
              <div className="font-medium text-gray-700">Your Private Edit Code:</div>
              <div className="bg-white p-3 rounded border border-blue-300 font-mono text-lg">
                {formData.edit_code}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 text-gray-600">
          <p>With your edit code, you can:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Update your listing's status (available/claimed/gone)</li>
            <li>Remove the listing when it's no longer available</li>
            <li>Delete the post if needed</li>
          </ul>
          <p className="text-sm bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <span className="font-semibold">Important:</span> Save your edit code somewhere safe. 
            You'll need it to make any changes to your listing.
          </p>
        </div>

        <div className="mt-8 flex gap-4">
          <button
            onClick={() => {
              setSubmitted(false)
              setFormData({
                title: '',
                description: '',
                category: 'Items',
                location_lat: '',
                location_lng: '',
                location_address: '',
                available_from: '',
                available_until: '',
                contact_info: '',
                url: '',
                posted_by: '',
                edit_code: '',
              })
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Post Another
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Share Something Free</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Title */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
          placeholder="What are you sharing?"
          required
        />
      </div>

      {/* Description */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 h-32"
          placeholder="Tell us more about what you're sharing..."
          required
        />
      </div>

      {/* Category */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2">
          Category <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
          className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
          required
        >
          {Object.entries(categoryEmojis).map(([category, emoji]) => (
            <option key={category} value={category}>
              {emoji} {category}
            </option>
          ))}
        </select>
      </div>

      {/* Location */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2">
          Location
        </label>
        <LocationPicker
          onChange={({ address, lat, lng }) => {
            setFormData({
              ...formData,
              location_address: address,
              location_lat: lat.toString(),
              location_lng: lng.toString()
            })
          }}
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Available From
          </label>
          <input
            type="datetime-local"
            value={formData.available_from}
            onChange={(e) => setFormData({ ...formData, available_from: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Available Until
          </label>
          <input
            type="datetime-local"
            value={formData.available_until}
            onChange={(e) => setFormData({ ...formData, available_until: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Contact Info */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2">
          Contact Information
        </label>
        <textarea
          value={formData.contact_info}
          onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
          placeholder="How should people contact you? (Email, phone, etc.)"
        />
      </div>

      {/* URL */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2">
          URL (optional)
        </label>
        <input
          type="url"
          value={formData.url}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
          placeholder="Link to more information"
        />
      </div>

      {/* Nickname */}
      <div className="mb-6">
        <label className="block text-gray-700 font-medium mb-2">
          Your Nickname (optional)
        </label>
        <input
          type="text"
          value={formData.posted_by}
          onChange={(e) => setFormData({ ...formData, posted_by: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
          placeholder="Anonymous"
        />
      </div>

      {/* Edit Code */}
      {!editMode && (
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Private Edit Code <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.edit_code}
            onChange={(e) => setFormData({ ...formData, edit_code: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
            placeholder="Choose a private code to edit your listing later"
            required
            minLength={6}
            maxLength={20}
          />
          <p className="mt-1 text-sm text-gray-500">
            Choose a memorable code (6-20 characters) that you'll use to edit or remove your listing later
          </p>
        </div>
      )}

      <button
        type="submit"
        className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      >
        Submit
      </button>
    </form>
  )
}

export default SubmitForm 
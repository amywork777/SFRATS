import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LocationPicker from './LocationPicker'
import { validateEditCode } from '../utils/editCode'
import { api } from '../services/api'
import { DbItem } from '../types/supabase'
import { supabase } from '../utils/supabase'
import ListingPreview from './ListingPreview'

interface SubmitFormProps {
  initialData?: Partial<DbItem>;
  editMode?: boolean;
  editCode?: string;
  onClose?: () => void;
}

interface FormData {
  location_lat: number;
  location_lng: number;
  // ... other fields
}

function SubmitForm({ initialData, editMode = false, editCode, onClose }: SubmitFormProps) {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submittedItem, setSubmittedItem] = useState<DbItem | null>(null)

  const [formData, setFormData] = useState<FormData>({
    location_lat: 0,
    location_lng: 0,
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
    status: initialData?.status || 'available'
  })

  const [existingImages, setExistingImages] = useState<string[]>(initialData?.images || [])
  const [images, setImages] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleImageUpload = async (files: FileList) => {
    const newImages = Array.from(files)
    setImages(prev => [...prev, ...newImages])
  }

  const handleRemoveExistingImage = (urlToRemove: string) => {
    setExistingImages(prev => prev.filter(url => url !== urlToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      // Upload new images
      const newImageUrls = []
      for (const image of images) {
        const fileName = `${Date.now()}-${image.name}`
        const { data, error } = await supabase.storage
          .from('item-images')
          .upload(fileName, image, {
            cacheControl: '3600',
            upsert: false,
            onUploadProgress: (progress) => {
              setUploadProgress((progress.loaded / progress.total) * 100)
            }
          })

        if (error) throw error
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('item-images')
          .getPublicUrl(data.path)
        
        newImageUrls.push(publicUrl)
      }

      // Combine existing and new images
      const submitData = {
        ...formData,
        images: [...existingImages, ...newImageUrls]
      }

      // Debug logs
      console.log('Form data:', submitData)
      console.log('Edit mode:', editMode)
      console.log('Edit code:', editCode)

      // Validate form data
      if (!submitData.title.trim()) {
        throw new Error('Title is required')
      }
      if (!submitData.description.trim()) {
        throw new Error('Description is required')
      }

      // Location validation
      if (!submitData.location_lat || !submitData.location_lng || !submitData.location_address) {
        console.log('Location validation failed:', {
          lat: submitData.location_lat,
          lng: submitData.location_lng,
          address: submitData.location_address
        })
        throw new Error('Please select a location by clicking on the map or searching for an address')
      }

      // Edit code validation - only for new submissions
      if (!editMode && !submitData.edit_code) {
        throw new Error('Please enter an edit code')
      }

      if (!editMode && submitData.edit_code.length < 6) {
        throw new Error('Edit code must be at least 6 characters')
      }

      if (!editMode && submitData.edit_code.length > 20) {
        throw new Error('Edit code must be less than 20 characters')
      }

      console.log('Submitting data:', submitData)

      let data: DbItem
      if (editMode && initialData?.id) {
        // For edit mode, use the editCode from props
        data = await api.updateItem(
          initialData.id.toString(),
          submitData,
          editCode || ''
        )
      } else {
        // For new submissions, use the edit_code from form
        data = await api.createItem(submitData)
      }

      console.log('Submission successful:', data)

      if (!editMode) {
        navigate('/')
      } else if (onClose) {
        onClose()
      }

      setSubmittedItem(data)
      // Clear form data
      setFormData({
        location_lat: 0,
        location_lng: 0,
        title: '',
        description: '',
        category: 'Items',
        location_address: '',
        available_from: new Date().toISOString(),
        available_until: null,
        url: '',
        posted_by: '',
        contact_info: '',
        edit_code: '',
        status: 'available'
      })
    } catch (err) {
      console.error('Error submitting form:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit listing')
    } finally {
      setSubmitting(false)
    }
  }

  // Show success message with edit code after submission
  if (submittedItem) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-green-600 mb-2">✓ Listing Created Successfully!</h2>
          <p className="text-gray-600">Your listing has been posted.</p>
        </div>

        <ListingPreview
          {...submittedItem}
          isNewListing={true}
          showDirections={false}
        />

        <div className="mt-6">
          <button
            onClick={() => setSubmittedItem(null)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Create Another Listing
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="sticky top-0 bg-white z-10 border-b pb-4 mb-4">
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
            rows={4}
            required
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Items">Items</option>
            <option value="Food">Food</option>
            <option value="Events">Events</option>
            <option value="Services">Services</option>
          </select>
        </div>

        {/* Location Picker with debug info */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Location <span className="text-red-500">*</span>
          </label>
          <LocationPicker
            initialAddress={formData.location_address}
            initialLat={formData.location_lat}
            initialLng={formData.location_lng}
            onLocationSelected={(location) => {
              console.log('Location selected:', location)
              setFormData({
                ...formData,
                location_address: location.address,
                location_lat: location.lat,
                location_lng: location.lng
              })
            }}
          />
          {/* Debug info */}
          <div className="mt-2 text-xs text-gray-500">
            Selected location: {formData.location_address || 'None'}
            <br />
            Coordinates: {formData.location_lat}, {formData.location_lng}
          </div>
        </div>

        {/* Availability */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Available From <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={formData.available_from.slice(0, 16)}
              onChange={(e) => setFormData({ ...formData, available_from: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Available Until
            </label>
            <input
              type="datetime-local"
              value={formData.available_until?.slice(0, 16) || ''}
              onChange={(e) => setFormData({ ...formData, available_until: e.target.value || null })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* URL */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Additional URL (optional)
          </label>
          <input
            type="url"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://..."
          />
        </div>

        {/* Contact Info */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Contact Information (optional)
          </label>
          <input
            type="text"
            value={formData.contact_info}
            onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
            placeholder="How should people contact you?"
          />
        </div>

        {/* Posted By */}
        <div>
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
          <div>
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

        {/* Image Upload */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Images (optional)
          </label>
          <div className="space-y-4">
            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Current Images</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {existingImages.map((url, index) => (
                    <div key={url} className="relative">
                      <img
                        src={url}
                        alt={`Existing ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingImage(url)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Image Upload */}
            <div>
              {existingImages.length > 0 && (
                <h4 className="text-sm font-medium text-gray-700 mb-2">Add New Images</h4>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                className="w-full"
              />
            </div>

            {/* Upload Progress */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}

            {/* New Image Previews */}
            {images.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">New Images</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`New ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => setImages(prev => prev.filter((_, i) => i !== index))}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
          Error: {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className={`w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600
          ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {submitting ? 'Submitting...' : 'Submit'}
      </button>

      {/* Mobile Footer Spacer */}
      <div className="h-32 md:hidden">
        {/* Empty div to create space at bottom on mobile */}
      </div>
    </form>
  )
}

export default SubmitForm 
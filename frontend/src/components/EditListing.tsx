import React, { useState, useRef } from 'react'
import { api } from '../services/api'
import { DbItem } from '../types/supabase'
import { supabase } from '../utils/supabase'
import LocationPicker from './LocationPicker'

interface EditListingProps {
  item: DbItem
  onClose: () => void
  onSave: () => void
}

export default function EditListing({ item, onClose, onSave }: EditListingProps) {
  const [editCode, setEditCode] = useState('')
  const [formData, setFormData] = useState({
    title: item.title,
    description: item.description,
    category: item.category,
    location_address: item.location_address,
    available_from: item.available_from,
    available_until: item.available_until,
    contact_info: item.contact_info,
    url: item.url,
    status: item.status || 'available',
    images: item.images || []
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
    } catch (err) {
      setError('Invalid edit code')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const formattedData = {
        ...formData,
        available_from: new Date(formData.available_from).toISOString(),
        available_until: formData.available_until 
          ? new Date(formData.available_until).toISOString()
          : null,
        status: formData.status
      };

      await api.updateItem(item.id.toString(), editCode, formattedData, newImages);
      onSave();
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update listing';
      console.error('Update error:', err);
      setError(errorMessage);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      try {
        await api.deleteItem(item.id.toString(), editCode)
        onSave()
        onClose()
      } catch (err) {
        setError('Error deleting listing')
      }
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setNewImages(prev => [...prev, ...files]);
  };

  const removeImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  if (mode === 'verify') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span>🔐</span>
            <span>Enter Edit Code</span>
          </h2>
          
          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Edit Code</label>
              <input
                type="text"
                value={editCode}
                onChange={(e) => setEditCode(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter the edit code"
                required
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Verify
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="min-h-screen px-4 flex items-center justify-center">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
        <div className="relative bg-white rounded-lg p-6 max-w-2xl w-full my-8">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <span>✏️</span>
            <span>Edit Listing</span>
          </h2>
          
          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="available">Available</option>
                <option value="gone">Gone</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full p-2 border rounded h-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Items">Items</option>
                  <option value="Food">Food</option>
                  <option value="Events">Events</option>
                  <option value="Services">Services</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <LocationPicker
                  initialAddress={formData.location_address}
                  initialLat={formData.location_lat}
                  initialLng={formData.location_lng}
                  onLocationSelected={({ address, lat, lng }) => {
                    setFormData({
                      ...formData,
                      location_address: address,
                      location_lat: lat,
                      location_lng: lng
                    });
                  }}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Available From</label>
                <input
                  type="datetime-local"
                  value={new Date(formData.available_from).toISOString().slice(0, 16)}
                  onChange={(e) => setFormData({...formData, available_from: e.target.value})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Available Until</label>
                <input
                  type="datetime-local"
                  value={formData.available_until ? new Date(formData.available_until).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setFormData({...formData, available_until: e.target.value || null})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Info</label>
                <input
                  type="text"
                  value={formData.contact_info}
                  onChange={(e) => setFormData({...formData, contact_info: e.target.value})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="How to contact you"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({...formData, url: e.target.value})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://"
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Images</h3>
              
              {/* Current Images */}
              {formData.images?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.images.map((url, index) => (
                    <div key={url} className="relative w-20 h-20">
                      <img 
                        src={url} 
                        alt={`Listing image ${index + 1}`}
                        className="w-full h-full object-cover rounded"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* New Images Preview */}
              {newImages.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {newImages.map((file, index) => (
                    <div key={index} className="relative w-20 h-20">
                      <img 
                        src={URL.createObjectURL(file)} 
                        alt={`New image ${index + 1}`}
                        className="w-full h-full object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 px-3 border-2 border-dashed border-gray-300 rounded-lg
                           text-sm text-gray-600 hover:border-gray-400 transition-colors"
              >
                Add Images
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex items-center gap-1"
              >
                <span>🗑️</span>
                <span>Delete</span>
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border rounded hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-1"
                >
                  <span>💾</span>
                  <span>Save</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 
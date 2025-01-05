import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function ManagePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editCode, setEditCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showAdminMode, setShowAdminMode] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  const handleAdminLogin = () => {
    if (adminPassword === 'shocking') {
      setIsAdmin(true);
      setShowAdminMode(false);
      setAdminPassword('');
      setError(null);
    } else {
      setError('Invalid admin password');
    }
  };

  const handleStatusChange = async (status: string) => {
    setError(null);
    try {
      await api.updateItem(
        id!, 
        { status }, 
        isAdmin ? 'shocking' : editCode
      );
      navigate(`/listing/${id}`);
    } catch (err) {
      console.error('Status update error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const handleDelete = async () => {
    setError(null);
    if (!window.confirm('Are you sure you want to delete this listing?')) {
      return;
    }

    try {
      await api.deleteItem(
        id!, 
        isAdmin ? 'shocking' : editCode
      );
      navigate('/');
    } catch (err) {
      console.error('Delete error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete listing');
    }
  };

  const handleEdit = async () => {
    setError(null);
    try {
      // Verify edit code first
      await api.verifyEditCode(
        id!, 
        isAdmin ? 'shocking' : editCode
      );

      // If verification successful, navigate to edit page
      navigate(`/listing/${id}/edit/${isAdmin ? 'shocking' : editCode}`);
    } catch (err) {
      console.error('Edit verification error:', err);
      setError(err instanceof Error ? err.message : 'Failed to verify edit code');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6">Manage Listing</h1>
      
      <div className="space-y-6">
        {!showAdminMode ? (
          <>
            <div>
              <label htmlFor="editCode" className="block text-sm font-medium text-gray-700 mb-1">
                Enter Edit Code
              </label>
              <input
                id="editCode"
                type="text"
                value={editCode}
                onChange={(e) => setEditCode(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Enter your edit code"
                required={!isAdmin}
                disabled={isAdmin}
              />
              {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
              )}
            </div>

            <div className="flex justify-between items-center">
              {!isAdmin && (
                <button
                  onClick={() => setShowAdminMode(true)}
                  className="text-purple-600 hover:text-purple-800 text-sm flex items-center gap-1"
                >
                  👑 Admin Mode
                </button>
              )}
              {isAdmin && (
                <span className="text-purple-600 text-sm">👑 Admin Mode Active</span>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div>
              <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Enter Admin Password
              </label>
              <input
                id="adminPassword"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Enter admin password"
              />
              {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleAdminLogin}
                className="px-4 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200"
              >
                Login as Admin
              </button>
              <button
                onClick={() => {
                  setShowAdminMode(false);
                  setAdminPassword('');
                  setError(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Listing Options */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Listing Options:</h3>
          <div className="space-y-2">
            <button
              onClick={() => handleStatusChange('available')}
              className="w-full p-3 bg-green-100 hover:bg-green-200 text-green-800 rounded-lg flex items-center justify-center gap-2"
              disabled={!isAdmin && !editCode}
            >
              ✓ Mark as Available
            </button>
            
            <button
              onClick={() => handleStatusChange('gone')}
              className="w-full p-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg flex items-center justify-center gap-2"
              disabled={!isAdmin && !editCode}
            >
              ✗ Mark as Gone
            </button>

            <button
              onClick={handleEdit}
              className="w-full p-3 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg flex items-center justify-center gap-2"
              disabled={!isAdmin && !editCode}
            >
              ✏️ Edit Listing
            </button>
            
            <button
              onClick={handleDelete}
              className="w-full p-3 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg flex items-center justify-center gap-2"
              disabled={!isAdmin && !editCode}
            >
              🗑 Delete Listing
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => navigate(`/listing/${id}`)}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
} 
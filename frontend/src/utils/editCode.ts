const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export const verifyEditCode = async (id: string, editCode: string) => {
  const response = await fetch(`${API_URL}/api/items/${id}/verify-edit-code`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Edit-Code': editCode
    }
  })

  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.error || 'Failed to verify edit code')
  }

  return true
}

export const validateEditCode = (code: string) => {
  if (!code || code.length < 6) {
    return 'Edit code must be at least 6 characters'
  }
  return null
} 
export interface FreeItem {
  id: number
  title: string
  description: string
  category: string
  location_address?: string
  location_lat?: number
  location_lng?: number
  available_from: Date
  available_until: Date | null
  created_at: Date
  interest_count: number
  status: 'available' | 'gone'
  url?: string
} 
export interface FreeItem {
  id?: number
  title: string
  description?: string
  location_lat?: number
  location_lng?: number
  available_from: Date
  available_until?: Date
  time_details?: string
  category: 'Events' | 'Food' | 'Items' | 'Services'
  contact_info?: string
  url?: string
  categories?: string[]
  source?: string
  last_verified?: Date
  interest_count?: number
  user_id?: number
  created_at?: Date
} 
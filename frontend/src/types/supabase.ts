export interface DbItem {
  id: number;
  created_at: string;
  title: string;
  description: string;
  category: string;
  location_address?: string;
  location_lat?: number;
  location_lng?: number;
  available_from: string;
  available_until?: string | null;
  url?: string;
  contact_info?: string;
  posted_by?: string;
  edit_code: string;
  status: 'available' | 'gone' | 'pending';
  images?: string[];
  interest_count: number;
} 
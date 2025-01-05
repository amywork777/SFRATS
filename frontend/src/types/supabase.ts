export interface DbItem {
  id: number;
  title: string;
  description: string;
  category: string;
  location_address: string;
  location_lat: number;
  location_lng: number;
  available_from: string;
  available_until: string | null;
  created_at: string;
  interest_count: number;
  status: 'available' | 'pending' | 'gone';
  url?: string;
  posted_by?: string;
  contact_info?: string;
  edit_code: string;
  images?: string[];
} 
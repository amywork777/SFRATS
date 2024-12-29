import axios from 'axios'
import { Pool } from 'pg'
import { load } from 'cheerio'

export interface ScrapedItem {
  title: string
  description?: string
  location_lat?: number
  location_lng?: number
  category: 'Events' | 'Food' | 'Items' | 'Services'
  available_from: string
  available_until?: string
  url?: string
  time_details?: string
  source?: string
}

export abstract class BaseScraper {
  protected db: Pool
  public source: string
  protected userAgent = 'SF RATS Bot/1.0 (https://sfrats.com)'

  constructor(db: Pool, source: string) {
    this.db = db
    this.source = source
  }

  protected async fetchPage(url: string) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent
        }
      })
      return load(response.data)
    } catch (error) {
      console.error(`Error fetching ${url}:`, error)
      throw error
    }
  }

  protected async geocode(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`
      )
      if (response.data?.[0]) {
        return {
          lat: parseFloat(response.data[0].lat),
          lng: parseFloat(response.data[0].lon)
        }
      }
      return null
    } catch (error) {
      console.error('Geocoding error:', error)
      return null
    }
  }

  abstract scrape(): Promise<ScrapedItem[]>

  async saveItems(items: ScrapedItem[]) {
    console.log(`Saving ${items.length} items from ${this.source}...`)
    
    for (const item of items) {
      try {
        await this.db.query(
          `INSERT INTO free_items (
            title, description, location_lat, location_lng,
            category, available_from, available_until, url,
            time_details, source, last_verified
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
          ON CONFLICT (title, available_from, COALESCE(source, ''))
          DO UPDATE SET
            description = EXCLUDED.description,
            location_lat = EXCLUDED.location_lat,
            location_lng = EXCLUDED.location_lng,
            category = EXCLUDED.category,
            available_until = EXCLUDED.available_until,
            url = EXCLUDED.url,
            time_details = EXCLUDED.time_details,
            last_verified = NOW()`,
          [
            item.title,
            item.description,
            item.location_lat,
            item.location_lng,
            item.category,
            item.available_from,
            item.available_until,
            item.url,
            item.time_details,
            this.source
          ]
        )
        console.log(`✅ Saved: ${item.title}`)
      } catch (error) {
        console.error(`❌ Error saving ${item.title}:`, error)
      }
    }
  }
} 
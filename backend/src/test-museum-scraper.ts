import dotenv from 'dotenv'
import pool from './config/database'
import { MuseumScraper } from './services/scrapers/MuseumScraper'

dotenv.config()

async function testMuseumScraper() {
  console.log('=== Testing Museum Scraper ===')
  
  const scraper = new MuseumScraper(pool, 'museums')
  
  try {
    // Get items
    const items = await scraper.scrape()
    console.log('\nFound items:', JSON.stringify(items, null, 2))

    // Try to save one item manually
    if (items.length > 0) {
      const item = items[0]
      console.log('\nTrying to save item:', item)
      
      const result = await pool.query(
        `INSERT INTO free_items (
          title, description, location_lat, location_lng,
          category, available_from, available_until, url,
          time_details, source, last_verified
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        RETURNING *`,
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
          'museums'
        ]
      )
      
      console.log('\nSaved item:', result.rows[0])
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await pool.end()
  }
}

testMuseumScraper() 
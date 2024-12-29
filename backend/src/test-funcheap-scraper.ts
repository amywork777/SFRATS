import dotenv from 'dotenv'
import pool from './config/database'
import { FunCheapScraper } from './services/scrapers/FunCheapScraper'

dotenv.config()

async function testFunCheapScraper() {
  console.log('=== Testing FunCheap Scraper ===')
  
  const scraper = new FunCheapScraper(pool, 'funcheap')
  
  try {
    console.log('\n🔍 Scraping items...')
    const items = await scraper.scrape()
    console.log('\nFound items:', JSON.stringify(items, null, 2))

    if (items.length > 0) {
      console.log('\n💾 Saving items...')
      await scraper.saveItems(items)
      
      // Verify saved items
      const result = await pool.query(`
        SELECT * FROM free_items 
        WHERE source = 'funcheap'
        AND created_at > NOW() - INTERVAL '1 hour'
      `)
      
      console.log('\n✅ Saved items:', result.rows)
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await pool.end()
  }
}

testFunCheapScraper() 
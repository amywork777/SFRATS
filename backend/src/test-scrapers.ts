import dotenv from 'dotenv'
import pool from './config/database'
import ScraperService from './services/scraper'
import fs from 'fs'
import path from 'path'

dotenv.config()

async function testScrapers() {
  console.log('=== Testing scrapers ===')
  
  const scraperService = new ScraperService(pool)
  const outputDir = path.join(__dirname, '../test-output')
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }
  
  try {
    // First check database connection
    console.log('\n📡 Testing database connection...')
    await pool.query('SELECT NOW()')
    console.log('✅ Database connected')

    // Check if table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'free_items'
      )
    `)
    console.log('Table exists:', tableExists.rows[0].exists)

    // Run scrapers
    console.log('\n🚀 Running scrapers...')
    const results = await scraperService.scrapeAll()
    console.log('\n📊 Scraping results:', JSON.stringify(results, null, 2))

    // Query database to verify saved items
    console.log('\n🔍 Checking database for recently saved items...')
    const savedItems = await pool.query(`
      SELECT 
        source, 
        COUNT(*) as count,
        MAX(created_at) as latest_item
      FROM free_items 
      WHERE created_at > NOW() - INTERVAL '1 hour'
      GROUP BY source
    `)

    console.log('\n📦 Saved items in last hour:', savedItems.rows)

    // Save detailed output for inspection
    const output = {
      timestamp: new Date().toISOString(),
      scraperResults: results,
      savedItems: savedItems.rows
    }

    fs.writeFileSync(
      path.join(outputDir, 'scraper-test.json'),
      JSON.stringify(output, null, 2)
    )

  } catch (error) {
    console.error('❌ Error testing scrapers:', error)
  } finally {
    await pool.end()
  }
}

testScrapers() 
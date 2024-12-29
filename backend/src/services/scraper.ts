import { Pool } from 'pg'
import { CraigslistScraper } from './scrapers/CraigslistScraper'
import { FreeItem } from '../types'

export default class ScraperService {
  private scrapers: any[]

  constructor(private pool: Pool) {
    // Initialize scrapers
    this.scrapers = [
      new CraigslistScraper(pool)
      // Add other scrapers here as needed
    ]
  }

  async scrapeAll(): Promise<{ source: string; count: number }[]> {
    const results = []

    for (const scraper of this.scrapers) {
      try {
        console.log(`Running ${scraper.constructor.name}...`)
        const items = await scraper.scrape()
        await scraper.save(items)
        
        results.push({
          source: scraper.constructor.name,
          count: items.length
        })
      } catch (error) {
        console.error(`Error in ${scraper.constructor.name}:`, error)
        results.push({
          source: scraper.constructor.name,
          count: 0
        })
      }
    }

    return results
  }

  async getItems(): Promise<FreeItem[]> {
    const result = await this.pool.query('SELECT * FROM free_items ORDER BY available_from DESC')
    return result.rows
  }
} 
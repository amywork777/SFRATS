import axios from 'axios'
import * as cheerio from 'cheerio'
import { Pool } from 'pg'
import { FreeItem } from '../../types'

export class CraigslistScraper {
  constructor(private pool: Pool) {}

  async scrape(): Promise<FreeItem[]> {
    try {
      const url = 'https://sfbay.craigslist.org/search/sfc/zip'
      const response = await axios.get(url)
      const $ = cheerio.load(response.data)
      const items: FreeItem[] = []

      $('.result-info').each((_, element) => {
        const title = $(element).find('.result-title').text().trim()
        const description = $(element).find('.result-hood').text().trim()
        const dateText = $(element).find('time').attr('datetime')
        const link = $(element).find('.result-title').attr('href')
        
        // Skip if no title or date
        if (!title || !dateText) return

        const available_from = new Date(dateText)
        
        items.push({
          title,
          description,
          available_from,
          category: 'Items',
          url: link || undefined,
          source: 'craigslist'
        } as FreeItem)
      })

      return items
    } catch (error) {
      console.error('Error scraping Craigslist:', error)
      return []
    }
  }

  async save(items: FreeItem[]): Promise<void> {
    for (const item of items) {
      try {
        await this.pool.query(
          `INSERT INTO free_items (
            title, description, available_from, category, url, source
          ) VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (title, available_from, COALESCE(source, '')) DO NOTHING`,
          [
            item.title,
            item.description,
            item.available_from,
            item.category,
            item.url,
            item.source
          ]
        )
      } catch (error) {
        console.error('Error saving Craigslist item:', error)
      }
    }
  }
} 
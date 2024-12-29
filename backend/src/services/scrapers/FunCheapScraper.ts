import { BaseScraper, ScrapedItem } from './BaseScraper'
import { CheerioAPI } from 'cheerio'

export class FunCheapScraper extends BaseScraper {
  private readonly baseUrl = 'https://sf.funcheap.com/category/free/'

  async scrape(): Promise<ScrapedItem[]> {
    try {
      const $ = await this.fetchPage(this.baseUrl)
      const items: ScrapedItem[] = []

      const events = $('.entry')
      
      for (const event of events.toArray()) {
        const $event = $(event)
        const title = $event.find('.title a').text().trim()
        const url = $event.find('.title a').attr('href')
        const description = $event.find('.entry-content p').first().text().trim()
        
        // Get date info
        const dateText = $event.find('.when').text().trim()
        const dates = this.parseDates(dateText)
        
        // Get location
        const location = $event.find('.where').text().trim()
        const coordinates = await this.geocode(location)

        if (title && dates.from && coordinates) {
          items.push({
            title,
            description,
            location_lat: coordinates.lat,
            location_lng: coordinates.lng,
            category: 'Events',
            available_from: dates.from,
            available_until: dates.to,
            url,
            time_details: dateText,
            source: 'funcheap'
          })
        }
      }

      return items
    } catch (error) {
      console.error('Error in FunCheapScraper:', error)
      return []
    }
  }

  private parseDates(dateText: string): { from: string | null; to: string | null } {
    try {
      // Basic date parsing - this should be enhanced based on actual date formats
      const date = new Date(dateText)
      return {
        from: date.toISOString().split('T')[0],
        to: date.toISOString().split('T')[0]
      }
    } catch (error) {
      console.error('Error parsing date:', dateText)
      return { from: null, to: null }
    }
  }
} 
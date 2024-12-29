import { BaseScraper, ScrapedItem } from './BaseScraper'
import axios from 'axios'

export class EventbriteScraper extends BaseScraper {
  private readonly apiKey = process.env.EVENTBRITE_API_KEY
  private readonly baseUrl = 'https://www.eventbriteapi.com/v3'

  async scrape(): Promise<ScrapedItem[]> {
    try {
      if (!this.apiKey) {
        throw new Error('Eventbrite API key not configured')
      }

      // First get organization ID
      const orgResponse = await axios.get(
        `${this.baseUrl}/users/me/organizations/`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      )

      const organizationId = orgResponse.data.organizations[0].id

      // Then get events
      const response = await axios.get(
        `${this.baseUrl}/organizations/${organizationId}/events/`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          },
          params: {
            status: 'live',
            order_by: 'start_asc',
            expand: 'venue'
          }
        }
      )

      return response.data.events
        .filter((event: any) => event.is_free)
        .map((event: any) => ({
          title: event.name.text,
          description: event.description.text,
          location_lat: event.venue?.latitude,
          location_lng: event.venue?.longitude,
          category: 'Events',
          available_from: event.start.utc,
          available_until: event.end.utc,
          url: event.url,
          source: 'eventbrite'
        }))
    } catch (error) {
      console.error('Error scraping Eventbrite:', error)
      return []
    }
  }
} 
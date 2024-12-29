import { BaseScraper, ScrapedItem } from './BaseScraper'

export class MuseumScraper extends BaseScraper {
  private readonly museums = [
    {
      name: 'Asian Art Museum',
      freeDay: 'First Sunday',
      location: { lat: 37.7802, lng: -122.4162 },
      url: 'https://asianart.org'
    },
    {
      name: 'de Young Museum',
      freeDay: 'First Tuesday',
      location: { lat: 37.7714, lng: -122.4686 },
      url: 'https://deyoung.famsf.org'
    },
    {
      name: 'California Academy of Sciences',
      freeDay: 'Quarterly Free Sundays',
      location: { lat: 37.7699, lng: -122.4661 },
      url: 'https://www.calacademy.org'
    }
  ]

  async scrape(): Promise<ScrapedItem[]> {
    try {
      const today = new Date()
      const items: ScrapedItem[] = []

      for (const museum of this.museums) {
        // Calculate next free day
        const nextFreeDay = this.getNextFreeDay(museum.freeDay, today)
        
        if (nextFreeDay) {
          items.push({
            title: `Free Museum Day: ${museum.name}`,
            description: `Free admission on ${museum.freeDay}`,
            category: 'Events',
            available_from: nextFreeDay.toISOString().split('T')[0],
            available_until: nextFreeDay.toISOString().split('T')[0],
            location_lat: museum.location.lat,
            location_lng: museum.location.lng,
            url: museum.url,
            time_details: `Free on ${museum.freeDay}`,
            source: 'museums'
          })
        }
      }

      return items
    } catch (error) {
      console.error('Error in MuseumScraper:', error)
      return []
    }
  }

  private getNextFreeDay(freeDayText: string, fromDate: Date): Date | null {
    const date = new Date(fromDate)
    date.setHours(0, 0, 0, 0)

    if (freeDayText === 'First Sunday') {
      // Set to first day of current month
      date.setDate(1)
      // Adjust to next/current month if we're past first Sunday
      if (fromDate.getDate() > 7) date.setMonth(date.getMonth() + 1)
      // Adjust to first Sunday
      while (date.getDay() !== 0) date.setDate(date.getDate() + 1)
    } 
    else if (freeDayText === 'First Tuesday') {
      date.setDate(1)
      if (fromDate.getDate() > 7) date.setMonth(date.getMonth() + 1)
      while (date.getDay() !== 2) date.setDate(date.getDate() + 1)
    }
    else if (freeDayText === 'Quarterly Free Sundays') {
      // Simplified: Return next quarter's first Sunday
      const month = date.getMonth()
      date.setMonth(Math.floor(month / 3) * 3 + 3)
      date.setDate(1)
      while (date.getDay() !== 0) date.setDate(date.getDate() + 1)
    }

    return date
  }
} 
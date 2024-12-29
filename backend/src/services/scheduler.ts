import cron from 'node-cron'
import ScraperService from './scraper'
import { Pool } from 'pg'
import fs from 'fs'
import path from 'path'

export class Scheduler {
  private scraperService: ScraperService
  private logDir: string

  constructor(db: Pool) {
    this.scraperService = new ScraperService(db)
    this.logDir = path.join(__dirname, '../../logs')
    
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true })
    }
  }

  start() {
    // Run scrapers every day at 2 AM
    cron.schedule('0 2 * * *', () => {
      this.runScrapers()
    })

    // Also run immediately on startup
    this.runScrapers()
  }

  private async runScrapers() {
    const timestamp = new Date().toISOString()
    console.log(`\n=== Starting scraper run at ${timestamp} ===`)

    try {
      const results = await this.scraperService.scrapeAll()
      
      // Log results to file
      const logEntry = {
        timestamp,
        results,
        success: true
      }

      fs.appendFileSync(
        path.join(this.logDir, 'scraper.log'),
        JSON.stringify(logEntry) + '\n'
      )

      console.log('Scraper run completed:', results)
    } catch (error) {
      console.error('Scraper run failed:', error)
      
      // Log error to file
      const logEntry = {
        timestamp,
        error: error instanceof Error ? error.message : String(error),
        success: false
      }

      fs.appendFileSync(
        path.join(this.logDir, 'scraper.log'),
        JSON.stringify(logEntry) + '\n'
      )
    }
  }
} 
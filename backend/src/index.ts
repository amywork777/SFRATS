import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import pool from './config/database'
import ScraperService from './services/scraper'
import { Scheduler } from './services/scheduler'
import fs from 'fs'
import path from 'path'
import { parseISO } from 'date-fns'
import itemsRouter from './routes/items'

dotenv.config()

const app = express()
const port = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.url}`)
  next()
})

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error)
})

// Add this near the top of your file, after other middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Add this to catch unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Add this after your other middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Global error handler:', err)
  
  const errorResponse = {
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  }

  res.status(500).json(errorResponse)
})

// Add this to catch any unhandled errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
})

// GET all items
app.get('/api/items', async (req, res) => {
  try {
    const { search, categories, startDate, endDate } = req.query
    console.log('Received query params:', { search, categories, startDate, endDate })

    let query = `
      SELECT * FROM free_items 
      WHERE status = 'available'::item_status
    `
    const params: any[] = []
    let paramCount = 1

    // Add search filter
    if (search) {
      query += ` AND (LOWER(title) LIKE $${paramCount} OR LOWER(description) LIKE $${paramCount})`
      params.push(`%${search.toString().toLowerCase()}%`)
      paramCount++
    }

    // Add categories filter - handle multiple categories
    if (categories) {
      const categoryArray = Array.isArray(categories) ? categories : [categories]
      if (categoryArray.length > 0) {
        const categoryPlaceholders = categoryArray
          .map(() => `$${paramCount++}`)
          .join(', ')
        query += ` AND category IN (${categoryPlaceholders})`
        params.push(...categoryArray)
      }
    }

    // Add date filters
    if (startDate) {
      query += ` AND (available_from IS NULL OR available_from >= $${paramCount})`
      params.push(startDate)
      paramCount++
    }
    if (endDate) {
      query += ` AND (available_from IS NULL OR available_from <= $${paramCount})`
      params.push(endDate)
      paramCount++
    }

    query += ` ORDER BY created_at DESC NULLS LAST`

    console.log('Executing query:', { query, params })
    const result = await pool.query(query, params)
    console.log(`Found ${result.rows.length} items`)

    // Transform dates to ISO strings for JSON serialization
    const items = result.rows.map(item => ({
      id: item.id,
      title: item.title || '',
      description: item.description || '',
      category: item.category || 'Items',
      location_lat: parseFloat(item.location_lat) || 0,
      location_lng: parseFloat(item.location_lng) || 0,
      location_address: item.location_address || '',
      available_from: item.available_from ? new Date(item.available_from).toISOString() : new Date().toISOString(),
      available_until: item.available_until ? new Date(item.available_until).toISOString() : null,
      created_at: item.created_at ? new Date(item.created_at).toISOString() : new Date().toISOString(),
      interest_count: parseInt(item.interest_count) || 0,
      status: item.status || 'available'
    }))

    res.json(items)
  } catch (error) {
    console.error('Error fetching items:', error)
    res.status(500).json({
      error: 'Failed to fetch items',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// POST new item
app.post('/api/items', async (req, res) => {
  try {
    const { 
      title,
      description,
      location_address,
      location_lat,
      location_lng,
      url,
      category,
      edit_code,
      available_from,
      available_until,
      posted_by,
      contact_info
    } = req.body;

    console.log('Received data:', { 
      ...req.body,
      available_from,
      available_until,
      posted_by
    });
    
    const result = await pool.query(
      `INSERT INTO free_items (
        title, 
        description, 
        location_address, 
        location_lat, 
        location_lng, 
        url, 
        category,
        edit_code,
        available_from,
        available_until,
        posted_by,
        contact_info
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        title, 
        description, 
        location_address, 
        location_lat, 
        location_lng, 
        url, 
        category,
        edit_code,
        available_from ? new Date(available_from) : null,
        available_until ? new Date(available_until) : null,
        posted_by || 'Anonymous',
        contact_info
      ]
    );
    
    // Format dates in response
    const item = {
      ...result.rows[0],
      available_from: result.rows[0].available_from ? new Date(result.rows[0].available_from).toISOString() : null,
      available_until: result.rows[0].available_until ? new Date(result.rows[0].available_until).toISOString() : null
    };

    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/', (req: Request, res: Response): void => {
  res.json({ message: 'SF Free Events API' })
})

app.get('/api/health', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT NOW()')
    res.json({ 
      status: 'ok',
      timestamp: result.rows[0].now,
      database: process.env.DB_NAME
    })
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      message: 'Database connection failed'
    })
  }
})

// Initialize scheduler
const scheduler = new Scheduler(pool)
scheduler.start()

// Add scraper endpoint
app.post('/api/scrape', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('\n=== POST /api/scrape ===')
    const scraperService = new ScraperService(pool)
    const results = await scraperService.scrapeAll()
    res.json(results)
  } catch (error) {
    console.error('Error in POST /api/scrape:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Add endpoint to get scraper stats
app.get('/api/scraper-stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const logFile = path.join(__dirname, '../logs/scraper.log')
    if (!fs.existsSync(logFile)) {
      res.json({ runs: [] })
      return
    }

    const logs = fs.readFileSync(logFile, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map(line => JSON.parse(line))
      .slice(-10) // Get last 10 runs

    res.json({ runs: logs })
  } catch (error) {
    console.error('Error getting scraper stats:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Add this new endpoint
app.get('/api/items/all', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM free_items ORDER BY created_at DESC')
    console.log(`Found ${result.rows.length} total items`)
    res.json(result.rows)
  } catch (error) {
    console.error('Error getting all items:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Add this endpoint after other routes
app.post('/api/items/:id/interest', async (req, res) => {
  try {
    const { id } = req.params
    
    // First get current interest count
    const getResult = await pool.query(
      'SELECT interest_count FROM free_items WHERE id = $1',
      [id]
    )
    
    if (getResult.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' })
    }

    // Increment interest count
    const result = await pool.query(
      'UPDATE free_items SET interest_count = interest_count + 1 WHERE id = $1 RETURNING interest_count',
      [id]
    )

    res.json({ count: result.rows[0].interest_count })
  } catch (error) {
    console.error('Error updating interest:', error)
    res.status(500).json({ error: 'Failed to update interest' })
  }
})

// Add routes
app.use('/api/items', itemsRouter(pool))

// Add this endpoint alongside your other routes
app.get('/api/items/:id', async (req, res) => {
  try {
    const { id } = req.params
    const query = `
      SELECT * FROM free_items 
      WHERE id = $1
    `
    const result = await pool.query(query, [id])
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' })
    }

    const item = result.rows[0]
    res.json(item)
  } catch (err) {
    console.error('Error fetching item:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Add this near your other routes
app.get('/api/db-check', async (req, res) => {
  try {
    // Test basic query
    const result = await pool.query('SELECT NOW() as now')
    
    // Test free_items table
    const tableCheck = await pool.query(`
      SELECT 
        column_name, 
        data_type 
      FROM information_schema.columns 
      WHERE table_name = 'free_items'
    `)

    res.json({
      status: 'ok',
      timestamp: result.rows[0].now,
      tableStructure: tableCheck.rows,
      connection: {
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT
      }
    })
  } catch (error) {
    console.error('Database check failed:', error)
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown database error',
      timestamp: new Date().toISOString()
    })
  }
})

// Add this before your routes
async function checkDatabaseSetup() {
  try {
    const client = await pool.connect()
    
    // Check if free_items table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'free_items'
      );
    `)

    if (!tableCheck.rows[0].exists) {
      console.error('Database tables not found. Please run schema.sql')
      process.exit(1)
    }

    console.log('Database setup verified')
    client.release()
  } catch (error) {
    console.error('Database check failed:', error)
    process.exit(1)
  }
}

// Call it before starting the server
checkDatabaseSetup().then(() => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`)
  })
}).catch(error => {
  console.error('Failed to start server:', error)
  process.exit(1)
}) 

app.put('/api/items/:id', async (req, res) => {
  try {
    const { id } = req.params
    const editCode = req.headers['x-edit-code']

    console.log('PUT request details:', {
      id,
      editCode,
      headers: req.headers,
      body: req.body,
      editCodeType: typeof editCode,
      editCodeLength: editCode ? editCode.length : 0
    })

    // Verify edit code
    const item = await pool.query(
      'SELECT edit_code FROM free_items WHERE id = $1',
      [id]
    )
    
    if (!item.rows[0]) {
      console.log('Item not found:', id)
      return res.status(404).json({ error: 'Item not found' })
    }

    console.log('Edit code details:', {
      received: {
        code: editCode,
        type: typeof editCode,
        length: editCode ? editCode.length : 0
      },
      stored: {
        code: item.rows[0].edit_code,
        type: typeof item.rows[0].edit_code,
        length: item.rows[0].edit_code ? item.rows[0].edit_code.length : 0
      }
    })

    if (!editCode || item.rows[0].edit_code !== editCode) {
      return res.status(403).json({ 
        error: 'Invalid edit code',
        details: {
          received: editCode,
          stored: item.rows[0].edit_code,
          match: item.rows[0].edit_code === editCode
        }
      })
    }

    // Update the item
    const result = await pool.query(
      `UPDATE free_items 
       SET title = $1, 
           description = $2,
           category = $3,
           location_address = $4,
           location_lat = $5,
           location_lng = $6,
           available_from = $7,
           available_until = $8,
           status = $9,
           posted_by = $10,
           contact_info = $11
       WHERE id = $12 AND edit_code = $13
       RETURNING *`,
      [
        req.body.title,
        req.body.description,
        req.body.category,
        req.body.location_address,
        req.body.location_lat,
        req.body.location_lng,
        req.body.available_from ? new Date(req.body.available_from) : null,
        req.body.available_until ? new Date(req.body.available_until) : null,
        req.body.status || 'available',
        req.body.posted_by || 'Anonymous',
        req.body.contact_info,
        id,
        editCode
      ]
    )

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Failed to update - invalid edit code' })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('Error updating item:', error)
    res.status(500).json({ error: 'Failed to update item' })
  }
}) 

// Add this new endpoint
app.post('/api/items/:id/verify-edit-code', async (req, res) => {
  try {
    const { id } = req.params
    const editCode = req.headers['x-edit-code']

    // Verify edit code
    const item = await pool.query(
      'SELECT edit_code FROM free_items WHERE id = $1',
      [id]
    )
    
    if (!item.rows[0]) {
      return res.status(404).json({ error: 'Item not found' })
    }

    if (!editCode || item.rows[0].edit_code !== editCode) {
      return res.status(403).json({ error: 'Invalid edit code' })
    }

    res.json({ valid: true })
  } catch (error) {
    console.error('Error verifying edit code:', error)
    res.status(500).json({ error: 'Failed to verify edit code' })
  }
}) 

// Add this route to check edit codes
app.get('/api/items/:id/check-edit-code', async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query(
      'SELECT id, edit_code FROM free_items WHERE id = $1',
      [id]
    )
    
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Item not found' })
    }

    res.json({
      id: result.rows[0].id,
      edit_code: result.rows[0].edit_code
    })
  } catch (error) {
    console.error('Error checking edit code:', error)
    res.status(500).json({ error: 'Failed to check edit code' })
  }
}) 
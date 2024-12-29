import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

console.log('Database config:', {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  // Don't log password
})

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  // Add some connection settings
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 20
})

// Test connection
pool.connect()
  .then(client => {
    console.log('Successfully connected to PostgreSQL')
    // Test a simple query
    return client.query('SELECT NOW()')
      .then(result => {
        console.log('Database time:', result.rows[0].now)
        client.release()
      })
      .catch(err => {
        client.release()
        throw err
      })
  })
  .catch(err => {
    console.error('Error connecting to PostgreSQL:', err)
    process.exit(1)
  })

// Add error handler
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err)
})

export default pool 
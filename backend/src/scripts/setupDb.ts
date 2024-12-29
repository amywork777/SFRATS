import { Pool } from 'pg'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

dotenv.config()

async function setupDatabase() {
  // First, terminate all connections to the database
  const mainPool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: 'postgres' // Connect to default postgres database
  })

  try {
    // Terminate existing connections
    await mainPool.query(`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = $1 AND pid <> pg_backend_pid()
    `, [process.env.DB_NAME || 'freestuffmap'])

    // Drop and create database
    await mainPool.query(`DROP DATABASE IF EXISTS ${process.env.DB_NAME || 'freestuffmap'}`)
    await mainPool.query(`CREATE DATABASE ${process.env.DB_NAME || 'freestuffmap'}`)
    
    // Close connection to postgres
    await mainPool.end()

    // Connect to new database
    const dbPool = new Pool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'freestuffmap'
    })

    // Read and execute schema
    const schema = fs.readFileSync(
      path.join(__dirname, '../schema.sql'),
      'utf8'
    )
    await dbPool.query(schema)

    console.log('Database setup completed successfully!')
    await dbPool.end()
  } catch (error) {
    console.error('Error setting up database:', error)
    process.exit(1)
  }
}

setupDatabase() 
import { Router } from 'express'
import { Pool } from 'pg'
import { nanoid } from 'nanoid'

const router = Router()
const ADMIN_PASSWORD = 'Shockingg1!!'

export default function itemsRouter(pool: Pool) {
  // Create new item
  router.post('/', async (req, res) => {
    try {
      const {
        title,
        description,
        category,
        location_lat,
        location_lng,
        location_address,
        available_from,
        available_until,
        contact_info,
        url,
        posted_by,
        edit_code,
      } = req.body

      // Validate required fields including edit_code
      if (!title?.trim() || !description?.trim() || !category || !edit_code?.trim()) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          required: ['title', 'description', 'category', 'edit_code'],
          received: { title, description, category, edit_code }
        })
      }

      // Validate edit_code length
      if (edit_code.length < 6 || edit_code.length > 20) {
        return res.status(400).json({
          error: 'Invalid edit code length',
          message: 'Edit code must be between 6 and 20 characters'
        })
      }

      const result = await pool.query(
        `INSERT INTO free_items (
          title, 
          description, 
          category, 
          location_lat, 
          location_lng, 
          location_address,
          available_from, 
          available_until,
          contact_info, 
          url,
          posted_by,
          edit_code,
          is_anonymous,
          status
        ) VALUES ($1, $2, $3::item_category, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'available'::item_status)
        RETURNING *`,
        [
          title,
          description,
          category,
          location_lat || null,
          location_lng || null,
          location_address || null,
          available_from || null,
          available_until || null,
          contact_info || null,
          url || null,
          posted_by || null,
          edit_code,
          true,
        ]
      )

      res.status(201).json(result.rows[0])
    } catch (error: any) {
      console.error('Error creating item:', error)
      res.status(500).json({ 
        error: 'Failed to create item',
        details: error.message
      })
    }
  })

  // Add new endpoint to validate edit code
  router.post('/validate-edit-code', async (req, res) => {
    try {
      const { itemId, editCode } = req.body

      // Check for admin password first
      if (editCode === ADMIN_PASSWORD) {
        return res.json({ valid: true })
      }

      // If not admin, proceed with normal validation
      const result = await pool.query(
        'SELECT id FROM free_items WHERE id = $1 AND edit_code = $2',
        [itemId, editCode]
      )

      res.json({ valid: result.rows.length > 0 })
    } catch (error) {
      console.error('Error validating edit code:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  // Get items
  router.get('/', async (req, res) => {
    try {
      let query = `
        SELECT * FROM free_items 
        WHERE 1=1
      `
      const params: any[] = []

      // If dates are provided, check if item is available during that period
      if (req.query.startDate && req.query.endDate) {
        query += `
          AND (
            -- Item is available during the selected period
            (available_from <= $${params.length + 1} AND 
             (available_until IS NULL OR available_until >= $${params.length + 2}))
          )
        `
        params.push(req.query.startDate, req.query.endDate)
      }

      const result = await pool.query(query, params)
      res.json(result.rows)
    } catch (err) {
      console.error('Error fetching items:', err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  // Update item status
  router.put('/:id/status', async (req, res) => {
    try {
      const { id } = req.params
      const { status, editCode } = req.body

      console.log('Status update request:', { id, status, editCode })

      // Validate status
      const validStatuses = ['available', 'gone']
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: 'Invalid status',
          valid: validStatuses,
          received: status
        })
      }

      // Check for admin password first
      if (editCode === ADMIN_PASSWORD) {
        const result = await pool.query(
          `UPDATE free_items 
           SET status = $1::item_status,
               last_verified = CURRENT_TIMESTAMP
           WHERE id = $2
           RETURNING *`,
          [status, id]
        )

        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Item not found' })
        }

        return res.json(result.rows[0])
      }

      // Verify edit code
      const verifyResult = await pool.query(
        'SELECT * FROM free_items WHERE id = $1 AND edit_code = $2',
        [id, editCode]
      )

      if (verifyResult.rows.length === 0) {
        return res.status(403).json({ error: 'Invalid edit code' })
      }

      // Update status
      const result = await pool.query(
        `UPDATE free_items 
         SET status = $1::item_status,
             last_verified = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [status, id]
      )

      res.json(result.rows[0])
    } catch (error: any) {
      console.error('Error updating status:', error)
      res.status(500).json({ 
        error: 'Failed to update status',
        details: error.message
      })
    }
  })

  // Delete item
  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params
      const { editCode } = req.body

      // Check for admin password first
      if (editCode === ADMIN_PASSWORD) {
        // Admin can delete any listing
        await pool.query('DELETE FROM free_items WHERE id = $1', [id])
        return res.json({ message: 'Item deleted successfully' })
      }

      console.log('Delete request:', { 
        id, 
        editCode,
        params: req.params,
        body: req.body 
      })

      // Verify edit code
      const verifyResult = await pool.query(
        'SELECT * FROM free_items WHERE id = $1',
        [id]
      )

      console.log('Item found:', verifyResult.rows[0])
      console.log('Comparing edit codes:', {
        provided: editCode,
        stored: verifyResult.rows[0]?.edit_code
      })

      if (verifyResult.rows.length === 0) {
        return res.status(404).json({ error: 'Item not found' })
      }

      if (verifyResult.rows[0].edit_code !== editCode) {
        return res.status(403).json({ error: 'Invalid edit code' })
      }

      // Delete item
      await pool.query('DELETE FROM free_items WHERE id = $1', [id])
      console.log('Item deleted successfully')

      res.json({ message: 'Item deleted successfully' })
    } catch (error: any) {
      console.error('Error deleting item:', {
        error: error.message,
        stack: error.stack,
        code: error.code,
        detail: error.detail
      })
      res.status(500).json({ 
        error: 'Failed to delete item',
        details: error.message,
        code: error.code
      })
    }
  })

  // Update item
  router.put('/:id', async (req, res) => {
    try {
      const { id } = req.params
      const {
        title,
        description,
        category,
        location_lat,
        location_lng,
        location_address,
        available_from,
        available_until,
        contact_info,
        url,
        posted_by,
        edit_code,
      } = req.body

      // Check for admin password first
      if (edit_code === ADMIN_PASSWORD) {
        const result = await pool.query(
          `UPDATE free_items 
           SET title = $1,
               description = $2,
               category = $3::item_category,
               location_lat = $4,
               location_lng = $5,
               location_address = $6,
               available_from = $7,
               available_until = $8,
               contact_info = $9,
               url = $10,
               posted_by = $11,
               last_verified = CURRENT_TIMESTAMP
           WHERE id = $12
           RETURNING *`,
          [
            title,
            description,
            category,
            location_lat || null,
            location_lng || null,
            location_address || null,
            available_from || null,
            available_until || null,
            contact_info || null,
            url || null,
            posted_by || 'Anonymous',
            id
          ]
        )

        return res.json(result.rows[0])
      }

      // Verify edit code
      const verifyResult = await pool.query(
        'SELECT * FROM free_items WHERE id = $1 AND edit_code = $2',
        [id, edit_code]
      )

      if (verifyResult.rows.length === 0) {
        return res.status(403).json({ error: 'Invalid edit code' })
      }

      // Update item
      const result = await pool.query(
        `UPDATE free_items 
         SET title = $1,
             description = $2,
             category = $3::item_category,
             location_lat = $4,
             location_lng = $5,
             location_address = $6,
             available_from = $7,
             available_until = $8,
             contact_info = $9,
             url = $10,
             posted_by = $11,
             last_verified = CURRENT_TIMESTAMP
         WHERE id = $12
         RETURNING *`,
        [
          title,
          description,
          category,
          location_lat || null,
          location_lng || null,
          location_address || null,
          available_from || null,
          available_until || null,
          contact_info || null,
          url || null,
          posted_by || 'Anonymous',
          id
        ]
      )

      res.json(result.rows[0])
    } catch (error: any) {
      console.error('Error updating item:', error)
      res.status(500).json({ 
        error: 'Failed to update item',
        details: error.message
      })
    }
  })

  return router
} 
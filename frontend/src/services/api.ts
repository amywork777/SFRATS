import { projectOccurrence } from '../utils/recurrence'
import { supabase } from '../utils/supabase'
import { DbItem } from '../types/supabase'

export const api = {
  async getItems(filters?: {
    search?: string
    categories?: string[]
    dates?: { start: Date | null; end: Date | null }
  }) {
    // Project recurrence client-side; do not exclude series by their old seed dates.
    // Category/status/date checks exclude scraper logs without modifying them.
    let query = supabase
      .from('items')
      .select('*')
      .eq('category', 'Events')
      .eq('status', 'available')
      .not('available_from', 'is', null)
      .order('created_at', { ascending: false })

    if (filters) {
      if (filters.search) query = query.ilike('title', `%${filters.search}%`)
      if (filters.categories?.length) query = query.in('category', filters.categories)

    }

    const data: DbItem[] = []
    for (let offset = 0; ; offset += 1000) {
      const { data: page, error } = await query.range(offset, offset + 999)
      if (error) throw new Error(`Supabase error: ${error.message || JSON.stringify(error)}`)
      if (!page) throw new Error('No data returned from Supabase')
      data.push(...page as DbItem[])
      if (page.length < 1000) break
    }
    return (data as DbItem[]).filter(item => {
      if (!filters?.dates) return true
      const next = projectOccurrence(item)
      return next !== null && (!filters.dates.start || new Date(next.available_from) >= filters.dates.start) &&
        (!filters.dates.end || new Date(next.available_from) <= filters.dates.end)
    })
  },

  async getItem(id: string) {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data as DbItem
  },

  async createItem(item: Omit<DbItem, 'id' | 'created_at' | 'interest_count'>) {
    const { data, error } = await supabase
      .from('items')
      .insert([item])
      .select()
      .single()
    if (error) throw error
    return data as DbItem
  },

  async updateItem(id: string, updates: Partial<DbItem>, newImages?: File[]) {
    // Fetch current to merge images
    const { data: current, error: fetchErr } = await supabase
      .from('items').select('*').eq('id', id).single()
    if (fetchErr || !current) throw new Error('Listing not found')

    let images: string[] = updates.images ?? current.images ?? []
    if (newImages?.length) {
      const uploaded = await Promise.all(newImages.map(async (file) => {
        const ext = file.name.split('.').pop()
        const path = `${id}/${Math.random()}.${ext}`
        const { error: upErr } = await supabase.storage.from('item-images').upload(path, file)
        if (upErr) throw upErr
        const { data: { publicUrl } } = supabase.storage.from('item-images').getPublicUrl(path)
        return publicUrl
      }))
      images = [...images, ...uploaded]
    }

    const { error: updErr } = await supabase
      .from('items')
      .update({ ...updates, images })
      .eq('id', id)
    if (updErr) throw updErr

    const { data: updated, error: refetchErr } = await supabase
      .from('items').select().eq('id', id).single()
    if (refetchErr || !updated) throw new Error('Failed to fetch updated listing')
    return updated as DbItem
  },

  async deleteItem(id: string) {
    const { error } = await supabase.from('items').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return true
  },

  async updateInterestCount(id: string) {
    const { data, error } = await supabase.rpc('increment_interest', { item_id: id })
    if (error) throw error
    return data
  },
}

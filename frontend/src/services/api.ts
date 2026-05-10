import { supabase } from '../utils/supabase'
import { DbItem } from '../types/supabase'

export const api = {
  async getItems(filters?: {
    search?: string
    categories?: string[]
    dates?: { start: Date | null; end: Date | null }
  }) {
    let query = supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters) {
      if (filters.search) query = query.ilike('title', `%${filters.search}%`)
      if (filters.categories?.length) query = query.in('category', filters.categories)
      if (filters.dates?.start) query = query.gte('available_from', filters.dates.start.toISOString())
      if (filters.dates?.end)   query = query.lte('available_from', filters.dates.end.toISOString())
    }

    const { data, error } = await query
    if (error) throw new Error(`Supabase error: ${error.message || JSON.stringify(error)}`)
    if (!data) throw new Error('No data returned from Supabase')
    return data as DbItem[]
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

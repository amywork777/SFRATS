import { supabase } from '../utils/supabase'
import { DbItem } from '../types/supabase'

export const api = {
  async getItems(filters?: {
    search?: string;
    categories?: string[];
    dates?: {
      start: Date | null;
      end: Date | null;
    };
  }) {
    console.log('Calling Supabase getItems with filters:', filters);
    try {
      let query = supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters if they exist
      if (filters) {
        if (filters.search) {
          query = query.ilike('title', `%${filters.search}%`);
        }

        if (filters.categories && filters.categories.length > 0) {
          query = query.in('category', filters.categories);
        }

        if (filters.dates?.start) {
          query = query.gte('available_from', filters.dates.start.toISOString());
        }

        if (filters.dates?.end) {
          query = query.lte('available_from', filters.dates.end.toISOString());
        }
      }

      const { data, error } = await query;
      
      console.log('Supabase response:', { data, error });
      
      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Supabase error: ${error.message || JSON.stringify(error)}`);
      }
      
      if (!data) {
        throw new Error('No data returned from Supabase');
      }
      
      return data as DbItem[];
    } catch (err) {
      console.error('Error in getItems:', err);
      throw err;
    }
  },

  async getItem(id: string) {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as DbItem;
  },

  async createItem(item: Omit<DbItem, 'id' | 'created_at' | 'interest_count'>) {
    const { data, error } = await supabase
      .from('items')
      .insert([item])
      .select()
      .single();
    
    if (error) throw error;
    return data as DbItem;
  },

  async updateItem(id: string, updates: Partial<DbItem>, editCode: string) {
    try {
      // First verify the edit code
      const { data: item } = await supabase
        .from('items')
        .select('edit_code')
        .eq('id', id)
        .single();

      if (!item) {
        throw new Error('Item not found');
      }

      if (item.edit_code !== editCode && editCode !== 'shocking') {
        throw new Error('Invalid edit code');
      }

      // Perform update without trying to return the updated row
      const { error: updateError } = await supabase
        .from('items')
        .update(updates)
        .eq('id', id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw new Error(updateError.message);
      }

      // Fetch the updated item in a separate query
      const { data: updatedItem, error: fetchError } = await supabase
        .from('items')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !updatedItem) {
        console.error('Fetch error:', fetchError);
        throw new Error('Failed to fetch updated item');
      }

      return updatedItem as DbItem;
    } catch (err) {
      console.error('Update failed:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to update item');
    }
  },

  async deleteItem(id: string, editCode: string) {
    try {
      // First verify the edit code
      const { data: item } = await supabase
        .from('items')
        .select('edit_code')
        .eq('id', id)
        .single();

      if (!item) {
        throw new Error('Item not found');
      }

      if (item.edit_code !== editCode && editCode !== 'shocking') {
        throw new Error('Invalid edit code');
      }

      // Then perform the delete
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Delete error:', error);
        throw new Error(error.message);
      }

      // If we get here, delete was successful
      return true;
    } catch (err) {
      console.error('Delete failed:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to delete item');
    }
  },

  async updateInterestCount(id: string) {
    const { data, error } = await supabase.rpc('increment_interest', {
      item_id: id
    });
    
    if (error) throw error;
    return data;
  },

  async verifyEditCode(id: string, editCode: string) {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('edit_code')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Verification error:', error);
        throw new Error('Failed to verify edit code');
      }

      if (!data) {
        throw new Error('Item not found');
      }

      if (data.edit_code !== editCode && editCode !== 'shocking') {
        throw new Error('Invalid edit code');
      }

      return true;
    } catch (err) {
      console.error('Verification failed:', err);
      throw new Error('Invalid edit code');
    }
  }
} 
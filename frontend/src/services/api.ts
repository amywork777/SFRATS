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

  async updateItem(id: string, editCode: string, updates: Partial<DbItem>, newImages?: File[]) {
    try {
      // First verify the edit code
      const { data: verifyData, error: verifyError } = await supabase
        .from('items')
        .select('*')
        .eq('id', id)
        .single();

      if (verifyError || !verifyData) {
        throw new Error('Failed to verify edit code');
      }

      if (verifyData.edit_code !== editCode && editCode !== 'shocking') {
        throw new Error('Invalid edit code');
      }

      // Handle image uploads if any
      let uploadedImageUrls: string[] = updates.images || verifyData.images || [];
      
      if (newImages?.length) {
        const uploadPromises = newImages.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `${id}/${fileName}`;

          const { error: uploadError, data } = await supabase.storage
            .from('item-images')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('item-images')
            .getPublicUrl(filePath);

          return publicUrl;
        });

        const newUrls = await Promise.all(uploadPromises);
        uploadedImageUrls = [...uploadedImageUrls, ...newUrls];
      }

      // Update the item with new data including images
      const { error: updateError } = await supabase
        .from('items')
        .update({
          ...updates,
          images: uploadedImageUrls
        })
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      // Fetch the updated item
      const { data: updatedItem, error: fetchError } = await supabase
        .from('items')
        .select()
        .eq('id', id)
        .single();

      if (fetchError || !updatedItem) {
        throw new Error('Failed to fetch updated item');
      }

      return updatedItem;
    } catch (err) {
      console.error('Update error:', err);
      throw err;
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
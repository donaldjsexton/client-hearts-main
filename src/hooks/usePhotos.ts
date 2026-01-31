import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function usePhotos(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['photos', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!sessionId,
  });
}

export function useAddPhotos() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId, photos }: { sessionId: string; photos: Array<{ url: string; deliverable_photo_id?: string | null; filename?: string | null; sort_order?: number | null }> }) => {
      const photosToInsert = photos.map(photo => ({
        session_id: sessionId,
        url: photo.url.trim(),
        deliverable_photo_id: photo.deliverable_photo_id ?? null,
        filename: photo.filename ?? null,
        sort_order: photo.sort_order ?? null,
      }));
      const { data, error } = await supabase
        .from('photos')
        .insert(photosToInsert)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: ['photos', sessionId] });
    },
  });
}

export function useDeletePhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (photoId: string) => {
      const { error } = await supabase
        .from('photos')
        .delete()
        .eq('id', photoId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos'] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['all-favorites'] });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getClientId } from '@/lib/clientId';

export function useFavorites(sessionId: string | undefined) {
  const clientId = getClientId();
  return useQuery({
    queryKey: ['favorites', sessionId, clientId],
    queryFn: async () => {
      if (!sessionId) return [];
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('session_id', sessionId)
        .eq('client_id', clientId);
      if (error) throw error;
      return data;
    },
    enabled: !!sessionId,
  });
}

export function useAllFavorites(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['all-favorites', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('session_id', sessionId);
      if (error) throw error;
      return data;
    },
    enabled: !!sessionId,
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  const clientId = getClientId();
  
  return useMutation({
    mutationFn: async ({ photoId, sessionId, isFavorited }: { photoId: string; sessionId: string; isFavorited: boolean }) => {
      if (isFavorited) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('photo_id', photoId)
          .eq('client_id', clientId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({
            photo_id: photoId,
            session_id: sessionId,
            client_id: clientId,
          });
        if (error) throw error;
      }
    },
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: ['favorites', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['all-favorites', sessionId] });
    },
  });
}

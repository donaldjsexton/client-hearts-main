import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const sessionToken = crypto.randomUUID();
      const reviewToken = crypto.randomUUID();
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          name,
          session_token: sessionToken,
          review_token: reviewToken,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-sessions'] });
    },
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-sessions'] });
    },
  });
}

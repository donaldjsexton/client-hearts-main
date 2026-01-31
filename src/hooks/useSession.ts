import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useSessionByToken(sessionToken: string | undefined) {
  return useQuery({
    queryKey: ['session', sessionToken],
    queryFn: async () => {
      if (!sessionToken) return null;
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('session_token', sessionToken)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!sessionToken,
  });
}

export function useSessionByReviewToken(reviewToken: string | undefined) {
  return useQuery({
    queryKey: ['session-review', reviewToken],
    queryFn: async () => {
      if (!reviewToken) return null;
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('review_token', reviewToken)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!reviewToken,
  });
}

export function useAllSessions() {
  return useQuery({
    queryKey: ['all-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

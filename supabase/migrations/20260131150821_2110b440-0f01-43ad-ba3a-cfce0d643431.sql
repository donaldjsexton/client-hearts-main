-- Create sessions table
CREATE TABLE public.sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  review_token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create photos table
CREATE TABLE public.photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create favorites table
CREATE TABLE public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  photo_id UUID NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(photo_id, client_id)
);

-- Enable RLS on all tables
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Sessions: Public read via token, public insert/delete for management
CREATE POLICY "Anyone can read sessions" 
  ON public.sessions FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can create sessions" 
  ON public.sessions FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can delete sessions" 
  ON public.sessions FOR DELETE 
  USING (true);

-- Photos: Public CRUD for session management
CREATE POLICY "Anyone can read photos" 
  ON public.photos FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can create photos" 
  ON public.photos FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can delete photos" 
  ON public.photos FOR DELETE 
  USING (true);

-- Favorites: Public CRUD for anonymous tracking
CREATE POLICY "Anyone can read favorites" 
  ON public.favorites FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can create favorites" 
  ON public.favorites FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can delete favorites" 
  ON public.favorites FOR DELETE 
  USING (true);

-- Create indexes for performance
CREATE INDEX idx_photos_session_id ON public.photos(session_id);
CREATE INDEX idx_favorites_session_id ON public.favorites(session_id);
CREATE INDEX idx_favorites_photo_id ON public.favorites(photo_id);
CREATE INDEX idx_favorites_client_id ON public.favorites(client_id);
CREATE INDEX idx_sessions_session_token ON public.sessions(session_token);
CREATE INDEX idx_sessions_review_token ON public.sessions(review_token);
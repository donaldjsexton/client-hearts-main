ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS deliverable_base_url TEXT,
  ADD COLUMN IF NOT EXISTS deliverable_gallery_id TEXT,
  ADD COLUMN IF NOT EXISTS deliverable_share_token TEXT,
  ADD COLUMN IF NOT EXISTS imported_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.photos
  ADD COLUMN IF NOT EXISTS deliverable_photo_id TEXT,
  ADD COLUMN IF NOT EXISTS filename TEXT,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER;

CREATE UNIQUE INDEX IF NOT EXISTS idx_photos_session_url_unique
  ON public.photos (session_id, url);

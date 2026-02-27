-- Ders sembolü/ikonu (admin panelinden link ile eklenir)
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS icon_url TEXT;

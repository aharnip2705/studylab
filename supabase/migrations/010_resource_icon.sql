ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS icon_url TEXT;
ALTER TABLE public.user_resources ADD COLUMN IF NOT EXISTS icon_url TEXT;

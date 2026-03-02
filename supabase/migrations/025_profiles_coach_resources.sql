-- Koç için kullanıcının seçtiği kaynaklar: [{t:'r',id:uuid}, {t:'u',id:uuid}]
-- t:'r' = resources tablosu, t:'u' = user_resources tablosu
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS coach_resource_ids jsonb DEFAULT '[]';

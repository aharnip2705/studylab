-- Programs: exam_type ekle
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS exam_type TEXT DEFAULT 'YKS';
UPDATE public.programs SET exam_type = 'YKS' WHERE exam_type IS NULL;

-- Mevcut program YKS olarak işaretle
UPDATE public.programs SET exam_type = 'YKS' WHERE slug = 'tyt-ayt';

-- LGS ve KPSS programları oluştur
INSERT INTO public.programs (id, name, slug, exam_type)
SELECT '22222222-2222-2222-2222-222222222222', 'LGS', 'lgs', 'LGS'
WHERE NOT EXISTS (SELECT 1 FROM public.programs WHERE slug = 'lgs');

INSERT INTO public.programs (id, name, slug, exam_type)
SELECT '33333333-3333-3333-3333-333333333333', 'KPSS', 'kpss', 'KPSS'
WHERE NOT EXISTS (SELECT 1 FROM public.programs WHERE slug = 'kpss');

-- YouTube kanalları: hangi sınavda görüneceği (null = tümü)
ALTER TABLE public.youtube_channels ADD COLUMN IF NOT EXISTS exam_type TEXT;
COMMENT ON COLUMN public.youtube_channels.exam_type IS 'YKS, LGS, KPSS - null ise tüm sınavlarda görünür';

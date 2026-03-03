-- ============================================================
-- 027: KPSS ve LGS program altyapisi + kanal sınav tipi
-- ============================================================

-- 1. Programs: KPSS ve LGS programlarını ekle
INSERT INTO public.programs (id, name, slug)
VALUES
  ('22222222-2222-2222-2222-222222222222', 'KPSS', 'kpss'),
  ('33333333-3333-3333-3333-333333333333', 'LGS', 'lgs')
ON CONFLICT (id) DO NOTHING;

-- 2. KPSS Dersleri (Genel Yetenek + Genel Kültür)
INSERT INTO public.subjects (program_id, name, slug, sort_order)
SELECT '22222222-2222-2222-2222-222222222222', name, slug, sort_order
FROM (VALUES
  ('Türkçe', 'kpss-turkce', 1),
  ('Matematik', 'kpss-matematik', 2),
  ('Atatürk İlkeleri ve İnkılap Tarihi', 'kpss-ataturk', 3),
  ('Anayasa', 'kpss-anayasa', 4),
  ('Vatandaşlık', 'kpss-vatandaslik', 5),
  ('Tarih', 'kpss-tarih', 6),
  ('Coğrafya', 'kpss-cografya', 7),
  ('Eğitim Bilimleri', 'kpss-egitim-bilimleri', 8)
) AS t(name, slug, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.subjects s
  WHERE s.program_id = '22222222-2222-2222-2222-222222222222'
  AND s.slug = t.slug
);

-- 3. LGS Dersleri
INSERT INTO public.subjects (program_id, name, slug, sort_order)
SELECT '33333333-3333-3333-3333-333333333333', name, slug, sort_order
FROM (VALUES
  ('Türkçe', 'lgs-turkce', 1),
  ('Matematik', 'lgs-matematik', 2),
  ('Fen Bilimleri', 'lgs-fen', 3),
  ('T.C. İnkılap Tarihi ve Atatürkçülük', 'lgs-inkilap', 4),
  ('Din Kültürü ve Ahlak Bilgisi', 'lgs-din', 5),
  ('İngilizce', 'lgs-ingilizce', 6)
) AS t(name, slug, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.subjects s
  WHERE s.program_id = '33333333-3333-3333-3333-333333333333'
  AND s.slug = t.slug
);

-- 4. youtube_channels: exam_type sütunu ekle
ALTER TABLE public.youtube_channels ADD COLUMN IF NOT EXISTS exam_type TEXT;
ALTER TABLE public.youtube_channels DROP CONSTRAINT IF EXISTS youtube_channels_exam_type_check;
ALTER TABLE public.youtube_channels ADD CONSTRAINT youtube_channels_exam_type_check
  CHECK (exam_type IS NULL OR exam_type IN ('YKS', 'LGS', 'KPSS'));

-- 5. topic_completions: exam_type'a kpss ve lgs ekle
ALTER TABLE public.topic_completions DROP CONSTRAINT IF EXISTS topic_completions_exam_type_check;
ALTER TABLE public.topic_completions ADD CONSTRAINT topic_completions_exam_type_check
  CHECK (exam_type IN ('tyt', 'ayt', 'kpss', 'lgs'));

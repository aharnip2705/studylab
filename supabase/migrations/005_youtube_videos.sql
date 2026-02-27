-- YouTube kanalları (admin ekler)
CREATE TABLE IF NOT EXISTS public.youtube_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  subject_id UUID REFERENCES public.subjects(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- YouTube videoları
CREATE TABLE IF NOT EXISTS public.youtube_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id TEXT NOT NULL,
  video_id TEXT NOT NULL,
  title TEXT NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) NOT NULL,
  topic TEXT,
  duration_seconds INT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.youtube_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.youtube_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Herkes aktif kanalları okuyabilir" ON public.youtube_channels
  FOR SELECT USING (is_active = true);

CREATE POLICY "Herkes aktif videoları okuyabilir" ON public.youtube_videos
  FOR SELECT USING (is_active = true);

-- Örnek videolar (admin panelinden eklenebilir)
INSERT INTO public.youtube_videos (video_id, title, subject_id, topic, channel_id)
SELECT 'jNQXAC9IVRw', 'Örnek Matematik Dersi', s.id, 'Temel Kavramlar', 'UC_placeholder'
FROM public.subjects s
WHERE s.slug = 'matematik' AND s.program_id = '11111111-1111-1111-1111-111111111111'
AND NOT EXISTS (SELECT 1 FROM public.youtube_videos LIMIT 1)
LIMIT 1;

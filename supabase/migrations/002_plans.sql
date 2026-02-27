-- Programs
CREATE TABLE IF NOT EXISTS public.programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subjects
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resources (hazır kaynak listesi)
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  program_id UUID REFERENCES public.programs(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User resources (kullanıcının kendi eklediği)
CREATE TABLE IF NOT EXISTS public.user_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weekly plans
CREATE TABLE IF NOT EXISTS public.weekly_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  program_id UUID REFERENCES public.programs(id) NOT NULL,
  week_start_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start_date)
);

-- Plan tasks
CREATE TABLE IF NOT EXISTS public.plan_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_plan_id UUID REFERENCES public.weekly_plans(id) ON DELETE CASCADE NOT NULL,
  task_date DATE NOT NULL,
  day_of_week INT NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 7),
  subject_id UUID REFERENCES public.subjects(id) NOT NULL,
  task_type TEXT NOT NULL CHECK (task_type IN ('video', 'test', 'deneme')),
  resource_id UUID REFERENCES public.resources(id),
  user_resource_id UUID REFERENCES public.user_resources(id),
  resource_name TEXT,
  question_count INT DEFAULT 0,
  youtube_video_id TEXT,
  status TEXT DEFAULT 'tamamlanmadi' CHECK (status IN ('tamamlanmadi', 'kismen_tamamlandi', 'tamamlandi')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Herkes programları okuyabilir" ON public.programs FOR SELECT USING (true);
CREATE POLICY "Herkes dersleri okuyabilir" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Herkes kaynakları okuyabilir" ON public.resources FOR SELECT USING (true);

CREATE POLICY "Kullanıcı kendi user_resources" ON public.user_resources FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcı kendi weekly_plans" ON public.weekly_plans FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcı plan_tasks görebilir" ON public.plan_tasks FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.weekly_plans wp WHERE wp.id = plan_tasks.weekly_plan_id AND wp.user_id = auth.uid()));

CREATE POLICY "Kullanıcı plan_tasks ekleyebilir" ON public.plan_tasks FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.weekly_plans wp WHERE wp.id = weekly_plan_id AND wp.user_id = auth.uid()));

CREATE POLICY "Kullanıcı plan_tasks güncelleyebilir" ON public.plan_tasks FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.weekly_plans wp WHERE wp.id = plan_tasks.weekly_plan_id AND wp.user_id = auth.uid()));

CREATE POLICY "Kullanıcı plan_tasks silebilir" ON public.plan_tasks FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.weekly_plans wp WHERE wp.id = plan_tasks.weekly_plan_id AND wp.user_id = auth.uid()));

-- Seed: TYT-AYT programı (bir kez çalıştırılır)
INSERT INTO public.programs (id, name, slug)
SELECT '11111111-1111-1111-1111-111111111111', 'TYT-AYT', 'tyt-ayt'
WHERE NOT EXISTS (SELECT 1 FROM public.programs WHERE slug = 'tyt-ayt');

-- Seed: Dersler
INSERT INTO public.subjects (program_id, name, slug, sort_order)
SELECT '11111111-1111-1111-1111-111111111111', s.name, s.slug, s.sort_order
FROM (VALUES
  ('Matematik', 'matematik', 1),
  ('Türkçe', 'turkce', 2),
  ('Tarih', 'tarih', 3),
  ('Coğrafya', 'cografya', 4),
  ('Fizik', 'fizik', 5),
  ('Kimya', 'kimya', 6),
  ('Biyoloji', 'biyoloji', 7),
  ('Edebiyat', 'edebiyat', 8),
  ('Felsefe', 'felsefe', 9),
  ('Din Kültürü', 'din-kulturu', 10)
) AS s(name, slug, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.subjects LIMIT 1);

-- Seed: Hazır kaynaklar
INSERT INTO public.resources (name, program_id)
SELECT r.name, '11111111-1111-1111-1111-111111111111'
FROM (VALUES ('APOTEMI'), ('Orijinal'), ('3-4-5'), ('Palme'), ('Karekök'), ('Aydın Yayınları')) AS r(name)
WHERE NOT EXISTS (SELECT 1 FROM public.resources WHERE program_id = '11111111-1111-1111-1111-111111111111' LIMIT 1);

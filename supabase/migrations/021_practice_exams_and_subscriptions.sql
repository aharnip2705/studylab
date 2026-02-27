-- Deneme Sınavı Sonuçları
CREATE TABLE IF NOT EXISTS public.practice_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('tyt', 'ayt')),
  exam_name TEXT NOT NULL,
  total_correct INT NOT NULL DEFAULT 0,
  total_wrong INT NOT NULL DEFAULT 0,
  total_time_minutes INT NOT NULL DEFAULT 0,
  net_target REAL,
  subject_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.practice_exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kullanıcı kendi denemelerini görebilir"
  ON public.practice_exams FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcı deneme ekleyebilir"
  ON public.practice_exams FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Kullanıcı denemelerini silebilir"
  ON public.practice_exams FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_practice_exams_user
  ON public.practice_exams(user_id, created_at DESC);

-- Abonelik Planları
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'standard', 'pro', 'standard_trial', 'pro_trial')),
  trial_started_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  subscription_started_at TIMESTAMPTZ,
  subscription_ends_at TIMESTAMPTZ,
  iyzico_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kullanıcı kendi aboneliğini görebilir"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcı abonelik oluşturabilir"
  ON public.subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Kullanıcı aboneliğini güncelleyebilir"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- AI Koç Kullanım Limitleri
CREATE TABLE IF NOT EXISTS public.ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  messages_count INT NOT NULL DEFAULT 0,
  programs_created INT NOT NULL DEFAULT 0,
  UNIQUE(user_id, usage_date)
);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kullanıcı kendi ai kullanımını görebilir"
  ON public.ai_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcı ai kullanımı ekleyebilir"
  ON public.ai_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Kullanıcı ai kullanımını güncelleyebilir"
  ON public.ai_usage FOR UPDATE
  USING (auth.uid() = user_id);

-- Deneme suistimali engellemek için IP takibi
CREATE TABLE IF NOT EXISTS public.trial_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.trial_fingerprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sistem trial_fingerprints okuyabilir"
  ON public.trial_fingerprints FOR SELECT USING (true);

CREATE POLICY "Kullanıcı trial_fingerprints ekleyebilir"
  ON public.trial_fingerprints FOR INSERT
  WITH CHECK (auth.uid() = user_id);

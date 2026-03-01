-- Konu tamamlama tablosu (müfredat takibi)
CREATE TABLE IF NOT EXISTS public.topic_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  topic_name TEXT NOT NULL,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('tyt', 'ayt')),
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, subject_id, topic_name, exam_type)
);

ALTER TABLE public.topic_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kullanıcı kendi topic_completions"
  ON public.topic_completions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Kullanıcıların kaydettiği videolar
CREATE TABLE IF NOT EXISTS public.user_saved_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  video_id UUID REFERENCES public.youtube_videos(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);

ALTER TABLE public.user_saved_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kullanıcı kendi kayıtlarını görebilir" ON public.user_saved_videos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcı kendi kayıt ekleyebilir" ON public.user_saved_videos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Kullanıcı kendi kaydını silebilir" ON public.user_saved_videos
  FOR DELETE USING (auth.uid() = user_id);

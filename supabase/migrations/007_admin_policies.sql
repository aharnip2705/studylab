-- Profil emaillerini auth.users ile senkronize et (varsa)
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.email != u.email);

-- aharnip@gmail.com hesabını admin yap
UPDATE public.profiles
SET is_admin = true
WHERE email = 'aharnip@gmail.com';

-- Admin: youtube_videos - tüm videoları (aktif + pasif) okuyabilir
CREATE POLICY "Admin tüm videoları okuyabilir" ON public.youtube_videos
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Admin: youtube_videos INSERT/UPDATE/DELETE
CREATE POLICY "Admin videoları ekleyebilir" ON public.youtube_videos
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admin videoları güncelleyebilir" ON public.youtube_videos
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admin videoları silebilir" ON public.youtube_videos
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Admin: youtube_channels INSERT/UPDATE/DELETE
CREATE POLICY "Admin kanalları ekleyebilir" ON public.youtube_channels
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admin kanalları güncelleyebilir" ON public.youtube_channels
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admin kanalları silebilir" ON public.youtube_channels
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

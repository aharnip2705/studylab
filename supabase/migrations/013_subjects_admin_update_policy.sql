-- Admin kullanıcıların ders sembolü (icon_url) güncellemesine izin ver.
-- Not: Admin kullanıcının profiles.is_admin = true olması gerekir.
-- Kendi admin kullanıcınız için Supabase SQL Editor'da şunu çalıştırın:
--   UPDATE profiles SET is_admin = true WHERE id = (SELECT id FROM auth.users WHERE email = 'SIZIN_EMAIL@...');
CREATE POLICY "Admin dersleri güncelleyebilir"
  ON public.subjects
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

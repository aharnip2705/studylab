-- Admin: youtube_channels - tüm kanalları okuyabilir
CREATE POLICY "Admin tüm kanalları okuyabilir" ON public.youtube_channels
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Admin: resources - CRUD
CREATE POLICY "Admin kaynakları ekleyebilir" ON public.resources
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admin kaynakları güncelleyebilir" ON public.resources
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admin kaynakları silebilir" ON public.resources
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

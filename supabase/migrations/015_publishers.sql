-- Yayın evleri tablosu (kaynaklar buna bağlanır)
CREATE TABLE IF NOT EXISTS public.publishers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.publishers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Herkes yayın evlerini okuyabilir"
  ON public.publishers FOR SELECT USING (true);

-- resources tablosuna yayın evi bağlantısı
ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS publisher_id UUID REFERENCES public.publishers(id) ON DELETE SET NULL;

-- Varsayılan "Diğer" yayın evi ve mevcut kaynakları ona bağla
INSERT INTO public.publishers (program_id, name, sort_order)
SELECT '11111111-1111-1111-1111-111111111111'::uuid, 'Diğer', 999
WHERE NOT EXISTS (SELECT 1 FROM public.publishers LIMIT 1);

UPDATE public.resources r
SET publisher_id = (SELECT id FROM public.publishers WHERE program_id = r.program_id ORDER BY sort_order LIMIT 1)
WHERE r.publisher_id IS NULL;

-- Admin: yayın evi ekleyebilir/güncelleyebilir/silebilir (admin-resources ile aynı yetki)
CREATE POLICY "Admin yayın evi ekleyebilir" ON public.publishers FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );
CREATE POLICY "Admin yayın evi güncelleyebilir" ON public.publishers FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );
CREATE POLICY "Admin yayın evi silebilir" ON public.publishers FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

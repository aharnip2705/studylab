-- Yeni kullanıcı kaydında otomatik profile oluştur
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Kullanıcı sadece kendi profilini görebilir ve güncelleyebilir
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kullanıcı kendi profilini görebilir"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Kullanıcı kendi profilini güncelleyebilir"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Yeni kullanıcı profil oluşturabilir"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Yeni kullanıcı kaydında otomatik profile oluştur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: auth.users'a insert olduğunda çalışır
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

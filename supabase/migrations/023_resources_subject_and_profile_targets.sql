-- resources: ders (subject) alanı
ALTER TABLE resources ADD COLUMN IF NOT EXISTS subject_id uuid REFERENCES subjects(id);

-- profiles: TYT/AYT nihai net hedefleri
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tyt_target_net numeric;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ayt_target_net numeric;

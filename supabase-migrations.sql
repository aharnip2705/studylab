-- Bu SQL'i Supabase SQL Editor'da çalıştırın.
-- plan_tasks tablosuna yeni sütunlar ekler.

ALTER TABLE plan_tasks ADD COLUMN IF NOT EXISTS solved_questions_count integer;
ALTER TABLE plan_tasks ADD COLUMN IF NOT EXISTS excuse text;

-- Ders ikonları için (admin panelinden düzenlenebilir):
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS icon_url text;

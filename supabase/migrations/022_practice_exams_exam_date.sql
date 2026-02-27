-- Deneme sınavına tarih ekle (sınavın yapıldığı gün)
ALTER TABLE public.practice_exams ADD COLUMN IF NOT EXISTS exam_date DATE;

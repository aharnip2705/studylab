# Migration 026 - exam_type ve target_year

Bu migration'ı Supabase SQL Editor'da çalıştırın (Dashboard → SQL Editor → New Query).

```sql
-- Sınav tipi ve hedef yıl
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS exam_type TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS target_year INTEGER;

-- exam_type constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_exam_type_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_exam_type_check
  CHECK (exam_type IS NULL OR exam_type IN ('YKS', 'LGS', 'KPSS'));

-- study_field genişletilmiş constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_study_field_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_study_field_check
  CHECK (study_field IN (
    'esit_agirlik', 'sayisal', 'sozel', 'dil', 'tyt',
    'lgs',
    'kpss_lisans', 'kpss_onlisans', 'kpss_ortaogretim'
  ));

-- practice_exams (isteğe bağlı - deneme sınavı LGS/KPSS desteklerseniz)
ALTER TABLE public.practice_exams DROP CONSTRAINT IF EXISTS practice_exams_exam_type_check;
ALTER TABLE public.practice_exams ADD CONSTRAINT practice_exams_exam_type_check
  CHECK (exam_type IN (
    'tyt', 'ayt',
    'lgs',
    'kpss_gy_gk', 'kpss_eb', 'kpss_alan'
  ));
```

**Not:** `practice_exams` constraint'i hata verirse, son 4 satırı silip sadece `profiles` değişikliklerini çalıştırabilirsiniz.

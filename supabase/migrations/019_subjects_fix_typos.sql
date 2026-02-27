-- Ders isim yazım hatalarını düzelt
UPDATE public.subjects SET name = 'Tarih' WHERE LOWER(TRIM(name)) = 'tarin' OR name = 'Tarin';
UPDATE public.subjects SET name = 'Biyoloji' WHERE LOWER(TRIM(name)) = 'biyoloj' OR name = 'Biyoloj';

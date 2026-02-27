-- Geometri dersini Matematik'in altına ekle
UPDATE public.subjects SET sort_order = sort_order + 1 
WHERE program_id = '11111111-1111-1111-1111-111111111111' AND sort_order >= 2;

INSERT INTO public.subjects (program_id, name, slug, sort_order)
SELECT '11111111-1111-1111-1111-111111111111', 'Geometri', 'geometri', 2
WHERE NOT EXISTS (SELECT 1 FROM public.subjects WHERE slug = 'geometri');

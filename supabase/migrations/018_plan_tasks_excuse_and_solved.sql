-- plan_tasks: mazeret ve çözülen soru sayısı sütunları
ALTER TABLE public.plan_tasks ADD COLUMN IF NOT EXISTS excuse TEXT;
ALTER TABLE public.plan_tasks ADD COLUMN IF NOT EXISTS solved_questions_count INT;

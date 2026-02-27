-- Kaynak silindiğinde plan_tasks.resource_id NULL yapılsın (görev silinmesin)
ALTER TABLE public.plan_tasks
  DROP CONSTRAINT IF EXISTS plan_tasks_resource_id_fkey;

ALTER TABLE public.plan_tasks
  ADD CONSTRAINT plan_tasks_resource_id_fkey
  FOREIGN KEY (resource_id) REFERENCES public.resources(id) ON DELETE SET NULL;

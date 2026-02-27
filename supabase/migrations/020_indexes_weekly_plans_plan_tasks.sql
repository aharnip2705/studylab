-- weekly_plans: user_id ile filtreleme (getOrCreateWeeklyPlan, getStats)
-- plan_tasks: weekly_plan_id join için (görevler tablosu user_id ile dolaylı olarak filtrelenir)
CREATE INDEX IF NOT EXISTS idx_weekly_plans_user_week
  ON public.weekly_plans(user_id, week_start_date);

CREATE INDEX IF NOT EXISTS idx_plan_tasks_weekly_plan_id
  ON public.plan_tasks(weekly_plan_id);

-- task_date sıralaması için composite index
CREATE INDEX IF NOT EXISTS idx_plan_tasks_weekly_plan_date
  ON public.plan_tasks(weekly_plan_id, task_date);

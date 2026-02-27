/** Pro / abonelik yardımcı fonksiyonları - Server Action DEĞİL (senkron, client/server tarafında kullanılır) */

export type PlanType = "free" | "standard" | "pro" | "standard_trial" | "pro_trial";

export interface Subscription {
  id: string;
  user_id: string;
  plan: PlanType;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  subscription_started_at: string | null;
  subscription_ends_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Admin hesapları sınırsız Pro kabul edilir */
export function isPro(sub: Subscription | null, isAdmin = false): boolean {
  if (isAdmin) return true;
  if (!sub) return false;
  return sub.plan === "pro" || sub.plan === "pro_trial";
}

export function isStandardOrAbove(sub: Subscription | null, isAdmin = false): boolean {
  if (isAdmin) return true;
  if (!sub) return false;
  return ["standard", "pro", "standard_trial", "pro_trial"].includes(sub.plan);
}

export function getTrialDaysLeft(sub: Subscription | null): number | null {
  if (!sub) return null;
  if (sub.plan !== "pro_trial" && sub.plan !== "standard_trial") return null;
  if (!sub.trial_ends_at) return null;
  const diff = new Date(sub.trial_ends_at).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

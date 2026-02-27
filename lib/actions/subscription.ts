"use server";

import { createClient } from "@/lib/supabase/server";
import { isPro } from "@/lib/subscription-utils";

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

export interface SubscriptionResult {
  subscription: Subscription | null;
  isAdmin: boolean;
  proActive: boolean;
}

export async function getSubscription(): Promise<SubscriptionResult | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  const isAdmin = (profile as { is_admin?: boolean } | null)?.is_admin === true;

  let sub: Subscription | null = null;
  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!error && data) {
      sub = data as Subscription;
      if (
        (sub.plan === "pro_trial" || sub.plan === "standard_trial") &&
        sub.trial_ends_at &&
        new Date(sub.trial_ends_at) < new Date()
      ) {
        await supabase
          .from("subscriptions")
          .update({ plan: "free", updated_at: new Date().toISOString() })
          .eq("id", sub.id);
        sub = { ...sub, plan: "free" };
      }
    }
  } catch {
    // subscriptions tablosu yoksa veya hata
  }

  return {
    subscription: sub,
    isAdmin,
    proActive: isPro(sub, isAdmin),
  };
}

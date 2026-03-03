import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Play,
  Zap,
  Crown,
  Check,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const plans = [
  {
    id: "demo",
    name: "Demo",
    description: "Önce deneyin, karar verin",
    icon: Play,
    features: [
      "7 gün ücretsiz deneme",
      "Tüm özelliklere erişim",
      "İstediğiniz zaman iptal",
    ],
    cta: "Demo'yu Başlat",
    href: "/dashboard",
    highlighted: false,
    demo: true,
  },
  {
    id: "standard",
    name: "Aylık",
    description: "Esnek abonelik",
    icon: Zap,
    price: "₺30",
    period: "/ay",
    features: [
      "Sınırsız planlama",
      "Video dersler",
      "İstatistik paneli",
      "E-posta desteği",
    ],
    cta: "Başla",
    href: "#",
    highlighted: true,
  },
  {
    id: "pro",
    name: "Yıllık",
    description: "En avantajlı paket",
    icon: Crown,
    price: "₺300",
    period: "/yıl",
    badge: "2 ay bedava",
    features: [
      "Aylık planın tüm özellikleri",
      "Yıllık %17 indirim (₺30/ay x 10)",
      "AI Koç desteği",
      "Öncelikli destek",
    ],
    cta: "Başla",
    href: "#",
    highlighted: false,
  },
];

function getRemainingDays(endDate: string | null): number | null {
  if (!endDate) return null;
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / 86400000));
}

function getPlanLabel(plan: string): string {
  const map: Record<string, string> = {
    free: "Ücretsiz",
    standard: "Aylık",
    pro: "Yıllık (Pro)",
    standard_trial: "Aylık (Deneme)",
    pro_trial: "Yıllık (Deneme)",
  };
  return map[plan] ?? plan;
}

export default async function PlansPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const displayName =
    user.user_metadata?.full_name || user.email?.split("@")[0] || "Kullanıcı";

  let currentPlan = "free";
  let trialEndsAt: string | null = null;
  let subscriptionEndsAt: string | null = null;

  try {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan, trial_ends_at, subscription_ends_at")
      .eq("user_id", user.id)
      .single();

    if (sub) {
      currentPlan = sub.plan ?? "free";
      trialEndsAt = sub.trial_ends_at ?? null;
      subscriptionEndsAt = sub.subscription_ends_at ?? null;
    }
  } catch {
    // subscriptions tablosu yoksa devam
  }

  const isTrial = currentPlan.includes("trial");
  const isActive = currentPlan !== "free";
  const endDate = isTrial ? trialEndsAt : subscriptionEndsAt;
  const remainingDays = getRemainingDays(endDate);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 py-16 px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard&apos;a Dön
          </Link>
        </div>

        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
            Hoş geldin, {displayName}
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            {isActive
              ? "Mevcut planınızı yönetin veya yükseltin"
              : "Devam etmek için bir plan seçin veya demo ile tanışın"}
          </p>
        </div>

        {isActive && (
          <div className="mx-auto mb-10 max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Mevcut Planınız
                </p>
                <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                  {getPlanLabel(currentPlan)}
                </p>
              </div>
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full",
                  isTrial
                    ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                    : "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                )}
              >
                {isTrial ? (
                  <Play className="h-5 w-5" />
                ) : (
                  <Check className="h-5 w-5" />
                )}
              </div>
            </div>
            {remainingDays !== null && (
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                {remainingDays > 0
                  ? `${remainingDays} gün kaldı`
                  : "Süreniz doldu"}
              </p>
            )}
            <div className="mt-4 flex gap-3">
              <Button variant="outline" size="sm" className="flex-1" disabled>
                {isTrial ? "Plan Yükselt" : "Planı Değiştir"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                disabled
              >
                İptal Et
              </Button>
            </div>
            <p className="mt-3 text-xs text-slate-400 dark:text-slate-500 text-center">
              Ödeme sağlayıcı yakında bağlanacak
            </p>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan =
              (plan.id === "demo" && currentPlan === "free") ||
              (plan.id === "standard" &&
                (currentPlan === "standard" || currentPlan === "standard_trial")) ||
              (plan.id === "pro" &&
                (currentPlan === "pro" || currentPlan === "pro_trial"));

            return (
              <Card
                key={plan.name}
                className={cn(
                  "flex flex-col transition-all duration-300 hover:shadow-lg",
                  plan.highlighted &&
                    "border-primary shadow-md ring-2 ring-primary/20",
                  isCurrentPlan && "ring-2 ring-green-500/30 border-green-500/50"
                )}
              >
                {(plan.badge || isCurrentPlan) && (
                  <div className="mx-6 mt-6 flex gap-2">
                    {plan.badge && (
                      <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        {plan.badge}
                      </span>
                    )}
                    {isCurrentPlan && (
                      <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Mevcut Plan
                      </span>
                    )}
                  </div>
                )}
                <CardHeader className={cn(!(plan.badge || isCurrentPlan) && "pt-6")}>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  {plan.price && (
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-2xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Check className="h-4 w-4 shrink-0 text-primary" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  {plan.demo ? (
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full"
                      asChild
                    >
                      <Link href={plan.href}>{plan.cta}</Link>
                    </Button>
                  ) : (
                    <Button
                      variant={plan.highlighted ? "default" : "outline"}
                      size="lg"
                      className="w-full"
                      disabled={isCurrentPlan}
                    >
                      {isCurrentPlan ? "Aktif" : plan.cta}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Ödeme sistemi yakında aktif olacak. Şimdilik Demo ile tüm özellikleri
          ücretsiz deneyebilirsiniz.
        </p>
      </div>
    </main>
  );
}

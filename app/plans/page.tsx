import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
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
    name: "Deneme Sürümü",
    description: "7 gün ücretsiz Pro deneyimi",
    icon: Sparkles,
    price: "₺0",
    period: "/ay",
    features: [
      "StudyLab'in AI destekli tüm Pro özelliklerini 7 gün boyunca tam kapasiteyle deneyimle.",
      "AI Koç'un hazırladığı ilk kişiselleştirilmiş haftalık çalışma programını hemen gör.",
      "Gerçek deneme sınavı analizlerinin potansiyelini bir öğrenci gibi keşfet.",
      "Hiçbir taahhüt gerekmez, kararını 7 günün sonunda Pro'ya geçerek ver.",
    ],
    cta: "Denemeyi Başlat",
    href: "/dashboard",
    highlighted: false,
    demo: true,
  },
  {
    id: "standard",
    name: "Standart Paket",
    description: "Temel araçlar, AI olmadan",
    icon: Zap,
    price: "₺30",
    period: "/ay",
    features: [
      "AI'sız Temel Araçlar: Ders/konu takibi, Pomodoro sayaç ve temel kaynak listesi.",
      "Net İstatistik Paneli: Kendi girdiğin deneme sınavı netlerini görselleştir.",
      "Haftalık Planlayıcı: Programını AI desteği olmadan, kendin manuel olarak hazırla.",
      "Sınav Sayaç ve Görev Yönetimi: Temel platform özelliklerini süre sınırı olmadan kullan.",
    ],
    cta: "Başla",
    href: "#",
    highlighted: true,
  },
  {
    id: "pro",
    name: "Pro Paket",
    description: "AI Koç ile sınırsız potansiyel",
    icon: Crown,
    price: "₺34,99",
    period: "/ay",
    features: [
      "🌟 Sürekli AI Deneme Analizi: Deneme verilerine göre potansiyel net artış alanlarını ve yorumlarını AI Koç'unla keşfet.",
      "AI ile Haftalık Programlama: Mazeretlerine, uyarılarına ve deneme analizlerine göre AI Koç'unla sürekli güncellenen mükemmel bir program hazırla.",
      "AI Proaktif Uyarılar & Öneriler: AI Koç, deneme analizlerine göre sana sürekli özel önerilerde bulunacak.",
      "Gelişmiş İstatistik Paneli & Öncelikli Destek: Sadece netleri değil, konu bazlı derin analizleri gör ve öncelikli destek al.",
    ],
    cta: "Pro'ya Geç",
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
    standard: "Standart Paket",
    pro: "Pro Paket",
    standard_trial: "Standart (Deneme)",
    pro_trial: "Pro (Deneme)",
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
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
            Hoş geldin, {displayName}
          </h1>
          <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">
            {isActive
              ? "Mevcut planınızı yönetin veya yükseltin"
              : "Devam etmek için bir plan seçin veya deneme ile tanışın"}
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
                  <Sparkles className="h-5 w-5" />
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
                  plan.id === "pro" &&
                    "border-amber-200 dark:border-amber-800/50",
                  isCurrentPlan && "ring-2 ring-green-500/30 border-green-500/50"
                )}
              >
                {((plan.id === "pro" && !isCurrentPlan) || isCurrentPlan) && (
                  <div className="mx-6 mt-6 flex flex-wrap gap-2">
                    {plan.id === "pro" && !isCurrentPlan && (
                      <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                        En popüler
                      </span>
                    )}
                    {isCurrentPlan && (
                      <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Mevcut Plan
                      </span>
                    )}
                  </div>
                )}
                <CardHeader
                  className={cn(
                    !((plan.id === "pro" && !isCurrentPlan) || isCurrentPlan) &&
                      "pt-6"
                  )}
                >
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-xl text-slate-900 dark:text-white">
                    {plan.name}
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    {plan.description}
                  </CardDescription>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">
                      {plan.price}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {plan.period}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-4">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300"
                      >
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
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

        <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Ödeme sistemi yakında aktif olacak. Şimdilik Deneme Sürümü ile tüm Pro
          özelliklerini ücretsiz deneyebilirsiniz.
        </p>
      </div>
    </main>
  );
}

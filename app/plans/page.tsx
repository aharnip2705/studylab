import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Play,
  Zap,
  Crown,
  Check,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const plans = [
  {
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
    name: "Yıllık",
    description: "En avantajlı paket",
    icon: Crown,
    price: "₺300",
    period: "/yıl",
    badge: "2 ay bedava",
    features: [
      "Aylık planın tüm özellikleri",
      "Yıllık %17 indirim (₺30/ay x 10)",
      "Öncelikli destek",
    ],
    cta: "Başla",
    href: "#",
    highlighted: false,
  },
];

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

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 py-16 px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
            Hoş geldin, {displayName}
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Devam etmek için bir plan seçin veya demo ile tanışın
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card
                key={plan.name}
                className={cn(
                  "flex flex-col transition-all duration-300 hover:shadow-lg",
                  plan.highlighted &&
                    "border-primary shadow-md ring-2 ring-primary/20"
                )}
              >
                {plan.badge && (
                  <div className="mx-6 mt-6">
                    <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      {plan.badge}
                    </span>
                  </div>
                )}
                <CardHeader className={cn(!plan.badge && "pt-6")}>
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
                  <Button
                    variant={plan.highlighted ? "default" : "outline"}
                    size="lg"
                    className="w-full"
                    asChild
                  >
                    <Link href={plan.href}>{plan.cta}</Link>
                  </Button>
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

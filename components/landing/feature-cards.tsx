"use client";

import {
  CalendarDays,
  BarChart3,
  Focus,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: CalendarDays,
    title: "Planlama",
    description:
      "Haftalık ders planınızı gün gün oluşturun. Hangi dersten kaç soru çözeceğinizi kaynak bazlı takip edin.",
  },
  {
    icon: BarChart3,
    title: "İstatistik",
    description:
      "Soru çözüm sayılarınızı ve konu tamamlama ilerlemenizi haftalık grafiklerle takip edin.",
  },
  {
    icon: Focus,
    title: "Odak Modu",
    description:
      "Video dersler tamamen dikkat dağıtıcılardan arınmış, reklamsız odak modunda.",
  },
] as const;

export function FeatureCards() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {features.map(({ icon: Icon, title, description }) => (
        <Card
          key={title}
          className={cn(
            "group border-white/40 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm",
            "transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:border-primary/30"
          )}
        >
          <CardHeader>
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
              <Icon className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="leading-relaxed">
              {description}
            </CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

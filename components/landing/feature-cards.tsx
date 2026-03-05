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
    <div className="grid gap-3 sm:gap-4 md:grid-cols-3 md:gap-5">
      {features.map(({ icon: Icon, title, description }) => (
        <Card
          key={title}
          className={cn(
            "group border-white/40 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm",
            "transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:border-primary/30 p-3 sm:p-4"
          )}
        >
          <CardHeader className="p-0">
            <div className="mb-1.5 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.5} />
            </div>
            <CardTitle className="text-sm sm:text-base">{title}</CardTitle>
            <CardDescription className="text-xs sm:text-sm leading-snug">
              {description}
            </CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

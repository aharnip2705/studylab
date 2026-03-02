import Link from "next/link";
import { Countdown } from "@/components/landing/countdown";
import { FeatureCards } from "@/components/landing/feature-cards";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="relative h-screen max-h-[100dvh] overflow-hidden">
      {/* Animated gradient background */}
      <div className="animated-gradient-bg absolute inset-0" />

      {/* Floating gradient orbs */}
      <div
        className="gradient-orb -left-32 -top-32 h-72 w-72 bg-blue-400/40 dark:bg-blue-600/25"
        style={{ animation: "float 8s ease-in-out infinite" }}
      />
      <div
        className="gradient-orb -right-32 top-1/3 h-80 w-80 bg-violet-400/35 dark:bg-violet-600/20"
        style={{ animation: "float 10s ease-in-out infinite 2s" }}
      />
      <div
        className="gradient-orb bottom-1/4 left-1/3 h-56 w-56 bg-cyan-400/30 dark:bg-cyan-600/15"
        style={{ animation: "float 7s ease-in-out infinite 1s" }}
      />

      <div className="relative flex h-screen max-h-[100dvh] flex-col items-center justify-center overflow-hidden px-6 py-4">
        {/* Countdown */}
        <div className="shrink-0 pb-3">
          <Countdown />
        </div>

        {/* Ana başlık */}
        <div className="shrink-0 pb-4 max-w-3xl text-center">
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl md:text-5xl">
            YKS Ders Paneli
          </h1>
          <p className="mx-auto max-w-2xl text-base text-slate-600 dark:text-slate-400 sm:text-lg">
            YKS&apos;ye hazırlanan öğrenciler için ders planlama, video dersler ve
            ilerleme takibi. Haftalık planlarınızı oluşturun, hedeflerinize ulaşın.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="shrink-0 pb-4 flex flex-wrap justify-center gap-4">
          <Link href="/login">
            <Button size="lg" className="shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105">
              Giriş Yap
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="outline" size="lg" className="border-2 backdrop-blur-sm transition-all duration-300 hover:scale-105">
              Kayıt Ol
            </Button>
          </Link>
        </div>

        {/* Özellik kartları - sayfaya sığacak şekilde */}
        <div className="flex-1 min-h-0 w-full max-w-5xl flex items-center justify-center">
          <FeatureCards />
        </div>
      </div>
    </main>
  );
}

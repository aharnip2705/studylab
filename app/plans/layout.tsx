import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { StudyLabLogo } from "@/components/study-lab-logo";

export default async function PlansLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/60 backdrop-blur-xl sticky top-0 z-10">
        <div className="flex h-16 items-center justify-between px-6 mx-auto max-w-5xl">
          <StudyLabLogo href="/plans" size="md" />
          <LogoutButton />
        </div>
      </header>
      {children}
    </div>
  );
}

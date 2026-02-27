import { redirect } from "next/navigation";
import { getIsAdmin } from "@/lib/actions/profile";
import { getAdminSubjects } from "@/lib/actions/admin-subjects";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminDersList } from "./admin-ders-list";

export const dynamic = "force-dynamic";

export default async function AdminDerslerPage() {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) redirect("/dashboard");

  const subjects = await getAdminSubjects();

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/dashboard/ayarlar"
          className="mb-4 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Ayarlara dön
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Ders Sembolleri
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Haftalık plandaki ders kutucuklarında görünecek sembolleri (ikonları) düzenleyin.
        </p>
      </div>

      <section>
        <AdminDersList subjects={subjects} />
      </section>
    </div>
  );
}

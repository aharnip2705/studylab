import { redirect } from "next/navigation";
import { getIsAdmin } from "@/lib/actions/profile";
import {
  getAdminVideos,
  getAdminSubjects,
} from "@/lib/actions/admin-videos";
import { AdminVideoForm } from "./admin-video-form";
import { AdminVideoList } from "./admin-video-list";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function AdminVideolarPage() {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) redirect("/dashboard");

  const [videos, subjects] = await Promise.all([
    getAdminVideos(),
    getAdminSubjects(),
  ]);

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
          Video Yönetimi
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          YouTube videoları ekleyin, düzenleyin veya pasif yapın.
        </p>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
          Yeni Video Ekle
        </h2>
        <AdminVideoForm subjects={subjects} />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
          Mevcut Videolar
        </h2>
        <AdminVideoList videos={videos} subjects={subjects} />
      </section>
    </div>
  );
}

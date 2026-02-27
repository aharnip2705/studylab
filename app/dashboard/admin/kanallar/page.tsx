import { redirect } from "next/navigation";
import { getIsAdmin } from "@/lib/actions/profile";
import { getAdminChannels } from "@/lib/actions/admin-channels";
import { getAdminSubjects } from "@/lib/actions/admin-videos";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminChannelForm } from "./admin-channel-form";
import { AdminChannelList } from "./admin-channel-list";

export default async function AdminKanallarPage() {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) redirect("/dashboard");

  const [channels, subjects] = await Promise.all([
    getAdminChannels(),
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
          Kanal Yönetimi
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          YouTube kanallarını ekleyin veya düzenleyin.
        </p>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
          Yeni Kanal Ekle
        </h2>
        <AdminChannelForm subjects={subjects} />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
          Mevcut Kanallar
        </h2>
        <AdminChannelList channels={channels} subjects={subjects} />
      </section>
    </div>
  );
}

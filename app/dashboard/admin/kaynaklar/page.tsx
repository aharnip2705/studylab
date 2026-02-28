import { redirect } from "next/navigation";
import { getIsAdmin } from "@/lib/actions/profile";
import { getAdminResources, getAdminPublishers } from "@/lib/actions/admin-resources";
import { getAdminSubjects } from "@/lib/actions/admin-subjects";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminPublishersList } from "./admin-publishers-list";
import { AdminResourceForm } from "./admin-resource-form";
import { AdminResourceList } from "./admin-resource-list";
import { AdminKitaplarImport } from "./admin-kitaplar-import";
import { AdminSyncBilgiSarmal } from "./admin-sync-bilgi-sarmal";

export default async function AdminKaynaklarPage() {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) redirect("/dashboard");
  const [publishers, resources, subjects] = await Promise.all([
    getAdminPublishers(), getAdminResources(), getAdminSubjects(),
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Kaynak Yönetimi</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">Önce yayın evlerini, sonra kaynakları yönetin.</p>
      </div>
      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Yayın evleri</h2>
        <AdminPublishersList publishers={publishers} />
      </section>
      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Yeni Kaynak Ekle</h2>
        <AdminResourceForm publishers={publishers} subjects={subjects} />
      </section>
      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Bot verilerini içe aktar</h2>
        <AdminKitaplarImport />
      </section>
      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Toplu güncelleme</h2>
        <AdminSyncBilgiSarmal />
      </section>
      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Mevcut Kaynaklar</h2>
        <AdminResourceList resources={resources} publishers={publishers} subjects={subjects} />
      </section>
    </div>
  );
}

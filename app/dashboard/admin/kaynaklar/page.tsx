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
import { AdminExamTabs } from "./admin-exam-tabs";

const PROGRAM_IDS = {
  YKS: "11111111-1111-1111-1111-111111111111",
  LGS: "33333333-3333-3333-3333-333333333333",
  KPSS: "22222222-2222-2222-2222-222222222222",
};

type ExamTab = keyof typeof PROGRAM_IDS;

export default async function AdminKaynaklarPage({
  searchParams,
}: {
  searchParams: Promise<{ exam?: string }>;
}) {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) redirect("/dashboard");

  const { exam } = await searchParams;
  const activeExam: ExamTab =
    exam === "LGS" || exam === "KPSS" ? (exam as ExamTab) : "YKS";
  const programId = PROGRAM_IDS[activeExam];

  const [publishers, resources, subjects] = await Promise.all([
    getAdminPublishers(programId),
    getAdminResources(programId),
    getAdminSubjects(programId),
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

      <AdminExamTabs activeExam={activeExam} />

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
          {activeExam} — Yayın evleri
        </h2>
        <AdminPublishersList publishers={publishers} programId={programId} />
      </section>
      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
          {activeExam} — Yeni Kaynak Ekle
        </h2>
        <AdminResourceForm publishers={publishers} subjects={subjects} programId={programId} />
      </section>
      {activeExam === "YKS" && (
        <>
          <section>
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Bot verilerini içe aktar</h2>
            <AdminKitaplarImport />
          </section>
          <section>
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Toplu güncelleme</h2>
            <AdminSyncBilgiSarmal />
          </section>
        </>
      )}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
          {activeExam} — Mevcut Kaynaklar
        </h2>
        <AdminResourceList resources={resources} publishers={publishers} subjects={subjects} />
      </section>
    </div>
  );
}

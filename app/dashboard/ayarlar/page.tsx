import { createClient } from "@/lib/supabase/server";
import { ThemeSettings } from "@/components/settings/theme-settings";
import { ProfileAndFieldForm } from "@/components/settings/profile-and-field-form";
import { SubscriptionInfo } from "@/components/settings/subscription-info";
import { AdminPanel } from "@/components/settings/admin-panel";
import { getIsAdmin } from "@/lib/actions/profile";

export default async function AyarlarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAdmin = await getIsAdmin();

  const displayName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Ayarlar
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Hesap ve tema ayarlarınızı yönetin.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Kişisel Bilgiler ve Alan Yönetimi
        </h2>
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <ProfileAndFieldForm
            fullName={displayName}
            email={user?.email ?? ""}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Tema
        </h2>
        <ThemeSettings />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Abonelik
        </h2>
        <SubscriptionInfo />
      </section>

      <AdminPanel isAdmin={isAdmin} />
    </div>
  );
}

"use client";

import Link from "next/link";
import { Video, Radio, Image, GraduationCap } from "lucide-react";

interface AdminPanelProps {
  isAdmin: boolean;
}

export function AdminPanel({ isAdmin }: AdminPanelProps) {
  if (!isAdmin) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
        Admin Yönetimi
      </h2>
      <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-6 dark:border-amber-800 dark:bg-amber-900/20">
        <p className="mb-4 text-sm text-amber-800 dark:text-amber-200">
          Admin hesabı ile aşağıdaki içerikleri düzenleyebilirsiniz.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/dashboard/admin/videolar"
            className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700/50"
          >
            <Video className="h-8 w-8 text-slate-600 dark:text-slate-400" />
            <div>
              <p className="font-medium text-slate-900 dark:text-white">Video Yönetimi</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                YouTube videoları ekle/düzenle
              </p>
            </div>
          </Link>
          <Link
            href="/dashboard/admin/kanallar"
            className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700/50"
          >
            <Radio className="h-8 w-8 text-slate-600 dark:text-slate-400" />
            <div>
              <p className="font-medium text-slate-900 dark:text-white">Kanal Yönetimi</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                YouTube kanallarını ekle/düzenle
              </p>
            </div>
          </Link>
          <Link
            href="/dashboard/admin/kaynaklar"
            className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700/50"
          >
            <Image className="h-8 w-8 text-slate-600 dark:text-slate-400" />
            <div>
              <p className="font-medium text-slate-900 dark:text-white">Kaynak Yönetimi</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ders ve deneme kaynaklarını yönet
              </p>
            </div>
          </Link>
          <Link
            href="/dashboard/admin/dersler"
            className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700/50"
          >
            <GraduationCap className="h-8 w-8 text-slate-600 dark:text-slate-400" />
            <div>
              <p className="font-medium text-slate-900 dark:text-white">Ders Sembolleri</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Haftalık plandaki ders ikonlarını düzenle
              </p>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}

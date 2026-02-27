"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateFullName } from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";

interface ProfileEditFormProps {
  initialFullName: string;
  email: string;
}

export function ProfileEditForm({ initialFullName, email }: ProfileEditFormProps) {
  const [fullName, setFullName] = useState(initialFullName);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    setFullName(initialFullName);
  }, [initialFullName]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const result = await updateFullName(fullName);
    setSaving(false);
    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setMessage({ type: "success", text: "Profil güncellendi." });
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-500 dark:text-slate-400">
          Ad Soyad
        </label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-500 dark:text-slate-400">
          E-posta
        </label>
        <p className="text-slate-900 dark:text-white">{email}</p>
        <p className="text-xs text-slate-500">E-posta değiştirmek için giriş sayfasından şifre sıfırlama kullanın.</p>
      </div>
      {message && (
        <p
          className={`text-sm ${
            message.type === "success" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
          }`}
        >
          {message.text}
        </p>
      )}
      <Button type="submit" disabled={saving}>
        {saving ? "Kaydediliyor..." : "Kaydet"}
      </Button>
    </form>
  );
}

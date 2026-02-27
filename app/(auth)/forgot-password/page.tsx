"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
        <div className="w-full max-w-md text-center space-y-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            E-posta gönderildi
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            <strong>{email}</strong> adresine şifre sıfırlama bağlantısı
            gönderildi. Lütfen e-postanızı kontrol edin.
          </p>
          <Link
            href="/login"
            className="inline-block text-primary-600 hover:text-primary-500 dark:text-primary-400 font-medium"
          >
            Giriş sayfasına dön
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Şifremi Unuttum
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            E-posta adresinizi girin, size şifre sıfırlama bağlantısı
            gönderelim.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm"
        >
          {error && (
            <div
              role="alert"
              className="rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-4 py-3 text-sm"
            >
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              E-posta
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="ornek@email.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary-600 px-4 py-2.5 font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Gönderiliyor..." : "Bağlantı Gönder"}
          </button>
        </form>

        <p className="text-center">
          <Link
            href="/login"
            className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400"
          >
            Giriş sayfasına dön
          </Link>
        </p>
      </div>
    </main>
  );
}

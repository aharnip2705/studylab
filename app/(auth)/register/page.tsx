"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/plans`,
        },
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (
          msg.includes("already registered") ||
          msg.includes("already exists") ||
          msg.includes("user already")
        ) {
          setError("Bu e-posta adresi zaten kayıtlı. Giriş yapmayı deneyin.");
        } else if (msg.includes("invalid") && msg.includes("email")) {
          setError("Geçerli bir e-posta adresi girin.");
        } else if (msg.includes("password")) {
          setError("Şifre en az 6 karakter olmalıdır.");
        } else if (msg.includes("rate limit") || msg.includes("too many")) {
          setError("Çok fazla deneme. Lütfen daha sonra tekrar deneyin.");
        } else {
          setError(error.message);
        }
        setLoading(false);
        return;
      }

      // E-posta onayı açıksa: mevcut e-posta ile kayıt denemesinde identities boş döner
      if (data?.user?.identities && data.user.identities.length === 0) {
        setError("Bu e-posta adresi zaten kayıtlı. Giriş yapmayı deneyin.");
        setLoading(false);
        return;
      }

      // E-posta onayı kapalıysa oturum açılır, direkt yönlendir
      if (data?.session) {
        router.push("/plans");
        router.refresh();
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Bir hata oluştu. Lütfen .env.local dosyanızı kontrol edin."
      );
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
        <div className="w-full max-w-md text-center space-y-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm">
          <div className="rounded-full bg-green-100 dark:bg-green-900/30 w-16 h-16 flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            E-postanızı kontrol edin
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Kayıt bağlantısı <strong>{email}</strong> adresine gönderildi.
            E-postanızdaki bağlantıya tıklayarak hesabınızı aktifleştirin. Giriş yapabilmeniz için onay gerekir.
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
            Kayıt Ol
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            YKS Ders Paneline ücretsiz katılın
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

          <div className="space-y-4">
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Ad Soyad
              </label>
              <input
                id="fullName"
                type="text"
                autoComplete="name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="Adınız Soyadınız"
              />
            </div>

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

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Şifre
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="En az 6 karakter"
              />
              <p className="mt-1 text-xs text-slate-500">
                En az 6 karakter olmalıdır
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary-600 px-4 py-2.5 font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Kayıt yapılıyor..." : "Kayıt Ol"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-600 dark:text-slate-400">
          Zaten hesabınız var mı?{" "}
          <Link
            href="/login"
            className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
          >
            Giriş yapın
          </Link>
        </p>
      </div>
    </main>
  );
}

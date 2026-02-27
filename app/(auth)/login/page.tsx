"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showResend, setShowResend] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/plans";

  async function handleResendConfirmation() {
    if (!email.trim()) return;
    setResendMsg(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
    });
    if (error) {
      setResendMsg("Gönderilemedi. Lütfen daha sonra tekrar deneyin.");
    } else {
      setResendMsg("Onay e-postası tekrar gönderildi. Lütfen kutunuzu kontrol edin.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      const msg = error.message.toLowerCase();
      if (
        msg.includes("email not confirmed") ||
        msg.includes("email_not_confirmed")
      ) {
        setError(
          "E-postanızı henüz onaylamadınız. Lütfen e-posta kutunuzu (ve spam klasörünü) kontrol edip onay bağlantısına tıklayın."
        );
        setShowResend(true);
      } else if (
        msg.includes("invalid login credentials") ||
        msg.includes("invalid_credentials")
      ) {
        setError("E-posta veya şifre hatalı.");
      } else {
        setError(error.message);
      }
      setShowResend(false);
      setLoading(false);
      return;
    }

    setShowResend(false);
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Giriş Yap
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            YKS Ders Paneline hoş geldiniz
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm"
        >
          {error && (
            <div
              role="alert"
              className="rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-4 py-3 text-sm space-y-2"
            >
              <p>{error}</p>
              {showResend && (
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  className="text-sm font-medium underline hover:no-underline"
                >
                  Onay e-postasını tekrar gönder
                </button>
              )}
            </div>
          )}
          {resendMsg && (
            <div
              role="status"
              className={`rounded-lg px-4 py-3 text-sm ${
                resendMsg.includes("Gönderilemedi")
                  ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                  : "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
              }`}
            >
              {resendMsg}
            </div>
          )}

          <div className="space-y-4">
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
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <Link
              href="/forgot-password"
              className="text-primary-600 hover:text-primary-500 dark:text-primary-400"
            >
              Şifremi unuttum
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary-600 px-4 py-2.5 font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-600 dark:text-slate-400">
          Hesabınız yok mu?{" "}
          <Link
            href="/register"
            className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
          >
            Kayıt olun
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
        <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 animate-pulse">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mx-auto mb-4" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mx-auto" />
        </div>
      </main>
    }>
      <LoginForm />
    </Suspense>
  );
}

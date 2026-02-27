import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  try {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const isAdminByEmail =
    user?.email ? adminEmails.includes(user.email.toLowerCase()) : false;

  let isAdminByProfile = false;

  if (user && !isAdminByEmail) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();
    isAdminByProfile = (profileData as { is_admin?: boolean } | null)?.is_admin === true;
  }

  const isAdmin = Boolean(user && (isAdminByEmail || isAdminByProfile));

  const isAuthPage =
    request.nextUrl.pathname === "/login" ||
    request.nextUrl.pathname === "/register" ||
    request.nextUrl.pathname === "/forgot-password";

  const isPublicPage = request.nextUrl.pathname === "/";
  const isPlansPage = request.nextUrl.pathname === "/plans";

  // Admin /plans sayfasındaysa direkt dashboard'a yönlendir
  if (user && isAdmin && isPlansPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Giriş yapmış kullanıcı anasayfa veya auth sayfalarındaysa yönlendir
  // Admin direkt dashboard'a, diğerleri plans'a
  if (user && (isAuthPage || isPublicPage)) {
    const url = request.nextUrl.clone();
    url.pathname = isAdmin ? "/dashboard" : "/plans";
    return NextResponse.redirect(url);
  }

  // Giriş yapmamış kullanıcı korumalı sayfalardaysa login'e yönlendir
  if (!user && !isAuthPage && !isPublicPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  } catch (e) {
    console.error("Middleware error:", e);
  }
  return response;
}

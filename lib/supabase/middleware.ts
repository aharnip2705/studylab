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

  const pathname = request.nextUrl.pathname;

  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password";
  const isPublicPage = pathname === "/";
  const isPlansPage = pathname === "/plans";
  const isOnboardingPage = pathname === "/onboarding";

  if (!user && !isAuthPage && !isPublicPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  if (!user) return response;

  const { data: profileData } = await supabase
    .from("profiles")
    .select("is_admin, exam_type")
    .eq("id", user.id)
    .single();

  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const isAdminByEmail = user.email
    ? adminEmails.includes(user.email.toLowerCase())
    : false;
  const isAdminByProfile =
    (profileData as { is_admin?: boolean } | null)?.is_admin === true;
  const isAdmin = isAdminByEmail || isAdminByProfile;

  const examType = (profileData as { exam_type?: string } | null)?.exam_type;
  const hasCompletedOnboarding = !!examType;

  if (!hasCompletedOnboarding && !isOnboardingPage && !isAuthPage && !isPublicPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/onboarding";
    return NextResponse.redirect(url);
  }

  if (hasCompletedOnboarding && isOnboardingPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  if (isAdmin && isPlansPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  if (isAuthPage || isPublicPage) {
    const url = request.nextUrl.clone();
    if (!hasCompletedOnboarding) {
      url.pathname = "/onboarding";
    } else {
      url.pathname = isAdmin ? "/dashboard" : "/plans";
    }
    return NextResponse.redirect(url);
  }

  } catch (e) {
    console.error("Middleware error:", e);
  }
  return response;
}

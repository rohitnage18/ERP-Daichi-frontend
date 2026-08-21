"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, User, Lock, ArrowRight } from "lucide-react";
import { Logo } from "@/components/branding/Logo";
import { wakeApi } from "@/lib/keepalive";
import { getApiBaseUrl } from "@/lib/api";

function formatSignInError(error: string): string {
  const decoded = decodeURIComponent(error);
  if (
    decoded === "CredentialsSignin" ||
    decoded.toLowerCase().includes("credential")
  ) {
    return "Invalid email or password. Please try again.";
  }
  if (
    decoded.toLowerCase().includes("fetch failed") ||
    decoded.toLowerCase().includes("cannot reach") ||
    decoded.toLowerCase().includes("localhost") ||
    decoded.toLowerCase().includes("api_url")
  ) {
    return "Cannot reach the API server. Set API_URL and NEXT_PUBLIC_API_URL on Vercel to your Render backend URL, then redeploy.";
  }
  return decoded.length > 8 && decoded.length < 200
    ? decoded
    : "Login failed. Please try again.";
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [companyStats, setCompanyStats] = useState<{
    activeDealers: number;
    products: number;
  } | null>(null);

  useEffect(() => {
    wakeApi();
    let cancelled = false;

    const parseStats = (data: unknown) => {
      const body = data as { activeDealers?: number; products?: number };
      const activeDealers = Number(body?.activeDealers);
      const products = Number(body?.products);
      if (!Number.isFinite(activeDealers) || !Number.isFinite(products)) return null;
      return { activeDealers, products };
    };

    const load = async () => {
      const base = getApiBaseUrl().replace(/\/$/, "");
      const urls = [
        `${base}/stats`,
        `${base}/health`,
        "/api/public/stats",
        `${base}/api/public/stats`,
      ];
      for (let attempt = 0; attempt < 6 && !cancelled; attempt++) {
        for (const url of urls) {
          try {
            const res = await fetch(url, {
              cache: "no-store",
              headers: { Accept: "application/json" },
            });
            if (!res.ok) continue;
            const stats = parseStats(await res.json());
            if (stats && !cancelled) {
              setCompanyStats(stats);
              return;
            }
          } catch {
            // try the other URL / retry while backend wakes
          }
        }
        await new Promise((resolve) => setTimeout(resolve, 1200 * (attempt + 1)));
      }
    };

    void load();
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 20_000);
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(formatSignInError(result.error));
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (userEmail: string) => {
    setEmail(userEmail);
    setPassword("password123");
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: userEmail,
        password: "password123",
        redirect: false,
      });

      if (result?.error) {
        setError(formatSignInError(result.error));
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side — branded hero */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "linear-gradient(135deg, #071F17 0%, #0B2E22 45%, #14532D 100%), url('/branding/login-hero-bg.svg')",
          }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#071F17]/75 via-[#0B2E22]/55 to-[#14532D]/65" />

        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <Logo inverted className="drop-shadow-md" />

          <div className="space-y-6 max-w-lg">
            <h2 className="text-4xl font-bold leading-tight text-white drop-shadow-sm">
              Empowering Agriculture
              <br />
              <span className="text-emerald-200">Across Maharashtra</span>
            </h2>
            <p className="text-lg leading-relaxed text-white/90 drop-shadow-sm">
              Streamline your dealer network, manage orders, track logistics,
              and grow your agricultural business with our comprehensive ERP solution.
            </p>
            <div className="flex items-center gap-8 pt-4">
              <div>
                <p className="text-3xl font-bold text-white">
                  {companyStats ? companyStats.activeDealers.toLocaleString("en-IN") : "…"}
                </p>
                <p className="text-sm text-white/80">Active Dealers</p>
              </div>
              <div className="h-12 w-px bg-white/25" />
              <div>
                <p className="text-3xl font-bold text-white">
                  {companyStats ? companyStats.products.toLocaleString("en-IN") : "…"}
                </p>
                <p className="text-sm text-white/80">Products</p>
              </div>
            </div>
          </div>

          <div className="text-sm text-white/70">
            © 2026 Daichi International. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Side — Login Form */}
      <div className="flex flex-1 items-center justify-center bg-slate-50 p-6 sm:p-8">
        <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-200/50">
          <div className="mb-2 flex justify-center lg:hidden">
            <Logo />
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Welcome back</h2>
            <p className="mt-2 text-slate-600">
              Sign in to your account to continue
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-600 flex items-center gap-2">
              <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-medium text-slate-800">
                Email Address
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 border-slate-200 bg-white pl-10 text-slate-900 placeholder:text-slate-400 focus-visible:border-primary focus-visible:ring-primary"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-medium text-slate-800">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 border-slate-200 bg-white pl-10 pr-10 text-slate-900 placeholder:text-slate-400 focus-visible:border-primary focus-visible:ring-primary"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <Button type="submit" className="h-12 w-full text-base font-semibold" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-slate-500">
                Quick Demo Access
              </span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => quickLogin("sales@xenvolt.com")}
              disabled={loading}
              className="flex flex-col items-center gap-2 rounded-xl border-2 border-slate-200 bg-white p-3 transition-all hover:border-sky-500 hover:bg-sky-50 disabled:opacity-50"
            >
              <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <span className="text-xs font-medium text-slate-700">Sales</span>
            </button>
            <button
              type="button"
              onClick={() => quickLogin("admin@xenvolt.com")}
              disabled={loading}
              className="flex flex-col items-center gap-2 rounded-xl border-2 border-slate-200 bg-white p-3 transition-all hover:border-violet-500 hover:bg-violet-50 disabled:opacity-50"
            >
              <div className="h-9 w-9 rounded-full bg-purple-100 flex items-center justify-center">
                <svg className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-slate-700">Admin</span>
            </button>
            <button
              type="button"
              onClick={() => quickLogin("logistics@xenvolt.com")}
              disabled={loading}
              className="flex flex-col items-center gap-2 rounded-xl border-2 border-slate-200 bg-white p-3 transition-all hover:border-primary hover:bg-accent disabled:opacity-50"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100">
                <svg className="h-4 w-4 text-brand-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <span className="text-xs font-medium text-slate-700">Logistics</span>
            </button>
            <button
              type="button"
              onClick={() => quickLogin("account@xenvolt.com")}
              disabled={loading}
              className="flex flex-col items-center gap-2 rounded-xl border-2 border-slate-200 bg-white p-3 transition-all hover:border-amber-500 hover:bg-amber-50 disabled:opacity-50"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100">
                <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-slate-700">Account</span>
            </button>
          </div>

          <p className="text-center text-xs text-slate-500">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}

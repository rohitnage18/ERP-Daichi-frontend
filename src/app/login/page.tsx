"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, User, Lock, ArrowRight } from "lucide-react";
import { Logo } from "@/components/branding/Logo";

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

          <p className="text-center text-xs text-slate-500">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}

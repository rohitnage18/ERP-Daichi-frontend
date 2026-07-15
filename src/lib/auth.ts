import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { apiUrl, getApiBaseUrl } from "./api";

function assertApiConfigured() {
  const base = getApiBaseUrl();
  const isProd = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
  if (isProd && (/localhost|127\.0\.0\.1/.test(base) || !base)) {
    throw new Error(
      "API_URL / NEXT_PUBLIC_API_URL is missing or still set to localhost. Set both to your Render backend URL in Vercel, then redeploy."
    );
  }
  return base;
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    // Keep in sync with backend JWT expiresIn (12h)
    maxAge: 12 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        assertApiConfigured();

        const loginUrl = apiUrl("/api/auth/login");
        const payload = JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        });

        let res: Response | null = null;
        let lastErr: unknown;
        // Render free tier can sleep — retry once after a short wait
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            res = await fetch(loginUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: payload,
            });
            lastErr = null;
            break;
          } catch (err) {
            lastErr = err;
            console.error("[auth] login fetch failed", { attempt, loginUrl, err });
            if (attempt === 0) {
              await new Promise((r) => setTimeout(r, 2500));
            }
          }
        }

        if (!res) {
          const base = getApiBaseUrl();
          throw new Error(
            `Cannot reach backend at ${base}. Wake the Render service (/health) and check API_URL on Vercel.`
          );
        }

        if (!res.ok) {
          console.error("[auth] login rejected", res.status, await res.text().catch(() => ""));
          return null;
        }

        const data = await res.json();
        return {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
          employeeId: data.user.employeeId,
          zoneId: data.user.zoneId,
          zoneName: data.user.zoneName,
          accessToken: data.token,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.employeeId = user.employeeId;
        token.zoneId = user.zoneId;
        token.zoneName = user.zoneName;
        token.accessToken = (user as { accessToken?: string }).accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.employeeId = token.employeeId as string;
        session.user.zoneId = token.zoneId as string | null;
        session.user.zoneName = token.zoneName as string | null;
        (session as { accessToken?: string }).accessToken = token.accessToken as string;
      }
      return session;
    },
  },
};

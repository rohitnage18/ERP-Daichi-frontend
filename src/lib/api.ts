import { getSession, signOut } from "next-auth/react";

export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  }
  return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
}

export function apiUrl(path: string): string {
  const base = getApiBaseUrl().replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

type SessionWithToken = { accessToken?: string } | null;

let cachedToken: { value: string; at: number } | null = null;
const TOKEN_CACHE_MS = 60_000;

function clearTokenCache() {
  cachedToken = null;
}

export { clearTokenCache };

/** Wait briefly for NextAuth session/token — avoids race 401s on page load. */
async function resolveAccessToken(): Promise<string | null> {
  if (cachedToken && Date.now() - cachedToken.at < TOKEN_CACHE_MS) {
    return cachedToken.value;
  }

  let session = (await getSession()) as SessionWithToken;
  if (session?.accessToken) {
    cachedToken = { value: session.accessToken, at: Date.now() };
    return session.accessToken;
  }

  for (let i = 0; i < 6; i++) {
    await new Promise((r) => setTimeout(r, 50));
    session = (await getSession()) as SessionWithToken;
    if (session?.accessToken) {
      cachedToken = { value: session.accessToken, at: Date.now() };
      return session.accessToken;
    }
  }
  return null;
}

let signingOut = false;

async function handleUnauthorized() {
  clearTokenCache();
  if (typeof window === "undefined" || signingOut) return;
  if (window.location.pathname.startsWith("/login")) return;
  signingOut = true;
  try {
    await signOut({ callbackUrl: "/login" });
  } finally {
    signingOut = false;
  }
}

/**
 * Call the Daichi backend API with JWT from NextAuth session.
 */
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);

  if (!headers.has("Content-Type") && init?.body && typeof init.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  const token = await resolveAccessToken();
  if (!token) {
    await handleUnauthorized();
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(apiUrl(path), {
    ...init,
    headers,
  });

  if (res.status === 401) {
    await handleUnauthorized();
  }

  return res;
}

/** Extract error message from API JSON body */
export async function getApiError(res: Response, fallback = "Request failed"): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.error === "string") return data.error;
    if (typeof data?.message === "string") return data.message;
    return fallback;
  } catch {
    return fallback;
  }
}

/** Coerce unknown API payload to an array — prevents `.map is not a function` crashes. */
export function asArray<T>(data: unknown): T[] {
  return Array.isArray(data) ? (data as T[]) : [];
}

/** Fetch a list endpoint; always resolves to an array (empty on error or non-array body). */
export async function apiFetchJsonArray<T>(
  path: string,
  init?: RequestInit
): Promise<T[]> {
  try {
    const res = await apiFetch(path, init);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      console.error(`API ${path} failed (${res.status}):`, data);
      return [];
    }
    return asArray<T>(data);
  } catch (error) {
    console.error(`API ${path} error:`, error);
    return [];
  }
}

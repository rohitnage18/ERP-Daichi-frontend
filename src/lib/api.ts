import { getSession } from "next-auth/react";

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

/**
 * Call the Daichi backend API with JWT from NextAuth session.
 */
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const session = await getSession();
  const headers = new Headers(init?.headers);

  if (!headers.has("Content-Type") && init?.body && typeof init.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  const token = (session as { accessToken?: string } | null)?.accessToken;
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(apiUrl(path), {
    ...init,
    headers,
  });
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

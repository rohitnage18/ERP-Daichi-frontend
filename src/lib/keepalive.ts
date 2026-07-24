import { getApiBaseUrl } from "./api";

/** Ping Render /health so free-tier doesn't sleep mid-demo. */
export function wakeApi(): void {
  if (typeof window === "undefined") return;
  const base = getApiBaseUrl().replace(/\/$/, "");
  if (!base || /localhost|127\.0\.0\.1/.test(base)) return;

  // fire-and-forget — never block UI
  fetch(`${base}/health`, { method: "GET", mode: "cors", cache: "no-store" }).catch(() => {});
}

const KEEP_ALIVE_MS = 4 * 60 * 1000;

/** While the app tab is open, ping health every few minutes. */
export function startApiKeepAlive(): () => void {
  if (typeof window === "undefined") return () => {};

  wakeApi();
  const id = window.setInterval(() => {
    if (document.visibilityState === "visible") wakeApi();
  }, KEEP_ALIVE_MS);

  const onFocus = () => wakeApi();
  window.addEventListener("focus", onFocus);

  return () => {
    window.clearInterval(id);
    window.removeEventListener("focus", onFocus);
  };
}

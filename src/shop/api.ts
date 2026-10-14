import { getLocale } from "./i18n";
export async function api<T = any>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const form = body instanceof FormData;
  const response = await fetch("/api" + path, {
    method,
    credentials: "same-origin",
    headers: {
      "X-Vassel-Client": "web",
      ...(!form && body !== undefined
        ? { "Content-Type": "application/json" }
        : {}),
    },
    body: body === undefined ? undefined : form ? body : JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({
    error: "Server tidak dapat dijangkau. Silakan coba lagi.",
  }));
  if (!response.ok)
    throw new Error(data.error || "Terjadi kesalahan. Coba lagi.");
  return data;
}
export const money = (n: number) =>
  "Rp " + Math.round(n).toLocaleString("id-ID");
export const date = (s: string) =>
  new Date(s).toLocaleDateString(getLocale(), {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
export const statusName: Record<string, string> = {
  baru: "Menunggu pembayaran",
  dibayar: "Dibayar",
  dikemas: "Sedang dikemas",
  dikirim: "Dalam pengiriman",
  selesai: "Selesai",
  batal: "Dibatalkan",
};
export function stored<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}
export function persist(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
export const report = (kind: string, productId?: string) =>
  api("/events", "POST", { kind, productId }).catch(() => {});

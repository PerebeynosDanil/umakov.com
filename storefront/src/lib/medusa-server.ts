/** Серверные запросы к Store API Medusa (RSC и API-роуты). */

const BASE =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";
const KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";

export async function medusaFetch<T>(
  path: string,
  params: Record<string, string | number | string[] | undefined> = {},
  opts: { revalidate?: number } = {}
): Promise<T> {
  const url = new URL(path, BASE);
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === "") continue;
    if (Array.isArray(v)) {
      for (const item of v) url.searchParams.append(k, item);
    } else {
      url.searchParams.set(k, String(v));
    }
  }
  const res = await fetch(url, {
    headers: { "x-publishable-api-key": KEY },
    ...(opts.revalidate !== undefined
      ? { next: { revalidate: opts.revalidate } }
      : { cache: "no-store" as const }),
  });
  if (!res.ok) {
    throw new Error(`Medusa ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

let cachedRegionId: string | null = null;

/** id региона Europe (EUR) — нужен, чтобы API считал цены. */
export async function getRegionId(): Promise<string> {
  if (cachedRegionId) return cachedRegionId;
  const { regions } = await medusaFetch<{ regions: { id: string }[] }>(
    "/store/regions"
  );
  cachedRegionId = regions[0]?.id ?? "";
  return cachedRegionId;
}

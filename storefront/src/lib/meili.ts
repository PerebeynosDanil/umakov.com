import type { Facets } from "./catalog-index";

/**
 * Поиск и фасеты через Meilisearch (сервер). Если MEILISEARCH_HOST не
 * задан или сервис недоступен — возвращаем null, страница каталога
 * переключается на запасной режим (встроенный индекс).
 */

const HOST = process.env.MEILISEARCH_HOST || "";
const KEY = process.env.MEILISEARCH_KEY || "";
const INDEX = "products";

/** Ключ фасета — так же, как в индексаторе бэкенда. */
export function facetKey(label: string): string {
  return label.replace(/[^\p{L}\p{N}]+/gu, "_");
}
export function facetLabel(key: string): string {
  return key.replace(/_/g, " ");
}

async function meili<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${HOST}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(3000),
  });
  if (!res.ok) throw new Error(`Meilisearch ${res.status}`);
  return res.json();
}

let cachedKeys: { at: number; keys: string[] } | null = null;

async function getFacetAttributes(): Promise<string[]> {
  if (cachedKeys && Date.now() - cachedKeys.at < 10 * 60 * 1000) {
    return cachedKeys.keys;
  }
  const attrs = await meili<string[]>(
    `/indexes/${INDEX}/settings/filterable-attributes`
  );
  const keys = attrs.filter((a) => a.startsWith("facets."));
  cachedKeys = { at: Date.now(), keys };
  return keys;
}

export type MeiliResult = { ids: string[]; total: number; facets: Facets };

export async function meiliSearch(params: {
  q: string;
  categoryIds?: string[];
  /** фильтры по подписям групп: { "Surface finish": ["Satined"] } */
  filters: Record<string, string[]>;
  sort: "title" | "new";
  page: number;
  pageSize: number;
}): Promise<MeiliResult | null> {
  if (!HOST) return null;
  try {
    const facetAttrs = await getFacetAttributes();

    const filter: string[] = [];
    if (params.categoryIds?.length) {
      const list = params.categoryIds.map((id) => JSON.stringify(id)).join(",");
      filter.push(`categories IN [${list}]`);
    }
    for (const [label, values] of Object.entries(params.filters)) {
      if (!values.length) continue;
      const attr = `facets.${facetKey(label)}`;
      if (!facetAttrs.includes(attr)) continue;
      filter.push(
        `(${values.map((v) => `${attr} = ${JSON.stringify(v)}`).join(" OR ")})`
      );
    }

    const res = await meili<{
      hits: { id: string }[];
      totalHits: number;
      facetDistribution?: Record<string, Record<string, number>>;
    }>(`/indexes/${INDEX}/search`, {
      q: params.q,
      filter,
      facets: facetAttrs,
      sort: params.sort === "new" ? ["created_at:desc"] : ["title:asc"],
      page: params.page,
      hitsPerPage: params.pageSize,
      attributesToRetrieve: ["id"],
    });

    const facets: Facets = {};
    for (const [attr, dist] of Object.entries(res.facetDistribution ?? {})) {
      const values = Object.entries(dist)
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count);
      if (values.length > 1) {
        facets[facetLabel(attr.replace(/^facets\./, ""))] = values;
      }
    }

    return {
      ids: res.hits.map((h) => h.id),
      total: res.totalHits,
      facets,
    };
  } catch {
    return null; // недоступен — работаем без него
  }
}

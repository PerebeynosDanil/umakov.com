import { medusaFetch } from "./medusa-server";

/**
 * Лёгкий индекс каталога в памяти сервера: id, название, дата, значения
 * опций и категории каждого товара. Нужен для фасетных фильтров со
 * счётчиками (Material, Surface finish, …) — Store API Medusa таких
 * агрегаций не умеет. Обновляется раз в 10 минут. Когда подключим
 * Meilisearch, этот модуль уйдёт на пенсию.
 */

export type IndexedProduct = {
  id: string;
  title: string;
  created: number;
  thumbnail: string | null;
  /** значения опций: { "Material": ["Stainless steel AISI 304", …] } */
  opts: Record<string, string[]>;
  cats: string[];
};

type RawProduct = {
  id: string;
  title: string;
  created_at: string;
  thumbnail: string | null;
  options?: { title: string; values?: { value: string }[] }[] | null;
  categories?: { id: string }[] | null;
};

const TTL_MS = 10 * 60 * 1000;
let cache: { at: number; items: IndexedProduct[] } | null = null;
let building: Promise<IndexedProduct[]> | null = null;

async function buildIndex(): Promise<IndexedProduct[]> {
  const items: IndexedProduct[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { products } = await medusaFetch<{ products: RawProduct[] }>(
      "/store/products",
      {
        limit: 1000,
        offset,
        fields: "id,title,created_at,thumbnail,*options.values,*categories",
      },
      { revalidate: 600 }
    );
    for (const p of products) {
      const opts: Record<string, string[]> = {};
      for (const o of p.options ?? []) {
        if (!o.title || o.title === "Title") continue;
        const vals = (o.values ?? []).map((v) => v.value).filter(Boolean);
        if (vals.length) opts[o.title] = vals;
      }
      items.push({
        id: p.id,
        title: p.title,
        created: Date.parse(p.created_at) || 0,
        thumbnail: p.thumbnail ?? null,
        opts,
        cats: (p.categories ?? []).map((c) => c.id),
      });
    }
    if (products.length < 1000) break;
  }
  return items;
}

export async function getCatalogIndex(): Promise<IndexedProduct[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.items;
  if (!building) {
    building = buildIndex()
      .then((items) => {
        cache = { at: Date.now(), items };
        return items;
      })
      .finally(() => {
        building = null;
      });
  }
  return building;
}

export type Facets = Record<string, { value: string; count: number }[]>;

/** Приоритет групп фильтров — как на старом сайте. */
const GROUP_ORDER = [
  "Material",
  "Surface finish",
  "Effect",
  "Color",
  "L",
  "Filling",
  "Glass t",
  "Mark",
];

function matchesFilters(
  p: IndexedProduct,
  filters: Record<string, string[]>,
  skipGroup?: string
): boolean {
  for (const [group, values] of Object.entries(filters)) {
    if (group === skipGroup) continue;
    const have = p.opts[group];
    if (!have || !values.some((v) => have.includes(v))) return false;
  }
  return true;
}

/**
 * Фильтрация + фасеты. Счётчик значения = сколько товаров получится,
 * если добавить это значение (фильтры остальных групп учитываются).
 */
export function applyFacets(
  items: IndexedProduct[],
  categoryIds: string[] | undefined,
  filters: Record<string, string[]>,
  sort: "title" | "new"
): { ids: string[]; facets: Facets } {
  const catSet = categoryIds ? new Set(categoryIds) : null;
  const inCategory = catSet
    ? items.filter((p) => p.cats.some((c) => catSet.has(c)))
    : items;

  const matched = inCategory.filter((p) => matchesFilters(p, filters));
  matched.sort((a, b) =>
    sort === "new" ? b.created - a.created : a.title.localeCompare(b.title)
  );

  const facets: Facets = {};
  const groups = new Set<string>();
  for (const p of inCategory) {
    for (const g of Object.keys(p.opts)) groups.add(g);
  }
  const ordered = [...groups].sort((a, b) => {
    const ia = GROUP_ORDER.indexOf(a);
    const ib = GROUP_ORDER.indexOf(b);
    if (ia !== -1 || ib !== -1) {
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    }
    return a.localeCompare(b);
  });

  for (const group of ordered.slice(0, 8)) {
    const counts = new Map<string, number>();
    for (const p of inCategory) {
      if (!matchesFilters(p, filters, group)) continue;
      for (const v of p.opts[group] ?? []) {
        counts.set(v, (counts.get(v) ?? 0) + 1);
      }
    }
    const values = [...counts.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);
    if (values.length > 1) facets[group] = values;
  }

  return { ids: matched.map((p) => p.id), facets };
}

/** Фото первого товара каждой категории — иконки для меню и плиток. */
export function directCategoryImages(
  items: IndexedProduct[]
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const p of items) {
    if (!p.thumbnail) continue;
    for (const c of p.cats) {
      if (!(c in out)) out[c] = p.thumbnail;
    }
  }
  return out;
}

/** Число товаров в поддереве категории (для плиток подкатегорий). */
export function countInSubtree(
  items: IndexedProduct[],
  subtree: string[]
): number {
  const set = new Set(subtree);
  let n = 0;
  for (const p of items) if (p.cats.some((c) => set.has(c))) n++;
  return n;
}

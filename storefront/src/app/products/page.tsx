import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Search, SlidersHorizontal } from "lucide-react";
import type { HttpTypes } from "@medusajs/types";
import { medusaFetch, getRegionId } from "@/lib/medusa-server";
import { formatPrice } from "@/lib/format";
import { getCategoryTree, pathTo, subtreeIds } from "@/lib/categories";
import {
  applyFacets,
  countInSubtree,
  getCatalogIndex,
  type Facets,
} from "@/lib/catalog-index";
import { meiliSearch } from "@/lib/meili";
import { SortSelect } from "@/components/sort-select";
import { FacetPanel } from "@/components/facet-panel";
import { RowActions, type RowProduct } from "@/components/row-actions";

export const metadata = { title: "Продукты" };

const PAGE_SIZE = 24;
const PRODUCT_FIELDS =
  "*variants.calculated_price,*variants.options,*options,*options.values";

type Price = { with_vat: number | null; without_vat: number | null };

function variantPrice(v: HttpTypes.StoreProductVariant): Price {
  const cp = v.calculated_price;
  const base = cp?.calculated_amount ?? null;
  return {
    with_vat: cp?.calculated_amount_with_tax ?? base,
    without_vat: cp?.calculated_amount_without_tax ?? base,
  };
}

function minPrice(p: HttpTypes.StoreProduct): Price & { many: boolean } {
  const prices = (p.variants ?? [])
    .map(variantPrice)
    .filter((x) => x.with_vat !== null);
  if (!prices.length) return { with_vat: null, without_vat: null, many: false };
  const min = prices.reduce((a, b) => (b.with_vat! < a.with_vat! ? b : a));
  const distinct = new Set(prices.map((x) => x.with_vat)).size > 1;
  return { ...min, many: distinct };
}

function toRowProduct(p: HttpTypes.StoreProduct): RowProduct {
  return {
    id: p.id,
    title: p.title,
    handle: p.handle,
    thumbnail: p.thumbnail ?? null,
    options: (p.options ?? []).map((o) => ({
      id: o.id,
      title: o.title,
      values: (o.values ?? []).map((v) => ({ id: v.id, value: v.value })),
    })),
    variants: (p.variants ?? []).map((v) => ({
      id: v.id,
      sku: v.sku ?? null,
      options: (v.options ?? []).map((ov) => ({
        option_id: ov.option_id ?? "",
        value: ov.value,
      })),
      ...variantPrice(v),
    })),
  };
}

export default async function ProductsPage({
  searchParams,
}: PageProps<"/products">) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const q = typeof sp.q === "string" ? sp.q : "";
  const cat = typeof sp.cat === "string" ? sp.cat : "";
  const sort = sp.sort === "new" ? "new" : "";

  // фильтры характеристик из URL: f_<группа>=значение (повторяемые)
  const filters: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(sp)) {
    if (!key.startsWith("f_") || value === undefined) continue;
    filters[key.slice(2)] = Array.isArray(value) ? value : [value];
  }

  const [region_id, tree] = await Promise.all([getRegionId(), getCategoryTree()]);
  const crumbs = cat ? pathTo(tree, cat) : [];
  const subtree = cat ? subtreeIds(tree, cat) : undefined;

  let products: HttpTypes.StoreProduct[] = [];
  let count = 0;
  let facets: Facets = {};
  let subcatTiles: { id: string; name: string; count: number }[] = [];

  const fetchPage = async (pageIds: string[]) => {
    if (!pageIds.length) return;
    const res = await medusaFetch<{ products: HttpTypes.StoreProduct[] }>(
      "/store/products",
      { id: pageIds, limit: PAGE_SIZE, region_id, fields: PRODUCT_FIELDS }
    );
    const byId = new Map(res.products.map((p) => [p.id, p]));
    products = pageIds
      .map((id) => byId.get(id))
      .filter((p): p is HttpTypes.StoreProduct => Boolean(p));
  };

  // основной путь — Meilisearch (поиск с опечатками + фасеты вместе)
  const meili = await meiliSearch({
    q,
    categoryIds: subtree,
    filters,
    sort: sort === "new" ? "new" : "title",
    page,
    pageSize: PAGE_SIZE,
  });

  if (meili) {
    count = meili.total;
    facets = meili.facets;
    await fetchPage(meili.ids);
  } else if (q) {
    // запасной режим: текстовый поиск через Medusa, без фасетов
    const res = await medusaFetch<{
      products: HttpTypes.StoreProduct[];
      count: number;
    }>("/store/products", {
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      order: sort === "new" ? "-created_at" : "title",
      region_id,
      fields: PRODUCT_FIELDS,
      q,
      category_id: subtree?.slice(0, 300),
    });
    products = res.products;
    count = res.count;
  } else {
    // запасной режим: встроенный индекс каталога
    const index = await getCatalogIndex();
    const applied = applyFacets(index, subtree, filters, sort === "new" ? "new" : "title");
    facets = applied.facets;
    count = applied.ids.length;
    await fetchPage(applied.ids.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE));
  }

  // плитки подкатегорий выбранного раздела (счётчики — из встроенного индекса)
  if (cat && !q) {
    const findNode = (
      nodes: typeof tree.roots
    ): (typeof tree.roots)[number] | undefined => {
      for (const n of nodes) {
        if (n.id === cat) return n;
        const hit = findNode(n.children);
        if (hit) return hit;
      }
      return undefined;
    };
    const node = findNode(tree.roots);
    if (node && node.children.length > 0) {
      const index = await getCatalogIndex();
      subcatTiles = node.children
        .map((c) => ({
          id: c.id,
          name: c.name,
          count: countInSubtree(index, subtreeIds(tree, c.id)),
        }))
        .filter((t) => t.count > 0);
    }
  }

  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const keepParams = (extra: Record<string, string>) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (cat) p.set("cat", cat);
    if (sort) p.set("sort", sort);
    for (const [g, vals] of Object.entries(filters)) {
      vals.forEach((v) => p.append(`f_${g}`, v));
    }
    for (const [k, v] of Object.entries(extra)) p.set(k, v);
    return `/products?${p.toString()}`;
  };

  const hasFilters =
    Object.keys(facets).length > 0 ||
    Object.values(filters).some((v) => v.length > 0);

  const sidebar = (
    <>
      <p className="flex items-center gap-2 px-1 pb-1 text-xs font-bold uppercase tracking-wider text-muted">
        <SlidersHorizontal className="size-3.5" />
        Фильтры
      </p>
      <FacetPanel facets={facets} filters={filters} base={{ cat, sort, q }} />
    </>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <nav className="flex flex-wrap items-center gap-1 text-sm text-muted">
        <Link href="/products" className="hover:text-ink">
          Продукты
        </Link>
        {crumbs.map((c, i) => (
          <span key={c.id} className="flex items-center gap-1">
            <ChevronRight className="size-3.5" />
            {i === crumbs.length - 1 ? (
              <span className="font-semibold text-ink">{c.name}</span>
            ) : (
              <Link href={`/products?cat=${c.id}`} className="hover:text-ink">
                {c.name}
              </Link>
            )}
          </span>
        ))}
      </nav>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {crumbs.length ? crumbs[crumbs.length - 1].name : "Продукты"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {q ? `Найдено по запросу «${q}»: ${count}` : `Товаров: ${count}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <form action="/products" className="flex items-center gap-2">
            {cat && <input type="hidden" name="cat" value={cat} />}
            {sort && <input type="hidden" name="sort" value={sort} />}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Поиск по каталогу…"
                className="w-56 rounded-lg border border-line bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-bronze"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-ink px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-85"
            >
              Найти
            </button>
          </form>
          <SortSelect />
        </div>
      </div>

      {subcatTiles.length > 0 && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {subcatTiles.map((t) => (
            <Link
              key={t.id}
              href={`/products?cat=${t.id}`}
              className="flex items-center justify-between gap-2 rounded-xl border border-line bg-white px-4 py-3 text-sm font-bold transition-shadow hover:shadow-md"
            >
              <span className="min-w-0 truncate">{t.name}</span>
              <span className="shrink-0 rounded-full bg-paper px-2 py-0.5 text-xs font-semibold text-muted">
                {t.count}
              </span>
            </Link>
          ))}
        </div>
      )}

      <div
        className={`mt-6 ${hasFilters ? "grid gap-8 lg:grid-cols-[250px_1fr]" : ""}`}
      >
        {hasFilters && (
          <aside className="hidden lg:block">
            <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2">
              {sidebar}
            </div>
          </aside>
        )}
        {hasFilters && (
          <details className="rounded-xl border border-line bg-white p-4 lg:hidden">
            <summary className="flex items-center gap-2 text-sm font-bold">
              <SlidersHorizontal className="size-4" />
              Фильтры
            </summary>
            <div className="mt-3 max-h-[70vh] overflow-y-auto">{sidebar}</div>
          </details>
        )}

        <div>
          {products.length === 0 ? (
            <p className="mt-16 text-center text-muted">Ничего не найдено.</p>
          ) : (
            <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
              {products.map((p) => {
                const price = minPrice(p);
                const sku = p.variants?.[0]?.sku;
                const specOptions = (p.options ?? [])
                  .filter((o) => o.title !== "Title")
                  .slice(0, 4);
                return (
                  <li key={p.id} className="flex flex-wrap gap-4 p-4 sm:flex-nowrap">
                    <Link
                      href={`/products/${p.handle}`}
                      className="relative size-24 shrink-0 overflow-hidden rounded-lg border border-line bg-white"
                    >
                      {p.thumbnail ? (
                        <Image
                          src={p.thumbnail}
                          alt={p.title}
                          fill
                          sizes="96px"
                          className="object-contain p-2"
                        />
                      ) : (
                        <span className="grid h-full place-items-center text-[10px] text-muted">
                          Без фото
                        </span>
                      )}
                    </Link>

                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/products/${p.handle}`}
                        className="font-bold leading-snug transition-colors hover:text-bronze"
                      >
                        {p.title}
                      </Link>
                      {sku && <p className="mt-0.5 text-xs text-muted">{sku}</p>}
                      {specOptions.length > 0 && (
                        <dl className="mt-2 space-y-0.5 text-[12.5px]">
                          {specOptions.map((o) => {
                            const vals = (o.values ?? []).map((v) => v.value);
                            return (
                              <div key={o.id} className="flex gap-2">
                                <dt className="w-28 shrink-0 text-muted">{o.title}</dt>
                                <dd className="font-semibold">
                                  {vals.slice(0, 3).join(" / ")}
                                  {vals.length > 3 && (
                                    <span className="text-muted"> +{vals.length - 3}</span>
                                  )}
                                </dd>
                              </div>
                            );
                          })}
                        </dl>
                      )}
                    </div>

                    <div className="flex w-full shrink-0 flex-row items-center justify-between gap-3 sm:w-56 sm:flex-col sm:items-end sm:justify-start">
                      <div className="text-right">
                        <p className="text-lg font-extrabold leading-tight">
                          {price.many && (
                            <span className="mr-1 text-xs font-semibold text-muted">от</span>
                          )}
                          {formatPrice(price.with_vat)}
                          <span className="ml-1 text-xs font-semibold text-muted">с НДС</span>
                        </p>
                        <p className="text-xs text-muted">
                          {formatPrice(price.without_vat)} без НДС
                        </p>
                        <p className="mt-1 text-xs font-semibold text-emerald-600">
                          В наличии
                        </p>
                      </div>
                      <RowActions product={toRowProduct(p)} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {pages > 1 && (
            <nav className="mt-10 flex items-center justify-center gap-2 text-sm font-semibold">
              {page > 1 && (
                <Link
                  href={keepParams({ page: String(page - 1) })}
                  className="rounded-lg border border-line px-4 py-2 hover:bg-paper"
                >
                  ← Назад
                </Link>
              )}
              <span className="px-3 text-muted">
                Страница {page} из {pages}
              </span>
              {page < pages && (
                <Link
                  href={keepParams({ page: String(page + 1) })}
                  className="rounded-lg border border-line px-4 py-2 hover:bg-paper"
                >
                  Вперёд →
                </Link>
              )}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}

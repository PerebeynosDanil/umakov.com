import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Search, SlidersHorizontal } from "lucide-react";
import type { HttpTypes } from "@medusajs/types";
import { medusaFetch, getRegionId } from "@/lib/medusa-server";
import { formatPrice } from "@/lib/format";
import { getCategoryTree, pathTo, subtreeIds } from "@/lib/categories";
import { CategorySidebar } from "@/components/category-sidebar";
import { SortSelect } from "@/components/sort-select";

export const metadata = { title: "Продукты" };

const PAGE_SIZE = 24;

function minPrice(p: HttpTypes.StoreProduct): number | null {
  const amounts = (p.variants ?? [])
    .map((v) => v.calculated_price?.calculated_amount)
    .filter((a): a is number => typeof a === "number");
  return amounts.length ? Math.min(...amounts) : null;
}

export default async function ProductsPage({
  searchParams,
}: PageProps<"/products">) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const q = typeof sp.q === "string" ? sp.q : "";
  const cat = typeof sp.cat === "string" ? sp.cat : "";
  const sort = sp.sort === "new" ? "new" : "";

  const [region_id, tree] = await Promise.all([
    getRegionId(),
    getCategoryTree(),
  ]);

  const crumbs = cat ? pathTo(tree, cat) : [];
  const categoryIds = cat ? subtreeIds(tree, cat).slice(0, 300) : undefined;

  const { products, count } = await medusaFetch<{
    products: HttpTypes.StoreProduct[];
    count: number;
  }>("/store/products", {
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
    order: sort === "new" ? "-created_at" : "title",
    region_id,
    fields: "*variants.calculated_price",
    q: q || undefined,
    category_id: categoryIds,
  });
  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const keepParams = (extra: Record<string, string>) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (cat) p.set("cat", cat);
    if (sort) p.set("sort", sort);
    for (const [k, v] of Object.entries(extra)) p.set(k, v);
    return `/products?${p.toString()}`;
  };

  const sidebar = (
    <CategorySidebar
      roots={tree.roots}
      selectedId={cat || undefined}
      selectedPath={crumbs.map((c) => c.id)}
      keep={{ q: q || undefined, sort: sort || undefined }}
    />
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* крошки */}
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
              <Link href={keepParams({ cat: c.id })} className="hover:text-ink">
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

      <div className="mt-6 grid gap-8 lg:grid-cols-[260px_1fr]">
        {/* категории: на десктопе сайдбар, на мобильном — сворачиваемый блок */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2">
            <p className="flex items-center gap-2 px-2.5 pb-2 text-xs font-bold uppercase tracking-wider text-muted">
              <SlidersHorizontal className="size-3.5" />
              Категории
            </p>
            {sidebar}
          </div>
        </aside>
        <details className="rounded-xl border border-line bg-white p-4 lg:hidden">
          <summary className="flex items-center gap-2 text-sm font-bold">
            <SlidersHorizontal className="size-4" />
            Категории
          </summary>
          <div className="mt-3 max-h-96 overflow-y-auto">{sidebar}</div>
        </details>

        <div>
          {products.length === 0 ? (
            <p className="mt-16 text-center text-muted">Ничего не найдено.</p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((p) => {
                const price = minPrice(p);
                const manyVariants = (p.variants?.length ?? 0) > 1;
                return (
                  <Link
                    key={p.id}
                    href={`/products/${p.handle}`}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition-shadow hover:shadow-md"
                  >
                    <div className="relative aspect-square bg-white p-4">
                      {p.thumbnail ? (
                        <Image
                          src={p.thumbnail}
                          alt={p.title}
                          fill
                          sizes="(max-width: 640px) 100vw, 25vw"
                          className="object-contain p-3 transition-transform duration-200 group-hover:scale-105"
                        />
                      ) : (
                        <div className="grid h-full place-items-center text-sm text-muted">
                          Без фото
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col border-t border-line p-4">
                      <h2 className="line-clamp-2 text-sm font-bold leading-snug">
                        {p.title}
                      </h2>
                      <p className="mt-auto pt-3 text-[15px] font-extrabold">
                        {manyVariants && price !== null && (
                          <span className="mr-1 text-xs font-semibold text-muted">
                            от
                          </span>
                        )}
                        {formatPrice(price)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
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

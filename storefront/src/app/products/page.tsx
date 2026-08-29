import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import type { HttpTypes } from "@medusajs/types";
import { medusaFetch, getRegionId } from "@/lib/medusa-server";
import { formatPrice } from "@/lib/format";

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

  const region_id = await getRegionId();
  const { products, count } = await medusaFetch<{
    products: HttpTypes.StoreProduct[];
    count: number;
  }>("/store/products", {
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
    order: "title",
    region_id,
    fields: "*variants.calculated_price",
    q: q || undefined,
  });
  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const pageLink = (p: number) =>
    `/products?${new URLSearchParams({
      ...(q ? { q } : {}),
      ...(p > 1 ? { page: String(p) } : {}),
    }).toString()}`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Продукты</h1>
          <p className="mt-1 text-sm text-muted">
            {q ? (
              <>
                Найдено по запросу «{q}»: {count}
              </>
            ) : (
              <>Всего товаров: {count}</>
            )}
          </p>
        </div>
        <form action="/products" className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Поиск по каталогу…"
              className="w-64 rounded-lg border border-line bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-bronze"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-ink px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-85"
          >
            Найти
          </button>
        </form>
      </div>

      {products.length === 0 ? (
        <p className="mt-16 text-center text-muted">Ничего не найдено.</p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
              href={pageLink(page - 1)}
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
              href={pageLink(page + 1)}
              className="rounded-lg border border-line px-4 py-2 hover:bg-paper"
            >
              Вперёд →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}

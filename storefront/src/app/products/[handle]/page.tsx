import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import type { HttpTypes } from "@medusajs/types";
import { medusaFetch, getRegionId } from "@/lib/medusa-server";
import { AddToCart } from "@/components/add-to-cart";
import { ProductGallery } from "@/components/product-gallery";

export async function generateMetadata({
  params,
}: PageProps<"/products/[handle]">) {
  const { handle } = await params;
  return { title: decodeURIComponent(handle) };
}

export default async function ProductPage({
  params,
}: PageProps<"/products/[handle]">) {
  const { handle } = await params;
  const region_id = await getRegionId();
  const { products } = await medusaFetch<{
    products: HttpTypes.StoreProduct[];
  }>("/store/products", {
    handle: decodeURIComponent(handle),
    region_id,
    fields: "*variants.calculated_price,*variants.options,*options.values",
  });
  const product = products[0];
  if (!product) notFound();

  const images = product.images?.length
    ? product.images
    : product.thumbnail
      ? [{ id: "thumb", url: product.thumbnail }]
      : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Link
        href="/products"
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink"
      >
        <ChevronLeft className="size-4" />
        Все продукты
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <ProductGallery
          images={images.map((img) => ({ id: img.id, url: img.url }))}
          alt={product.title}
        />

        <div>
          <h1 className="text-2xl font-extrabold leading-tight tracking-tight lg:text-3xl">
            {product.title}
          </h1>
          {product.variants?.[0]?.sku && (
            <p className="mt-2 text-sm text-muted">
              Артикул: {product.variants[0].sku}
            </p>
          )}

          <AddToCart product={product} />

          {product.description && (
            <div
              className="prose-sm mt-8 max-w-none border-t border-line pt-6 text-sm leading-relaxed [&_a]:text-bronze [&_li]:mt-1 [&_p]:mt-2 [&_table]:mt-3 [&_td]:border [&_td]:border-line [&_td]:px-2 [&_td]:py-1"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

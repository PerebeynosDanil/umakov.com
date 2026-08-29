import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * Индексация каталога в Meilisearch: поиск с опечатками + фасетные
 * фильтры на витрине. Запускать после импорта/правок каталога:
 *
 *   npx medusa exec ./src/scripts/index-meilisearch.ts
 */

const HOST = process.env.MEILISEARCH_HOST || "http://localhost:7700";
const KEY = process.env.MEILISEARCH_KEY || "umakov-meili-dev-key";
const INDEX = "products";

type ProductRow = {
  id: string;
  title: string;
  handle: string;
  thumbnail: string | null;
  description: string | null;
  created_at: string;
  status: string;
  options?: { title: string; values?: { value: string }[] }[] | null;
  categories?: { id: string }[] | null;
  variants?: { sku: string | null }[] | null;
};

async function meili(path: string, method: string, body?: unknown) {
  const res = await fetch(`${HOST}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Meilisearch ${method} ${path}: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

/** Ключ фасета без пробелов/знаков — синтаксис фильтров Meilisearch. */
function facetKey(title: string): string {
  return title.replace(/[^\p{L}\p{N}]+/gu, "_");
}

function stripHtml(html: string | null): string {
  if (!html) return "";
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 600);
}

export default async function indexMeilisearch({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  logger.info(`Meilisearch: ${HOST}, индекс "${INDEX}"`);

  const facetKeys = new Set<string>();
  let total = 0;

  for (let skip = 0; ; skip += 500) {
    const { data } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "title",
        "handle",
        "thumbnail",
        "description",
        "created_at",
        "status",
        "options.title",
        "options.values.value",
        "categories.id",
        "variants.sku",
      ],
      pagination: { take: 500, skip },
    });
    const rows = data as unknown as ProductRow[];
    if (!rows.length) break;

    const docs = rows
      .filter((p) => p.status === "published")
      .map((p) => {
        const facets: Record<string, string[]> = {};
        for (const o of p.options ?? []) {
          if (!o.title || o.title === "Title") continue;
          const vals = (o.values ?? []).map((v) => v.value).filter(Boolean);
          if (vals.length) {
            const key = facetKey(o.title);
            facets[key] = vals;
            facetKeys.add(key);
          }
        }
        return {
          id: p.id,
          title: p.title,
          handle: p.handle,
          thumbnail: p.thumbnail,
          sku: p.variants?.map((v) => v.sku).filter(Boolean).join(" ") || null,
          description: stripHtml(p.description),
          categories: (p.categories ?? []).map((c) => c.id),
          facets,
          created_at: Date.parse(p.created_at) || 0,
        };
      });

    await meili(`/indexes/${INDEX}/documents?primaryKey=id`, "PUT", docs);
    total += docs.length;
    logger.info(`Отправлено ${total} товаров…`);
    if (rows.length < 500) break;
  }

  await meili(`/indexes/${INDEX}/settings`, "PATCH", {
    searchableAttributes: ["title", "sku", "description"],
    filterableAttributes: [
      "categories",
      ...[...facetKeys].map((k) => `facets.${k}`),
    ],
    sortableAttributes: ["title", "created_at"],
    pagination: { maxTotalHits: 20000 },
    typoTolerance: {
      minWordSizeForTypos: { oneTypo: 4, twoTypos: 8 },
    },
  });

  logger.info(
    `Готово: ${total} товаров в индексе, фасетов: ${facetKeys.size} (${[...facetKeys].slice(0, 8).join(", ")}…)`
  );
}

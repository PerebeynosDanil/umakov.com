import * as fs from "fs";
import * as path from "path";
import { ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createProductCategoriesWorkflow,
  createProductsWorkflow,
} from "@medusajs/medusa/core-flows";

/**
 * Импорт каталога umakovshop.com (assets/_meta/catalog.json) в Medusa.
 *
 * - Категории строятся из иерархии Shopify `type` (разделитель " / ").
 * - Картинки подключаются по URL CDN Shopify (работают, пока жив старый
 *   сайт; перед его отключением медиа надо перелить в своё хранилище).
 * - Цены EUR: price_cents / 100.
 * - Повторный запуск безопасен: уже импортированные handle пропускаются.
 *
 * Запуск: npx medusa exec ./src/scripts/import-catalog.ts
 */

type CatalogImage = { file: string; src: string };
type CatalogOption = { name: string; position: number; values: string[] };
type CatalogVariant = {
  id: number;
  title: string;
  sku: string | null;
  price_cents: number;
  available: boolean;
  options: string[];
};
type CatalogProduct = {
  handle: string;
  title: string;
  type: string;
  tags: string[];
  available: boolean;
  price_min_cents: number | null;
  price_max_cents: number | null;
  compare_at_price_cents: number | null;
  options: CatalogOption[];
  variants: CatalogVariant[];
  description_html: string;
  url: string;
  images: CatalogImage[];
};

const CHUNK_SIZE = 40;
const CATALOG_PATH = path.resolve(
  process.cwd(),
  "../../../assets/_meta/catalog.json"
);

export default async function importCatalog({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const catalog: CatalogProduct[] = JSON.parse(
    fs.readFileSync(CATALOG_PATH, "utf8")
  );
  logger.info(`Каталог: ${catalog.length} товаров (${CATALOG_PATH})`);

  const { data: channels } = await query.graph({
    entity: "sales_channel",
    fields: ["id", "name"],
  });
  if (!channels.length) {
    throw new Error("Нет канала продаж — сначала выполните миграции (db:migrate)");
  }
  const channelId = channels[0].id;

  const { data: profiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  });
  const shippingProfileId: string | undefined = profiles[0]?.id;

  // --- уже импортированные товары (идемпотентность) ---
  const existingHandles = new Set<string>();
  for (let skip = 0; ; skip += 1000) {
    const { data } = await query.graph({
      entity: "product",
      fields: ["handle"],
      pagination: { take: 1000, skip },
    });
    for (const p of data) existingHandles.add(p.handle);
    if (data.length < 1000) break;
  }
  logger.info(`Уже в базе: ${existingHandles.size} товаров`);

  // --- категории из иерархии type ---
  const categoryIdByPath = await ensureCategories(container, query, catalog, logger);

  // --- товары ---
  const toImport = catalog.filter((p) => !existingHandles.has(p.handle));
  logger.info(`К импорту: ${toImport.length} товаров`);

  const seenSkus = new Set<string>();
  const failed: { handle: string; error: string }[] = [];
  let done = 0;

  for (let i = 0; i < toImport.length; i += CHUNK_SIZE) {
    const chunk = toImport.slice(i, i + CHUNK_SIZE);
    const products = chunk.map((p) =>
      mapProduct(p, channelId, shippingProfileId, categoryIdByPath, seenSkus)
    );
    try {
      await createProductsWorkflow(container).run({ input: { products } });
      done += chunk.length;
    } catch {
      // пачка не прошла — заводим по одному, чтобы найти виновника
      for (let j = 0; j < products.length; j++) {
        try {
          await createProductsWorkflow(container).run({
            input: { products: [products[j]] },
          });
          done++;
        } catch (err) {
          failed.push({ handle: chunk[j].handle, error: errorText(err) });
        }
      }
    }
    if ((i / CHUNK_SIZE) % 5 === 0 || i + CHUNK_SIZE >= toImport.length) {
      logger.info(
        `Импортировано ${done}/${toImport.length} (ошибок: ${failed.length})`
      );
    }
  }

  if (failed.length) {
    const errFile = path.resolve(process.cwd(), "import-errors.json");
    fs.writeFileSync(errFile, JSON.stringify(failed, null, 2), "utf8");
    logger.warn(`Не импортировано ${failed.length} товаров — список в ${errFile}`);
  }
  logger.info(`Готово: ${done} товаров импортировано, ${failed.length} с ошибками.`);
}

/** Создаёт недостающие категории по уровням дерева, возвращает карту "полный путь -> id". */
async function ensureCategories(
  container: Parameters<typeof createProductCategoriesWorkflow>[0],
  query: any,
  catalog: CatalogProduct[],
  logger: { info: (msg: string) => void }
): Promise<Map<string, string>> {
  // существующие категории -> восстановить пути
  const byId = new Map<string, { name: string; parent: string | null }>();
  const usedHandles = new Set<string>();
  for (let skip = 0; ; skip += 1000) {
    const { data } = await query.graph({
      entity: "product_category",
      fields: ["id", "name", "handle", "parent_category_id"],
      pagination: { take: 1000, skip },
    });
    for (const c of data) {
      byId.set(c.id, { name: c.name, parent: c.parent_category_id ?? null });
      if (c.handle) usedHandles.add(c.handle);
    }
    if (data.length < 1000) break;
  }
  const pathOf = (id: string): string => {
    const node = byId.get(id)!;
    return node.parent ? `${pathOf(node.parent)} / ${node.name}` : node.name;
  };
  const idByPath = new Map<string, string>();
  for (const id of byId.keys()) idByPath.set(pathOf(id), id);

  // все нужные пути, сгруппированные по глубине
  const wanted: Set<string>[] = [];
  for (const p of catalog) {
    if (!p.type) continue;
    const parts = p.type.split(" / ").map((s) => s.trim()).filter(Boolean);
    for (let d = 0; d < parts.length; d++) {
      (wanted[d] ??= new Set()).add(parts.slice(0, d + 1).join(" / "));
    }
  }

  for (let depth = 0; depth < wanted.length; depth++) {
    const missing = [...wanted[depth]].filter((p) => !idByPath.has(p));
    if (!missing.length) continue;
    const input = missing.map((fullPath) => {
      const parts = fullPath.split(" / ");
      const parentPath = parts.slice(0, -1).join(" / ");
      // handle от полного пути: имена категорий повторяются в разных ветках
      let handle = slugify(fullPath);
      if (usedHandles.has(handle)) {
        let n = 2;
        while (usedHandles.has(`${handle}-${n}`)) n++;
        handle = `${handle}-${n}`;
      }
      usedHandles.add(handle);
      return {
        name: parts[parts.length - 1],
        handle,
        is_active: true,
        parent_category_id: parentPath ? idByPath.get(parentPath) ?? null : null,
      };
    });
    const { result } = await createProductCategoriesWorkflow(container).run({
      input: { product_categories: input },
    });
    // порядок результата соответствует порядку входа
    result.forEach((cat: { id: string }, i: number) => {
      idByPath.set(missing[i], cat.id);
    });
    logger.info(`Категории: уровень ${depth + 1}, создано ${missing.length}`);
  }
  return idByPath;
}

/**
 * Раскладывает части заголовка варианта по опциям товара: каждая опция
 * получает одну или несколько подряд идущих частей (склеенных " / "),
 * причём результат обязан входить в список значений этой опции.
 */
function matchOptionValues(
  parts: string[],
  options: CatalogOption[]
): string[] | null {
  const sets = options.map((o) => new Set(o.values));
  const res: string[] = new Array(options.length);
  const dfs = (pi: number, oi: number): boolean => {
    if (oi === options.length) return pi === parts.length;
    const maxTake = parts.length - pi - (options.length - oi - 1);
    for (let take = maxTake; take >= 1; take--) {
      const val = parts.slice(pi, pi + take).join(" / ");
      if (sets[oi].has(val)) {
        res[oi] = val;
        if (dfs(pi + take, oi + 1)) return true;
      }
    }
    return false;
  };
  return dfs(0, 0) ? res : null;
}

function errorText(err: unknown): string {
  const e = err as any;
  if (e?.message) return String(e.message);
  if (Array.isArray(e?.errors)) {
    return e.errors
      .map((x: any) => x?.error?.message ?? x?.message ?? JSON.stringify(x))
      .join("; ");
  }
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

function slugify(s: string): string {
  return (
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "category"
  );
}

function mapProduct(
  p: CatalogProduct,
  channelId: string,
  shippingProfileId: string | undefined,
  categoryIdByPath: Map<string, string>,
  seenSkus: Set<string>
) {
  const optionNames = p.options.map((o) => o.name);
  const typePath = p.type
    ? p.type.split(" / ").map((s) => s.trim()).filter(Boolean).join(" / ")
    : "";
  const categoryId = typePath ? categoryIdByPath.get(typePath) : undefined;

  const variants = p.variants.map((v) => {
    let sku = v.sku || undefined;
    if (sku) {
      if (seenSkus.has(sku)) {
        let n = 2;
        while (seenSkus.has(`${sku}~${n}`)) n++;
        sku = `${sku}~${n}`;
      }
      seenSkus.add(sku);
    }
    // значения опций могут сами содержать " / " — тогда частей больше,
    // чем опций; восстанавливаем по настоящим спискам значений
    let vals: string[] = v.options;
    if (vals.length !== optionNames.length) {
      vals = matchOptionValues(v.options, p.options) ?? vals;
    }
    const optionsObj: Record<string, string> = {};
    vals.forEach((val, idx) => {
      optionsObj[optionNames[idx] ?? `Option ${idx + 1}`] = val;
    });
    return {
      title: v.title,
      sku,
      options: optionsObj,
      manage_inventory: false,
      prices: [
        {
          amount: Number((v.price_cents / 100).toFixed(2)),
          currency_code: "eur",
        },
      ],
      metadata: {
        shopify_variant_id: String(v.id),
        shopify_available: v.available,
      },
    };
  });

  return {
    title: p.title,
    handle: p.handle,
    description: p.description_html || undefined,
    status: ProductStatus.PUBLISHED,
    category_ids: categoryId ? [categoryId] : undefined,
    images: p.images.map((img) => ({ url: img.src })),
    thumbnail: p.images[0]?.src,
    options: p.options.map((o) => ({
      title: o.name,
      values: [...new Set(o.values)],
    })),
    variants,
    sales_channels: [{ id: channelId }],
    shipping_profile_id: shippingProfileId,
    metadata: {
      shopify_url: p.url,
      shopify_tags: p.tags?.length ? p.tags.join(", ") : undefined,
      type_path: typePath || undefined,
    },
  };
}

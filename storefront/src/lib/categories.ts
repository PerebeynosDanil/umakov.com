import { medusaFetch } from "./medusa-server";

/** Дерево категорий каталога (импортировано из иерархии Shopify type). */

export type CategoryNode = {
  id: string;
  name: string;
  children: CategoryNode[];
};

export type CategoryTree = {
  roots: CategoryNode[];
  nameOf: Record<string, string>;
  parentOf: Record<string, string | null>;
};

type RawCategory = {
  id: string;
  name: string;
  parent_category_id: string | null;
};

export async function getCategoryTree(): Promise<CategoryTree> {
  try {
    const { product_categories } = await medusaFetch<{
      product_categories: RawCategory[];
    }>(
      "/store/product-categories",
      { limit: 1000, fields: "id,name,parent_category_id" },
      { revalidate: 600 }
    );

    const byId = new Map<string, CategoryNode>();
    const nameOf: Record<string, string> = {};
    const parentOf: Record<string, string | null> = {};
    for (const c of product_categories) {
      byId.set(c.id, { id: c.id, name: c.name, children: [] });
      nameOf[c.id] = c.name;
      parentOf[c.id] = c.parent_category_id;
    }
    const roots: CategoryNode[] = [];
    for (const c of product_categories) {
      const node = byId.get(c.id)!;
      const parent = c.parent_category_id
        ? byId.get(c.parent_category_id)
        : undefined;
      if (parent) parent.children.push(node);
      else roots.push(node);
    }
    const sortRec = (nodes: CategoryNode[]) => {
      nodes.sort((a, b) => a.name.localeCompare(b.name, "sk"));
      nodes.forEach((n) => sortRec(n.children));
    };
    sortRec(roots);
    return { roots, nameOf, parentOf };
  } catch {
    // бэкенд недоступен — меню/фильтры просто не показываем
    return { roots: [], nameOf: {}, parentOf: {} };
  }
}

/** id всех категорий поддерева (сама категория + потомки). */
export function subtreeIds(tree: CategoryTree, id: string): string[] {
  const find = (nodes: CategoryNode[]): CategoryNode | undefined => {
    for (const n of nodes) {
      if (n.id === id) return n;
      const hit = find(n.children);
      if (hit) return hit;
    }
    return undefined;
  };
  const node = find(tree.roots);
  if (!node) return [id];
  const out: string[] = [];
  const walk = (n: CategoryNode) => {
    out.push(n.id);
    n.children.forEach(walk);
  };
  walk(node);
  return out;
}

/** Путь от корня до категории: [{id, name}, …] — для крошек и раскрытия дерева. */
export function pathTo(
  tree: CategoryTree,
  id: string
): { id: string; name: string }[] {
  const path: { id: string; name: string }[] = [];
  let cur: string | null | undefined = id;
  while (cur && tree.nameOf[cur] !== undefined) {
    path.unshift({ id: cur, name: tree.nameOf[cur] });
    cur = tree.parentOf[cur];
  }
  return path;
}

/**
 * Иконка для каждой категории: своё фото (первый товар в категории),
 * а если её нет — фото из первой ветки-потомка.
 */
export function categoryImages(
  roots: CategoryNode[],
  direct: Record<string, string>
): Record<string, string> {
  const out: Record<string, string> = {};
  const dfs = (n: CategoryNode): string | undefined => {
    let img = direct[n.id];
    for (const c of n.children) {
      const childImg = dfs(c);
      if (!img && childImg) img = childImg;
    }
    if (img) out[n.id] = img;
    return img;
  };
  roots.forEach(dfs);
  return out;
}

/** Урезанное дерево для меню в шапке: 3 уровня, потомки с лимитом. */
export type MenuCategory = {
  id: string;
  name: string;
  image?: string;
  children: {
    id: string;
    name: string;
    image?: string;
    children: { id: string; name: string; image?: string }[];
  }[];
};

export function toMenu(
  roots: CategoryNode[],
  images: Record<string, string> = {},
  level3Cap = 7
): MenuCategory[] {
  return roots.map((r) => ({
    id: r.id,
    name: r.name,
    image: images[r.id],
    children: r.children.map((c2) => ({
      id: c2.id,
      name: c2.name,
      image: images[c2.id],
      children: c2.children
        .slice(0, level3Cap)
        .map((c3) => ({ id: c3.id, name: c3.name, image: images[c3.id] })),
    })),
  }));
}

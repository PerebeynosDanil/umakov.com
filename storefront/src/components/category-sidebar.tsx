import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { CategoryNode } from "@/lib/categories";

/**
 * Дерево категорий в каталоге. Раскрыта только ветка выбранной
 * категории — иначе 931 пункт займёт весь экран.
 */

function buildHref(
  catId: string | null,
  keep: { q?: string; sort?: string }
): string {
  const p = new URLSearchParams();
  if (catId) p.set("cat", catId);
  if (keep.q) p.set("q", keep.q);
  if (keep.sort) p.set("sort", keep.sort);
  const qs = p.toString();
  return qs ? `/products?${qs}` : "/products";
}

function Branch({
  node,
  depth,
  selectedId,
  openIds,
  keep,
}: {
  node: CategoryNode;
  depth: number;
  selectedId?: string;
  openIds: Set<string>;
  keep: { q?: string; sort?: string };
}) {
  const isSelected = node.id === selectedId;
  const isOpen = openIds.has(node.id);
  const hasChildren = node.children.length > 0;

  return (
    <li>
      <Link
        href={buildHref(isSelected ? null : node.id, keep)}
        style={{ paddingLeft: `${depth * 14 + 10}px` }}
        className={`flex items-center gap-1.5 rounded-lg py-1.5 pr-2 text-[13px] leading-snug transition-colors ${
          isSelected
            ? "bg-bronze-soft font-bold text-ink"
            : "font-medium text-muted hover:bg-paper hover:text-ink"
        }`}
      >
        {hasChildren ? (
          isOpen ? (
            <ChevronDown className="size-3.5 shrink-0" />
          ) : (
            <ChevronRight className="size-3.5 shrink-0" />
          )
        ) : (
          <span className="size-3.5 shrink-0" />
        )}
        {node.name}
      </Link>
      {hasChildren && isOpen && (
        <ul>
          {node.children.map((child) => (
            <Branch
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              openIds={openIds}
              keep={keep}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function CategorySidebar({
  roots,
  selectedId,
  selectedPath,
  keep,
}: {
  roots: CategoryNode[];
  selectedId?: string;
  selectedPath: string[];
  keep: { q?: string; sort?: string };
}) {
  const openIds = new Set(selectedPath);
  return (
    <nav>
      <Link
        href={buildHref(null, keep)}
        className={`block rounded-lg px-2.5 py-1.5 text-[13px] ${
          !selectedId
            ? "bg-bronze-soft font-bold text-ink"
            : "font-medium text-muted hover:bg-paper hover:text-ink"
        }`}
      >
        Все товары
      </Link>
      <ul className="mt-1">
        {roots.map((node) => (
          <Branch
            key={node.id}
            node={node}
            depth={0}
            selectedId={selectedId}
            openIds={openIds}
            keep={keep}
          />
        ))}
      </ul>
    </nav>
  );
}

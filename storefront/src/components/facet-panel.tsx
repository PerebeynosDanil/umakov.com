import Link from "next/link";
import { Check, X } from "lucide-react";
import type { Facets } from "@/lib/catalog-index";

/**
 * Фасетные фильтры по характеристикам (как на старом сайте: Material,
 * Surface finish, … со счётчиками). Каждый чекбокс — ссылка,
 * добавляющая/убирающая значение в URL (параметры f_<группа>).
 */

const SHOW_LIMIT = 8;

function hrefWith(
  base: Record<string, string | string[]>,
  filters: Record<string, string[]>,
  toggle: { group: string; value: string } | null
): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(base)) {
    if (Array.isArray(v)) v.forEach((x) => p.append(k, x));
    else if (v) p.set(k, v);
  }
  const next: Record<string, string[]> = {};
  for (const [g, vals] of Object.entries(filters)) next[g] = [...vals];
  if (toggle) {
    const list = next[toggle.group] ?? [];
    next[toggle.group] = list.includes(toggle.value)
      ? list.filter((v) => v !== toggle.value)
      : [...list, toggle.value];
  }
  for (const [g, vals] of Object.entries(toggle ? next : {})) {
    vals.forEach((v) => p.append(`f_${g}`, v));
  }
  if (!toggle) {
    // сброс всех фильтров — f_* не добавляем
  }
  const qs = p.toString();
  return qs ? `/products?${qs}` : "/products";
}

export function FacetPanel({
  facets,
  filters,
  base,
}: {
  facets: Facets;
  filters: Record<string, string[]>;
  base: Record<string, string | string[]>;
}) {
  const groups = Object.entries(facets);
  if (groups.length === 0) return null;

  const hasActive = Object.values(filters).some((v) => v.length > 0);

  return (
    <div className="space-y-4">
      {hasActive && (
        <Link
          href={hrefWith(base, filters, null)}
          className="flex items-center gap-1.5 text-sm font-semibold text-bronze hover:underline"
        >
          <X className="size-4" />
          Сбросить фильтры
        </Link>
      )}
      {groups.map(([group, values]) => {
        const active = filters[group] ?? [];
        const visible = values.slice(0, SHOW_LIMIT);
        const hidden = values.slice(SHOW_LIMIT);
        return (
          <div key={group} className="border-t border-line pt-3">
            <p className="px-1 text-xs font-bold uppercase tracking-wider text-muted">
              {group}
            </p>
            <ul className="mt-2 space-y-0.5">
              {visible.map((v) => (
                <FacetRow key={v.value} group={group} v={v} active={active} filters={filters} base={base} />
              ))}
            </ul>
            {hidden.length > 0 && (
              <details className="mt-1">
                <summary className="px-1 text-xs font-semibold text-bronze">
                  Ещё {hidden.length}
                </summary>
                <ul className="mt-1 space-y-0.5">
                  {hidden.map((v) => (
                    <FacetRow key={v.value} group={group} v={v} active={active} filters={filters} base={base} />
                  ))}
                </ul>
              </details>
            )}
          </div>
        );
      })}
    </div>
  );
}

function FacetRow({
  group,
  v,
  active,
  filters,
  base,
}: {
  group: string;
  v: { value: string; count: number };
  active: string[];
  filters: Record<string, string[]>;
  base: Record<string, string | string[]>;
}) {
  const checked = active.includes(v.value);
  return (
    <li>
      <Link
        href={hrefWith(base, filters, { group, value: v.value })}
        className={`flex items-center gap-2 rounded-lg px-1 py-1 text-[13px] transition-colors hover:bg-paper ${
          checked ? "font-bold text-ink" : "text-muted hover:text-ink"
        }`}
      >
        <span
          className={`grid size-4 shrink-0 place-items-center rounded border ${
            checked ? "border-ink bg-ink text-white" : "border-line bg-white"
          }`}
        >
          {checked && <Check className="size-3" />}
        </span>
        <span className="min-w-0 flex-1 truncate">{v.value}</span>
        <span className="shrink-0 text-xs text-muted">({v.count})</span>
      </Link>
    </li>
  );
}

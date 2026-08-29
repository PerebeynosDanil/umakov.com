"use client";

import { useRouter, useSearchParams } from "next/navigation";

const OPTIONS = [
  { value: "", label: "По названию" },
  { value: "new", label: "Сначала новые" },
];

export function SortSelect() {
  const router = useRouter();
  const params = useSearchParams();

  const change = (value: string) => {
    const p = new URLSearchParams(params.toString());
    if (value) p.set("sort", value);
    else p.delete("sort");
    p.delete("page");
    router.push(`/products?${p.toString()}`);
  };

  return (
    <select
      aria-label="Сортировка"
      defaultValue={params.get("sort") ?? ""}
      onChange={(e) => change(e.target.value)}
      className="rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-bronze"
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

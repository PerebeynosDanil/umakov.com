"use client";

import { useMemo, useState } from "react";
import { Check, Minus, Plus, ShoppingCart } from "lucide-react";
import type { HttpTypes } from "@medusajs/types";
import { useCart } from "@/providers/cart";
import { formatPrice } from "@/lib/format";

export function AddToCart({ product }: { product: HttpTypes.StoreProduct }) {
  const { addItem, busy } = useCart();
  const options = product.options ?? [];
  const variants = product.variants ?? [];

  const [selected, setSelected] = useState<Record<string, string>>(() => {
    // предвыбор: значения первого варианта
    const first = variants[0];
    const initial: Record<string, string> = {};
    for (const ov of first?.options ?? []) {
      if (ov.option_id && ov.value) initial[ov.option_id] = ov.value;
    }
    return initial;
  });
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const variant = useMemo(() => {
    return variants.find((v) =>
      (v.options ?? []).every(
        (ov) => ov.option_id && selected[ov.option_id] === ov.value
      )
    );
  }, [variants, selected]);

  const price = variant?.calculated_price?.calculated_amount;
  const showOptions =
    options.length > 0 &&
    !(options.length === 1 && options[0].title === "Title");

  const add = async () => {
    if (!variant) return;
    await addItem(variant.id, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  return (
    <div className="mt-5">
      {showOptions &&
        options.map((opt) => (
          <div key={opt.id} className="mt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">
              {opt.title}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(opt.values ?? []).map((val) => {
                const active = selected[opt.id] === val.value;
                return (
                  <button
                    key={val.id}
                    type="button"
                    onClick={() =>
                      setSelected((s) => ({ ...s, [opt.id]: val.value }))
                    }
                    className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                      active
                        ? "border-ink bg-ink text-white"
                        : "border-line bg-white hover:bg-paper"
                    }`}
                  >
                    {val.value}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

      <p className="mt-6 text-3xl font-extrabold">
        {formatPrice(price)}
        <span className="ml-2 text-sm font-semibold text-muted">с НДС</span>
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-lg border border-line">
          <button
            type="button"
            aria-label="Меньше"
            onClick={() => setQuantity((n) => Math.max(1, n - 1))}
            className="grid size-11 place-items-center hover:bg-paper"
          >
            <Minus className="size-4" />
          </button>
          <span className="w-10 text-center font-bold">{quantity}</span>
          <button
            type="button"
            aria-label="Больше"
            onClick={() => setQuantity((n) => n + 1)}
            className="grid size-11 place-items-center hover:bg-paper"
          >
            <Plus className="size-4" />
          </button>
        </div>
        <button
          type="button"
          disabled={!variant || busy}
          onClick={add}
          className="flex items-center gap-2 rounded-lg bg-ink px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-85 disabled:opacity-50"
        >
          {added ? (
            <>
              <Check className="size-4" />
              Добавлено
            </>
          ) : (
            <>
              <ShoppingCart className="size-4" />В корзину
            </>
          )}
        </button>
      </div>
      {!variant && (
        <p className="mt-2 text-sm text-muted">
          Такое сочетание опций недоступно.
        </p>
      )}
    </div>
  );
}

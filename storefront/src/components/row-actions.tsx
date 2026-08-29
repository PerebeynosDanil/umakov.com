"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, Minus, Plus, ShoppingCart, SlidersHorizontal, X } from "lucide-react";
import { useCart } from "@/providers/cart";
import { formatPrice } from "@/lib/format";

/** Компактные данные товара для строки каталога и панели опций. */
export type RowProduct = {
  id: string;
  title: string;
  handle: string;
  thumbnail: string | null;
  options: { id: string; title: string; values: { id: string; value: string }[] }[];
  variants: {
    id: string;
    sku: string | null;
    options: { option_id: string; value: string }[];
    with_vat: number | null;
    without_vat: number | null;
  }[];
};

function PriceBlock({
  withVat,
  withoutVat,
  prefix,
}: {
  withVat: number | null;
  withoutVat: number | null;
  prefix?: string;
}) {
  return (
    <div className="text-right">
      <p className="text-lg font-extrabold leading-tight">
        {prefix && <span className="mr-1 text-xs font-semibold text-muted">{prefix}</span>}
        {formatPrice(withVat)}
        <span className="ml-1 text-xs font-semibold text-muted">с НДС</span>
      </p>
      <p className="text-xs text-muted">{formatPrice(withoutVat)} без НДС</p>
    </div>
  );
}

function QtyStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center rounded-lg border border-line bg-white">
      <button
        type="button"
        aria-label="Меньше"
        onClick={() => onChange(Math.max(1, value - 1))}
        className="grid size-9 place-items-center hover:bg-paper"
      >
        <Minus className="size-3.5" />
      </button>
      <span className="w-8 text-center text-sm font-bold">{value}</span>
      <button
        type="button"
        aria-label="Больше"
        onClick={() => onChange(value + 1)}
        className="grid size-9 place-items-center hover:bg-paper"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}

export function RowActions({ product }: { product: RowProduct }) {
  const { addItem, busy } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [drawer, setDrawer] = useState(false);

  const simple =
    product.variants.length === 1 &&
    (product.options.length === 0 ||
      (product.options.length === 1 && product.options[0].title === "Title"));

  const buy = async (variantId: string, quantity: number) => {
    await addItem(variantId, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (simple) {
    const v = product.variants[0];
    return (
      <div className="flex items-center gap-2">
        <QtyStepper value={qty} onChange={setQty} />
        <button
          type="button"
          disabled={busy}
          onClick={() => buy(v.id, qty)}
          className="flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-85 disabled:opacity-50"
        >
          {added ? <Check className="size-4" /> : <ShoppingCart className="size-4" />}
          {added ? "В корзине" : "Купить"}
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setDrawer(true)}
        className="flex items-center gap-1.5 rounded-lg border border-ink/20 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors hover:bg-paper"
      >
        <SlidersHorizontal className="size-4" />
        Выбрать опции
      </button>
      {drawer && (
        <OptionsDrawer product={product} onClose={() => setDrawer(false)} onBuy={buy} busy={busy} />
      )}
    </>
  );
}

function OptionsDrawer({
  product,
  onClose,
  onBuy,
  busy,
}: {
  product: RowProduct;
  onClose: () => void;
  onBuy: (variantId: string, qty: number) => Promise<void>;
  busy: boolean;
}) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const realOptions = product.options.filter((o) => o.title !== "Title");
  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const ov of product.variants[0]?.options ?? []) {
      init[ov.option_id] = ov.value;
    }
    return init;
  });

  const variant = useMemo(
    () =>
      product.variants.find((v) =>
        v.options.every((ov) => selected[ov.option_id] === ov.value)
      ),
    [product.variants, selected]
  );

  const buy = async () => {
    if (!variant) return;
    await onBuy(variant.id, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-100">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className="absolute right-0 top-0 flex h-full w-105 max-w-[calc(100vw-2rem)] flex-col overflow-y-auto bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <p className="text-lg font-extrabold">Выбрать опции</p>
          <button
            type="button"
            aria-label="Закрыть"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-lg hover:bg-paper"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 px-5 py-4">
          <div className="flex gap-4">
            <div className="relative size-24 shrink-0 overflow-hidden rounded-lg border border-line bg-white">
              {product.thumbnail && (
                <Image src={product.thumbnail} alt="" fill sizes="96px" className="object-contain p-2" />
              )}
            </div>
            <div>
              {variant?.sku && <p className="text-xs text-muted">{variant.sku}</p>}
              <p className="font-extrabold leading-snug">{product.title}</p>
              <Link
                href={`/products/${product.handle}`}
                className="mt-1 inline-block text-sm font-semibold text-bronze hover:underline"
              >
                Подробнее о товаре
              </Link>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-paper px-4 py-3">
            <PriceBlock
              withVat={variant?.with_vat ?? null}
              withoutVat={variant?.without_vat ?? null}
            />
          </div>

          {realOptions.map((opt) => (
            <div key={opt.id} className="mt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">
                {opt.title}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {opt.values.map((val) => {
                  const active = selected[opt.id] === val.value;
                  return (
                    <button
                      key={val.id}
                      type="button"
                      onClick={() => setSelected((s) => ({ ...s, [opt.id]: val.value }))}
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
          {!variant && (
            <p className="mt-3 text-sm text-muted">Такое сочетание опций недоступно.</p>
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-line px-5 py-4">
          <QtyStepper value={qty} onChange={setQty} />
          <button
            type="button"
            disabled={!variant || busy}
            onClick={buy}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-ink py-3 text-xs font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-85 disabled:opacity-50"
          >
            {added ? <Check className="size-4" /> : <ShoppingCart className="size-4" />}
            {added ? "В корзине" : "В корзину"}
          </button>
        </div>
      </div>
    </div>
  );
}

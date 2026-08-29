"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useCart } from "@/providers/cart";
import { formatPrice } from "@/lib/format";

export default function CartPage() {
  const { cart, busy, updateItem, removeItem } = useCart();
  const items = cart?.items ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Корзина</h1>

      {items.length === 0 ? (
        <div className="mt-16 text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-bronze-soft">
            <ShoppingCart className="size-7 text-bronze" />
          </span>
          <p className="mt-5 text-lg font-bold">Корзина пуста</p>
          <p className="mt-1 text-sm text-muted">
            Добавьте товары из каталога — они появятся здесь.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-block rounded-lg bg-ink px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-85"
          >
            Перейти в каталог
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
          <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
            {items.map((item) => (
              <li key={item.id} className="flex gap-4 p-4">
                <div className="relative size-20 shrink-0 overflow-hidden rounded-lg border border-line bg-white">
                  {item.thumbnail && (
                    <Image
                      src={item.thumbnail}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-contain p-1.5"
                    />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="line-clamp-2 text-sm font-bold leading-snug">
                    {item.product_title ?? item.title}
                  </p>
                  {item.variant_title && item.variant_title !== "Default Title" && (
                    <p className="mt-0.5 text-xs text-muted">{item.variant_title}</p>
                  )}
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <div className="flex items-center rounded-lg border border-line">
                      <button
                        type="button"
                        aria-label="Меньше"
                        disabled={busy || item.quantity <= 1}
                        onClick={() => updateItem(item.id, item.quantity - 1)}
                        className="grid size-8 place-items-center hover:bg-paper disabled:opacity-40"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-bold">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label="Больше"
                        disabled={busy}
                        onClick={() => updateItem(item.id, item.quantity + 1)}
                        className="grid size-8 place-items-center hover:bg-paper disabled:opacity-40"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-extrabold">
                        {formatPrice(item.total)}
                      </span>
                      <button
                        type="button"
                        aria-label="Удалить"
                        disabled={busy}
                        onClick={() => removeItem(item.id)}
                        className="grid size-8 place-items-center rounded-lg text-muted hover:bg-paper hover:text-ink"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <aside className="h-fit rounded-2xl border border-line bg-paper p-6">
            <h2 className="text-lg font-extrabold">Итого</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Товары</dt>
                <dd className="font-semibold">{formatPrice(cart?.item_total)}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-2 text-base">
                <dt className="font-bold">К оплате</dt>
                <dd className="font-extrabold">{formatPrice(cart?.total)}</dd>
              </div>
            </dl>
            <p className="mt-2 text-xs text-muted">
              Доставка рассчитывается при оформлении заказа.
            </p>
            <Link
              href="/checkout"
              className="mt-5 block rounded-lg bg-ink py-3 text-center text-xs font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-85"
            >
              Оформить заказ
            </Link>
            <Link
              href="/products"
              className="mt-3 block rounded-lg border border-ink/20 bg-white py-3 text-center text-xs font-bold uppercase tracking-wider hover:bg-paper"
            >
              Продолжить покупки
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}

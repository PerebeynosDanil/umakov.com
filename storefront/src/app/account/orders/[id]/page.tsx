"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, Landmark } from "lucide-react";
import type { HttpTypes } from "@medusajs/types";
import { sdk } from "@/lib/medusa";
import { formatPrice } from "@/lib/format";
import { orderBadges, TONE_CLS } from "@/lib/order-status";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<HttpTypes.StoreOrder | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    sdk.store.order
      .retrieve(id, {
        fields:
          "+payment_status,+fulfillment_status,*items,*shipping_address",
      })
      .then(({ order }) => {
        setOrder(order);
        setState("ok");
      })
      .catch(() => setState("error"));
  }, [id]);

  if (state === "loading") {
    return <p className="py-20 text-center text-muted">Загрузка…</p>;
  }
  if (state === "error" || !order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <p className="text-muted">
          Заказ не найден или у вас нет к нему доступа —{" "}
          <Link href="/account" className="font-semibold text-bronze">
            войдите в кабинет
          </Link>
          .
        </p>
      </div>
    );
  }

  const addr = order.shipping_address;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link
        href="/account"
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink"
      >
        <ChevronLeft className="size-4" />
        Все заказы
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight">
          Заказ №{order.display_id}
        </h1>
        <span className="text-sm text-muted">
          от {new Date(order.created_at as string).toLocaleDateString("ru-RU")}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {orderBadges(order).map((b) => (
          <span
            key={b.label}
            className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${TONE_CLS[b.tone]}`}
          >
            {b.label}
          </span>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-line bg-white">
            <ul className="divide-y divide-line">
              {(order.items ?? []).map((item) => (
                <li key={item.id} className="flex gap-4 p-4">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-line bg-white">
                    {item.thumbnail && (
                      <Image src={item.thumbnail} alt="" fill sizes="64px" className="object-contain p-1" />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="line-clamp-2 text-sm font-bold leading-snug">
                      {item.product_title ?? item.title}
                    </p>
                    {item.variant_title && item.variant_title !== "Default Title" && (
                      <p className="mt-0.5 text-xs text-muted">{item.variant_title}</p>
                    )}
                    <div className="mt-auto flex items-center justify-between pt-1 text-sm">
                      <span className="text-muted">
                        {item.quantity} × {formatPrice(item.unit_price)}
                      </span>
                      <span className="font-extrabold">{formatPrice(item.total)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {addr && (
            <section className="rounded-2xl border border-line bg-white p-5 text-sm">
              <h2 className="font-extrabold">Доставка</h2>
              <p className="mt-2">
                {addr.first_name} {addr.last_name}
              </p>
              <p className="text-muted">
                {addr.address_1}, {addr.postal_code} {addr.city},{" "}
                {(addr.country_code ?? "").toUpperCase()}
              </p>
              {addr.phone && <p className="text-muted">{addr.phone}</p>}
            </section>
          )}
        </div>

        <aside className="h-fit space-y-4">
          <div className="rounded-2xl border border-line bg-paper p-5">
            <h2 className="font-extrabold">Итого</h2>
            <dl className="mt-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Товары</dt>
                <dd className="font-semibold">{formatPrice(order.item_total)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Доставка</dt>
                <dd className="font-semibold">{formatPrice(order.shipping_total)}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-1.5 text-base">
                <dt className="font-bold">Сумма</dt>
                <dd className="font-extrabold">{formatPrice(order.total)}</dd>
              </div>
            </dl>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-line bg-white p-5 text-sm">
            <Landmark className="mt-0.5 size-5 shrink-0 text-bronze" />
            <div>
              <p className="font-bold">Банковский перевод</p>
              <p className="mt-0.5 text-xs text-muted">
                Счёт отправляется на почту. После поступления оплаты статус
                изменится на «Оплачен».
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

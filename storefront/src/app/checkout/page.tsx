"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Check, CircleCheck, CreditCard, Landmark, Truck } from "lucide-react";
import type { HttpTypes } from "@medusajs/types";
import { sdk } from "@/lib/medusa";
import { useCart } from "@/providers/cart";
import { useAccount } from "@/providers/account";
import { formatPrice } from "@/lib/format";
import { validateCheckout, type CheckoutFields } from "@/lib/validation";

type Step = "address" | "shipping" | "payment";

const STEPS: { key: Step; n: number; title: string }[] = [
  { key: "address", n: 1, title: "Контакты и адрес" },
  { key: "shipping", n: 2, title: "Доставка" },
  { key: "payment", n: 3, title: "Оплата" },
];

export default function CheckoutPage() {
  const { cart, refresh, reset } = useCart();
  const { customer } = useAccount();
  const [step, setStep] = useState<Step>("address");
  const [options, setOptions] = useState<HttpTypes.StoreCartShippingOption[]>([]);
  const [countries, setCountries] = useState<{ iso_2: string; name: string }[]>([]);
  const [order, setOrder] = useState<HttpTypes.StoreOrder | null>(null);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof CheckoutFields, string>>
  >({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    sdk.store.region.list().then(({ regions }) => {
      const region = regions[0];
      setCountries(
        (region?.countries ?? []).map((c) => ({
          iso_2: c.iso_2 ?? "",
          name: c.display_name ?? c.iso_2 ?? "",
        }))
      );
    });
  }, []);

  if (order) return <SuccessView order={order} />;

  if (!cart || (cart.items?.length ?? 0) === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Оформление заказа</h1>
        <p className="mt-4 text-muted">Корзина пуста — добавьте товары из каталога.</p>
        <Link
          href="/products"
          className="mt-6 inline-block rounded-lg bg-ink px-6 py-3 text-xs font-bold uppercase tracking-wider text-white"
        >
          В каталог
        </Link>
      </div>
    );
  }

  const submitAddress = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    const fields: CheckoutFields = {
      first_name: String(fd.get("first_name")),
      last_name: String(fd.get("last_name")),
      email: String(fd.get("email")),
      phone: String(fd.get("phone")),
      address_1: String(fd.get("address_1")),
      postal_code: String(fd.get("postal_code")),
      city: String(fd.get("city")),
      country_code: String(fd.get("country_code")),
    };
    const errs = validateCheckout(fields);
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      setError("Проверьте выделенные поля.");
      return;
    }
    setBusy(true);
    const { email, ...address } = fields;
    try {
      await sdk.store.cart.update(cart.id, {
        email: email.trim(),
        shipping_address: address,
        billing_address: address,
      });
      const { shipping_options } = await sdk.store.fulfillment.listCartOptions({
        cart_id: cart.id,
      });
      setOptions(shipping_options);
      setStep("shipping");
    } catch (err) {
      // сервер тоже проверяет данные — показываем его сообщение, если есть
      const msg = err instanceof Error ? err.message : "";
      setError(
        msg && msg.length < 300
          ? msg
          : "Не удалось сохранить адрес. Проверьте поля и попробуйте ещё раз."
      );
    } finally {
      setBusy(false);
    }
  };

  const chooseShipping = async (optionId: string) => {
    setError("");
    setBusy(true);
    try {
      await sdk.store.cart.addShippingMethod(cart.id, { option_id: optionId });
      await refresh();
      setStep("payment");
    } catch {
      setError("Не удалось выбрать доставку, попробуйте ещё раз.");
    } finally {
      setBusy(false);
    }
  };

  const placeOrder = async () => {
    setError("");
    setBusy(true);
    try {
      const { cart: fresh } = await sdk.store.cart.retrieve(cart.id);
      await sdk.store.payment.initiatePaymentSession(fresh, {
        provider_id: "pp_system_default",
      });
      const res = await sdk.store.cart.complete(cart.id);
      if (res.type === "order") {
        setOrder(res.order);
        reset();
      } else {
        setError("Не удалось завершить заказ. Попробуйте ещё раз.");
      }
    } catch {
      setError("Не удалось завершить заказ. Попробуйте ещё раз.");
    } finally {
      setBusy(false);
    }
  };

  const input =
    "w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-bronze";
  const fieldCls = (k: keyof CheckoutFields) =>
    fieldErrors[k]
      ? `${input} border-red-400 focus:border-red-400`
      : input;
  const stepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Оформление заказа</h1>

      <ol className="mt-6 flex flex-wrap items-center gap-2 text-sm font-semibold">
        {STEPS.map((s, i) => (
          <li key={s.key} className="flex items-center gap-2">
            {i > 0 && <span className="mx-1 h-px w-6 bg-line" />}
            <span
              className={`grid size-7 place-items-center rounded-full text-xs font-bold ${
                i < stepIndex
                  ? "bg-bronze text-white"
                  : i === stepIndex
                    ? "bg-ink text-white"
                    : "border border-line text-muted"
              }`}
            >
              {i < stepIndex ? <Check className="size-3.5" /> : s.n}
            </span>
            <span className={i === stepIndex ? "" : "text-muted"}>{s.title}</span>
          </li>
        ))}
      </ol>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_300px]">
        <div>
          {step === "address" && (
            <form onSubmit={submitAddress} noValidate className="space-y-3 rounded-2xl border border-line bg-white p-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <input name="first_name" required placeholder="Имя" defaultValue={customer?.first_name ?? ""} className={fieldCls("first_name")} />
                  <FieldError k="first_name" errors={fieldErrors} />
                </div>
                <div>
                  <input name="last_name" required placeholder="Фамилия" defaultValue={customer?.last_name ?? ""} className={fieldCls("last_name")} />
                  <FieldError k="last_name" errors={fieldErrors} />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <input name="email" type="email" required placeholder="Эл. почта" defaultValue={customer?.email ?? ""} className={fieldCls("email")} />
                  <FieldError k="email" errors={fieldErrors} />
                </div>
                <div>
                  <input name="phone" required placeholder="Телефон, например +49 151 2345678" defaultValue={customer?.phone ?? ""} className={fieldCls("phone")} />
                  <FieldError k="phone" errors={fieldErrors} />
                </div>
              </div>
              <div>
                <input name="address_1" required placeholder="Улица и номер дома" className={fieldCls("address_1")} />
                <FieldError k="address_1" errors={fieldErrors} />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <input name="postal_code" required placeholder="Индекс" className={fieldCls("postal_code")} />
                  <FieldError k="postal_code" errors={fieldErrors} />
                </div>
                <div>
                  <input name="city" required placeholder="Город" className={fieldCls("city")} />
                  <FieldError k="city" errors={fieldErrors} />
                </div>
                <select name="country_code" defaultValue="de" className={input}>
                  {countries.map((c) => (
                    <option key={c.iso_2} value={c.iso_2}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg bg-ink px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-85 disabled:opacity-50"
              >
                {busy ? "Сохраняем…" : "Продолжить"}
              </button>
            </form>
          )}

          {step === "shipping" && (
            <div className="space-y-3 rounded-2xl border border-line bg-white p-6">
              <h2 className="flex items-center gap-2 text-lg font-extrabold">
                <Truck className="size-5 text-bronze" />
                Способ доставки
              </h2>
              {options.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  disabled={busy}
                  onClick={() => chooseShipping(o.id)}
                  className="flex w-full items-center justify-between rounded-xl border border-line px-4 py-3.5 text-left transition-colors hover:border-ink disabled:opacity-50"
                >
                  <span className="text-sm font-bold">{o.name}</span>
                  <span className="text-sm font-extrabold">{formatPrice(o.amount)}</span>
                </button>
              ))}
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button type="button" onClick={() => setStep("address")} className="text-sm font-semibold text-muted hover:text-ink">
                ← Назад к адресу
              </button>
            </div>
          )}

          {step === "payment" && (
            <div className="space-y-3 rounded-2xl border border-line bg-white p-6">
              <h2 className="text-lg font-extrabold">Способ оплаты</h2>
              <div className="flex items-start gap-3 rounded-xl border border-ink bg-paper px-4 py-3.5">
                <Landmark className="mt-0.5 size-5 shrink-0 text-bronze" />
                <div>
                  <p className="text-sm font-bold">Банковский перевод (по счёту)</p>
                  <p className="mt-0.5 text-xs text-muted">
                    После оформления мы вышлем счёт на вашу почту. Заказ уходит в работу после поступления оплаты.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-line px-4 py-3.5 opacity-50">
                <CreditCard className="mt-0.5 size-5 shrink-0" />
                <div>
                  <p className="text-sm font-bold">Картой онлайн</p>
                  <p className="mt-0.5 text-xs text-muted">Скоро подключим.</p>
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex items-center gap-4 pt-1">
                <button
                  type="button"
                  disabled={busy}
                  onClick={placeOrder}
                  className="rounded-lg bg-ink px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-85 disabled:opacity-50"
                >
                  {busy ? "Оформляем…" : "Подтвердить заказ"}
                </button>
                <button type="button" onClick={() => setStep("shipping")} className="text-sm font-semibold text-muted hover:text-ink">
                  ← Назад
                </button>
              </div>
            </div>
          )}
        </div>

        <aside className="h-fit rounded-2xl border border-line bg-paper p-6">
          <h2 className="text-lg font-extrabold">Ваш заказ</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {(cart.items ?? []).map((i) => (
              <li key={i.id} className="flex justify-between gap-3">
                <span className="line-clamp-1 text-muted">
                  {i.quantity} × {i.product_title ?? i.title}
                </span>
                <span className="shrink-0 font-semibold">
                  {formatPrice(i.total ?? i.unit_price * i.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1.5 border-t border-line pt-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Товары</dt>
              <dd className="font-semibold">{formatPrice(cart.item_total)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Доставка</dt>
              <dd className="font-semibold">{formatPrice(cart.shipping_total)}</dd>
            </div>
            <div className="flex justify-between pt-1 text-base">
              <dt className="font-bold">Итого</dt>
              <dd className="font-extrabold">{formatPrice(cart.total)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}

function FieldError({
  k,
  errors,
}: {
  k: keyof CheckoutFields;
  errors: Partial<Record<keyof CheckoutFields, string>>;
}) {
  if (!errors[k]) return null;
  return <p className="mt-1 text-xs text-red-600">{errors[k]}</p>;
}

function SuccessView({ order }: { order: HttpTypes.StoreOrder }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
      <span className="mx-auto grid size-16 place-items-center rounded-full bg-bronze-soft">
        <CircleCheck className="size-8 text-bronze" />
      </span>
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight">
        Заказ №{order.display_id} оформлен
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm text-muted">
        Подтверждение отправлено на {order.email}. Мы вышлем счёт на оплату —
        после поступления средств заказ уйдёт в работу. Отследить статус можно
        в чате (вкладка «Заказ») по номеру заказа и почте.
      </p>
      <p className="mt-5 text-2xl font-extrabold">{formatPrice(order.total)}</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link
          href="/products"
          className="rounded-lg bg-ink px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-85"
        >
          Продолжить покупки
        </Link>
        <Link
          href="/account"
          className="rounded-lg border border-ink/20 bg-white px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-paper"
        >
          Мои заказы
        </Link>
      </div>
    </div>
  );
}

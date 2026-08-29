"use client";

import { useEffect, useState, type FormEvent } from "react";
import { LogOut, Package, UserRound } from "lucide-react";
import type { HttpTypes } from "@medusajs/types";
import { useAccount } from "@/providers/account";
import { sdk } from "@/lib/medusa";
import { formatPrice } from "@/lib/format";

export default function AccountPage() {
  const { customer, loading } = useAccount();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Личный кабинет</h1>
      {loading ? (
        <p className="mt-10 text-center text-muted">Загрузка…</p>
      ) : customer ? (
        <Profile />
      ) : (
        <AuthForms />
      )}
    </div>
  );
}

function AuthForms() {
  const { login, register } = useAccount();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    try {
      if (mode === "login") {
        await login(String(fd.get("email")), String(fd.get("password")));
      } else {
        await register({
          email: String(fd.get("email")),
          password: String(fd.get("password")),
          first_name: String(fd.get("first_name")),
          last_name: String(fd.get("last_name")),
        });
      }
    } catch {
      setError(
        mode === "login"
          ? "Не удалось войти: проверьте почту и пароль."
          : "Не удалось зарегистрироваться. Возможно, такая почта уже используется."
      );
    } finally {
      setBusy(false);
    }
  };

  const input =
    "w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-bronze";

  return (
    <div className="mx-auto mt-8 max-w-md rounded-2xl border border-line bg-white p-6">
      <div className="grid grid-cols-2 rounded-lg bg-paper p-1 text-center text-sm font-bold">
        {(["login", "register"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-md py-2 transition-colors ${
              mode === m ? "bg-white shadow-sm" : "text-muted"
            }`}
          >
            {m === "login" ? "Вход" : "Регистрация"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-5 space-y-3">
        {mode === "register" && (
          <div className="grid grid-cols-2 gap-3">
            <input name="first_name" required placeholder="Имя" className={input} />
            <input name="last_name" required placeholder="Фамилия" className={input} />
          </div>
        )}
        <input name="email" type="email" required placeholder="Эл. почта" className={input} />
        <input
          name="password"
          type="password"
          required
          minLength={6}
          placeholder="Пароль"
          className={input}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-ink py-3 text-xs font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-85 disabled:opacity-50"
        >
          {busy ? "Подождите…" : mode === "login" ? "Войти" : "Создать аккаунт"}
        </button>
      </form>
    </div>
  );
}

function Profile() {
  const { customer, logout, update } = useAccount();
  const [orders, setOrders] = useState<HttpTypes.StoreOrder[] | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    sdk.store.order
      .list({ limit: 20, order: "-created_at" })
      .then(({ orders }) => setOrders(orders))
      .catch(() => setOrders([]));
  }, []);

  const save = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await update({
      first_name: String(fd.get("first_name")),
      last_name: String(fd.get("last_name")),
      phone: String(fd.get("phone")),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const input =
    "w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-bronze";

  return (
    <div className="mt-8 space-y-6">
      <section className="rounded-2xl border border-line bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-extrabold">
            <UserRound className="size-5 text-bronze" />
            Профиль
          </h2>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"
          >
            <LogOut className="size-4" />
            Выйти
          </button>
        </div>
        <p className="mt-1 text-sm text-muted">{customer?.email}</p>
        <form onSubmit={save} className="mt-4 grid gap-3 sm:grid-cols-3">
          <input
            name="first_name"
            defaultValue={customer?.first_name ?? ""}
            placeholder="Имя"
            className={input}
          />
          <input
            name="last_name"
            defaultValue={customer?.last_name ?? ""}
            placeholder="Фамилия"
            className={input}
          />
          <input
            name="phone"
            defaultValue={customer?.phone ?? ""}
            placeholder="Телефон"
            className={input}
          />
          <button
            type="submit"
            className="rounded-lg bg-ink py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-85 sm:w-40"
          >
            {saved ? "Сохранено ✓" : "Сохранить"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-line bg-white p-6">
        <h2 className="flex items-center gap-2 text-lg font-extrabold">
          <Package className="size-5 text-bronze" />
          Заказы
        </h2>
        {orders === null ? (
          <p className="mt-3 text-sm text-muted">Загрузка…</p>
        ) : orders.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            Заказов пока нет — они появятся здесь после первой покупки.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {orders.map((o) => (
              <li key={o.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-bold">Заказ #{o.display_id}</p>
                  <p className="text-xs text-muted">
                    {new Date(o.created_at as string).toLocaleDateString("ru-RU")}
                  </p>
                </div>
                <span className="font-extrabold">{formatPrice(o.total)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

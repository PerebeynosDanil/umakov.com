"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Eye, EyeOff, LogOut, Package, UserRound, Wand2 } from "lucide-react";
import type { HttpTypes } from "@medusajs/types";
import { useAccount } from "@/providers/account";
import { sdk } from "@/lib/medusa";
import { formatPrice } from "@/lib/format";
import { generatePassword } from "@/lib/password";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.2-2.2H12v4.4h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.6 2.8c2.2-2 3.8-5 3.8-8.8z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.6-2.8c-1 .7-2.4 1.2-4.3 1.2-3.3 0-6.1-2.2-7.1-5.2L1.2 17C3.1 21.1 7.2 24 12 24z" />
      <path fill="#FBBC05" d="M4.9 14.3c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.2 7C.4 8.5 0 10.2 0 12s.4 3.5 1.2 5l3.7-2.7z" />
      <path fill="#EA4335" d="M12 4.7c2.3 0 3.9 1 4.8 1.9l3.2-3.2C18 1.3 15.2 0 12 0 7.2 0 3.1 2.9 1.2 7l3.7 2.7c1-3 3.8-5 7.1-5z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="#1877F2"
        d="M24 12c0-6.6-5.4-12-12-12S0 5.4 0 12c0 6 4.4 11 10.1 11.9v-8.4H7.1V12h3v-2.6c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.3l-.5 3.5h-2.8v8.4C19.6 23 24 18 24 12z"
      />
    </svg>
  );
}

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
  const [showPass, setShowPass] = useState(false);
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");

  const genPassword = () => {
    const p = generatePassword();
    setPass(p);
    setPass2(p);
    setShowPass(true);
  };

  const social = async (provider: "google" | "facebook") => {
    setError("");
    const label = provider === "google" ? "Google" : "Facebook";
    try {
      const res = await sdk.auth.login("customer", provider, {});
      if (typeof res === "object" && res && "location" in res) {
        window.location.href = (res as { location: string }).location;
        return;
      }
      setError(`Не удалось начать вход через ${label}.`);
    } catch {
      setError(
        `Вход через ${label} пока не настроен — используйте почту и пароль.`
      );
    }
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    if (mode === "register" && fd.get("password") !== fd.get("password2")) {
      setError("Пароли не совпадают.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "login") {
        await login(String(fd.get("email")), String(fd.get("password")));
      } else {
        await register({
          email: String(fd.get("email")),
          password: String(fd.get("password")),
          first_name: String(fd.get("first_name")).trim(),
          last_name: String(fd.get("last_name")).trim(),
        });
      }
    } catch {
      setError(
        mode === "login"
          ? "Не удалось войти: проверьте почту и пароль."
          : "Не удалось зарегистрироваться. Возможно, такая почта уже используется — попробуйте войти или восстановить пароль."
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
            onClick={() => {
              setMode(m);
              setError("");
            }}
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
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="Эл. почта"
          className={input}
        />
        <div className="relative">
          <input
            name="password"
            type={showPass ? "text" : "password"}
            required
            minLength={8}
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            placeholder={mode === "login" ? "Пароль" : "Пароль (минимум 8 символов)"}
            className={`${input} pr-11`}
          />
          <button
            type="button"
            aria-label={showPass ? "Скрыть пароль" : "Показать пароль"}
            onClick={() => setShowPass(!showPass)}
            className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-muted hover:bg-paper"
          >
            {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {mode === "register" && (
          <>
            <input
              name="password2"
              type={showPass ? "text" : "password"}
              required
              minLength={8}
              value={pass2}
              onChange={(e) => setPass2(e.target.value)}
              autoComplete="new-password"
              placeholder="Повторите пароль"
              className={input}
            />
            <button
              type="button"
              onClick={genPassword}
              className="flex items-center gap-1.5 text-sm font-semibold text-bronze hover:underline"
            >
              <Wand2 className="size-4" />
              Сгенерировать надёжный пароль
            </button>
          </>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-ink py-3 text-xs font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-85 disabled:opacity-50"
        >
          {busy ? "Подождите…" : mode === "login" ? "Войти" : "Создать аккаунт"}
        </button>
        {mode === "login" && (
          <p className="text-center">
            <Link
              href="/account/forgot"
              className="text-sm font-semibold text-muted hover:text-ink"
            >
              Забыли пароль?
            </Link>
          </p>
        )}
      </form>

      <div className="mt-5 flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" />
        или войдите через
        <span className="h-px flex-1 bg-line" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => social("google")}
          className="flex items-center justify-center gap-2 rounded-lg border border-line py-2.5 text-sm font-bold transition-colors hover:bg-paper"
        >
          <GoogleIcon />
          Google
        </button>
        <button
          type="button"
          onClick={() => social("facebook")}
          className="flex items-center justify-center gap-2 rounded-lg border border-line py-2.5 text-sm font-bold transition-colors hover:bg-paper"
        >
          <FacebookIcon />
          Facebook
        </button>
      </div>
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

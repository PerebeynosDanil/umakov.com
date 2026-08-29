"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, Wand2 } from "lucide-react";
import { sdk } from "@/lib/medusa";
import { generatePassword } from "@/lib/password";

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}

function ResetForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";
  const [state, setState] = useState<"form" | "done" | "error">("form");
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

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    if (fd.get("password") !== fd.get("password2")) {
      setError("Пароли не совпадают.");
      return;
    }
    setBusy(true);
    try {
      await sdk.auth.updateProvider(
        "customer",
        "emailpass",
        { email, password: String(fd.get("password")) },
        token
      );
      setState("done");
    } catch {
      setState("error");
    } finally {
      setBusy(false);
    }
  };

  const input =
    "w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-bronze";

  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-bronze-soft">
        <LockKeyhole className="size-6 text-bronze" />
      </span>
      <h1 className="mt-5 text-center text-2xl font-extrabold tracking-tight">
        Новый пароль
      </h1>

      {!token || !email ? (
        <p className="mt-4 text-center text-sm text-muted">
          Ссылка неполная. Запросите сброс пароля заново на странице{" "}
          <Link href="/account/forgot" className="font-semibold text-bronze">
            восстановления
          </Link>
          .
        </p>
      ) : state === "done" ? (
        <div className="mt-4 text-center">
          <p className="text-sm text-muted">Пароль обновлён.</p>
          <Link
            href="/account"
            className="mt-5 inline-block rounded-lg bg-ink px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-85"
          >
            Войти
          </Link>
        </div>
      ) : state === "error" ? (
        <p className="mt-4 text-center text-sm text-muted">
          Ссылка устарела или уже использована. Запросите{" "}
          <Link href="/account/forgot" className="font-semibold text-bronze">
            новую ссылку
          </Link>
          .
        </p>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-3">
          <p className="text-center text-sm text-muted">для {email}</p>
          <div className="relative">
            <input
              name="password"
              type={showPass ? "text" : "password"}
              required
              minLength={8}
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              autoComplete="new-password"
              placeholder="Новый пароль (минимум 8 символов)"
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
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-ink py-3 text-xs font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-85 disabled:opacity-50"
          >
            {busy ? "Сохраняем…" : "Сохранить пароль"}
          </button>
        </form>
      )}
    </div>
  );
}

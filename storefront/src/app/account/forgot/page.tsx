"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { sdk } from "@/lib/medusa";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    const email = String(new FormData(e.currentTarget).get("email"));
    try {
      await sdk.auth.resetPassword("customer", "emailpass", {
        identifier: email,
      });
    } catch {
      // намеренно молчим: не раскрываем, существует ли адрес
    }
    setSent(true);
    setBusy(false);
  };

  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-bronze-soft">
        <KeyRound className="size-6 text-bronze" />
      </span>
      <h1 className="mt-5 text-center text-2xl font-extrabold tracking-tight">
        Восстановление пароля
      </h1>

      {sent ? (
        <p className="mt-4 text-center text-sm text-muted">
          Если такой адрес зарегистрирован, мы отправили на него ссылку для
          сброса пароля. Проверьте почту.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-3">
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="Эл. почта, указанная при регистрации"
            className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-bronze"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-ink py-3 text-xs font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-85 disabled:opacity-50"
          >
            {busy ? "Отправляем…" : "Отправить ссылку"}
          </button>
        </form>
      )}

      <p className="mt-6 text-center">
        <Link href="/account" className="text-sm font-semibold text-muted hover:text-ink">
          ← Вернуться ко входу
        </Link>
      </p>
    </div>
  );
}

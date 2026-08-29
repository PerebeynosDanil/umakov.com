"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { sdk } from "@/lib/medusa";

/** Сюда возвращает Google/Facebook после подтверждения входа. */
export default function OAuthCallbackPage() {
  return (
    <Suspense>
      <OAuthCallback />
    </Suspense>
  );
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(atob(base64));
}

function OAuthCallback() {
  const { provider } = useParams<{ provider: string }>();
  const search = useSearchParams();
  const [error, setError] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    (async () => {
      try {
        const token = await sdk.auth.callback(
          "customer",
          provider,
          Object.fromEntries(search.entries())
        );
        if (typeof token !== "string") {
          setError("Этот способ входа требует дополнительного подтверждения.");
          return;
        }
        const payload = decodeJwtPayload(token);
        if (!payload.actor_id) {
          // первый вход: заводим покупателя по данным из соцсети
          const meta = (payload.user_metadata ?? {}) as Record<string, string>;
          if (!meta.email) {
            setError(
              "Соцсеть не передала адрес почты. Зарегистрируйтесь по почте и паролю."
            );
            return;
          }
          await sdk.store.customer.create({
            email: meta.email,
            first_name: meta.given_name ?? "",
            last_name: meta.family_name ?? "",
          });
          await sdk.auth.refresh();
        }
        window.location.href = "/account";
      } catch {
        setError("Не удалось завершить вход. Попробуйте ещё раз.");
      }
    })();
  }, [provider, search]);

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center sm:px-6">
      {error ? (
        <>
          <p className="text-sm text-red-600">{error}</p>
          <Link
            href="/account"
            className="mt-6 inline-block rounded-lg bg-ink px-6 py-3 text-xs font-bold uppercase tracking-wider text-white"
          >
            К странице входа
          </Link>
        </>
      ) : (
        <p className="text-muted">Завершаем вход…</p>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Menu, ShoppingCart, User, X } from "lucide-react";
import { NAV } from "@/lib/nav";
import { Logo } from "@/components/logo";
import { useCart } from "@/providers/cart";

export function Header() {
  const [open, setOpen] = useState(false);
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />

        <nav className="hidden items-center gap-6 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-1 text-sm font-semibold text-ink transition-colors hover:text-bronze"
            >
              {item.label}
              {item.label === "Продукты" && (
                <ChevronDown className="size-3.5 text-muted" />
              )}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/account"
            aria-label="Личный кабинет"
            className="grid size-10 place-items-center rounded-lg border border-line transition-colors hover:bg-paper"
          >
            <User className="size-5" />
          </Link>
          <Link
            href="/cart"
            aria-label="Корзина"
            className="relative grid size-10 place-items-center rounded-lg border border-line transition-colors hover:bg-paper"
          >
            <ShoppingCart className="size-5" />
            {itemCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 grid min-w-5 place-items-center rounded-full bg-bronze px-1 text-[11px] font-bold text-white">
                {itemCount}
              </span>
            )}
          </Link>
          <Link
            href="/configurator"
            className="ml-1 hidden rounded-lg bg-ink px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-85 sm:block"
          >
            Рассчитать проект
          </Link>
          <button
            type="button"
            aria-label="Открыть меню"
            onClick={() => setOpen(!open)}
            className="grid size-10 place-items-center rounded-lg border border-line lg:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-line bg-white px-4 py-4 lg:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-semibold hover:bg-paper"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/configurator"
            onClick={() => setOpen(false)}
            className="mt-3 block rounded-lg bg-ink px-5 py-3 text-center text-xs font-bold uppercase tracking-wider text-white"
          >
            Рассчитать проект
          </Link>
        </nav>
      )}
    </header>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  Menu,
  ShoppingCart,
  User,
  X,
} from "lucide-react";
import { NAV } from "@/lib/nav";
import { Logo } from "@/components/logo";
import { useCart } from "@/providers/cart";
import type { MenuCategory } from "@/lib/categories";

export function Header({ categories = [] }: { categories?: MenuCategory[] }) {
  const [open, setOpen] = useState(false);
  const [mega, setMega] = useState(false);
  const [activeRoot, setActiveRoot] = useState(0);
  const { itemCount } = useCart();

  const root = categories[activeRoot];

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />

        <nav className="hidden items-center gap-6 lg:flex">
          {/* Продукты: ссылка + мегаменю по наведению */}
          <div
            onMouseEnter={() => setMega(true)}
            onMouseLeave={() => setMega(false)}
          >
            <Link
              href="/products"
              className="flex h-16 items-center gap-1 text-sm font-semibold text-ink transition-colors hover:text-bronze"
            >
              Продукты
              <ChevronDown
                className={`size-3.5 text-muted transition-transform ${mega ? "rotate-180" : ""}`}
              />
            </Link>

            {mega && categories.length > 0 && (
              <div className="fixed left-1/2 top-16 z-50 w-[min(1100px,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-b-2xl border border-t-0 border-line bg-white shadow-xl">
                <div className="grid max-h-[70vh] grid-cols-[260px_1fr]">
                  {/* корневые категории */}
                  <ul className="overflow-y-auto border-r border-line bg-paper py-3">
                    {categories.map((c, i) => (
                      <li key={c.id}>
                        <Link
                          href={`/products?cat=${c.id}`}
                          onMouseEnter={() => setActiveRoot(i)}
                          onClick={() => setMega(false)}
                          className={`flex items-center justify-between gap-2 px-4 py-2 text-[13px] font-semibold transition-colors ${
                            i === activeRoot
                              ? "bg-white text-ink"
                              : "text-muted hover:text-ink"
                          }`}
                        >
                          {c.name}
                          <ArrowRight
                            className={`size-3.5 shrink-0 ${i === activeRoot ? "text-bronze" : "opacity-0"}`}
                          />
                        </Link>
                      </li>
                    ))}
                  </ul>

                  {/* подкатегории активного корня */}
                  <div className="overflow-y-auto p-5">
                    {root && root.children.length > 0 ? (
                      <div className="columns-2 gap-6 xl:columns-3">
                        {root.children.map((c2) => (
                          <div key={c2.id} className="mb-5 break-inside-avoid">
                            <Link
                              href={`/products?cat=${c2.id}`}
                              onClick={() => setMega(false)}
                              className="text-[13px] font-extrabold hover:text-bronze"
                            >
                              {c2.name}
                            </Link>
                            {c2.children.length > 0 && (
                              <ul className="mt-1.5 space-y-1">
                                {c2.children.map((c3) => (
                                  <li key={c3.id}>
                                    <Link
                                      href={`/products?cat=${c3.id}`}
                                      onClick={() => setMega(false)}
                                      className="text-[12.5px] text-muted hover:text-ink"
                                    >
                                      {c3.name}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      root && (
                        <Link
                          href={`/products?cat=${root.id}`}
                          onClick={() => setMega(false)}
                          className="text-sm font-semibold text-bronze"
                        >
                          Смотреть товары раздела →
                        </Link>
                      )
                    )}
                  </div>
                </div>
                <div className="border-t border-line bg-white px-5 py-3">
                  <Link
                    href="/products"
                    onClick={() => setMega(false)}
                    className="flex items-center gap-1.5 text-sm font-bold text-bronze hover:underline"
                  >
                    Весь каталог
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {NAV.filter((i) => i.label !== "Продукты").map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-1 text-sm font-semibold text-ink transition-colors hover:text-bronze"
            >
              {item.label}
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
        <nav className="max-h-[75vh] overflow-y-auto border-t border-line bg-white px-4 py-4 lg:hidden">
          <Link
            href="/products"
            onClick={() => setOpen(false)}
            className="block rounded-lg px-3 py-2.5 text-sm font-semibold hover:bg-paper"
          >
            Продукты
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/products?cat=${c.id}`}
              onClick={() => setOpen(false)}
              className="block rounded-lg py-2 pl-7 pr-3 text-[13px] text-muted hover:bg-paper hover:text-ink"
            >
              {c.name}
            </Link>
          ))}
          {NAV.filter((i) => i.label !== "Продукты").map((item) => (
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

import Link from "next/link";
import {
  LayoutGrid,
  Ruler,
  Fence,
  Palette,
  Settings,
  Wrench,
  ShoppingCart,
  MoveRight,
} from "lucide-react";

const STEPS = [
  { icon: LayoutGrid, label: "Выберите продукт" },
  { icon: Ruler, label: "Укажите размеры" },
  { icon: Fence, label: "Выберите модель" },
  { icon: Palette, label: "Материал и цвет" },
  { icon: Settings, label: "Доп. элементы и аксессуары" },
  { icon: Wrench, label: "Выберите монтаж" },
  { icon: ShoppingCart, label: "Цена и заказ" },
];

export function Steps() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:py-20">
      <h2 className="text-2xl font-extrabold tracking-tight lg:text-3xl">
        Соберите свой проект за 7 шагов
      </h2>
      <div className="mt-10 flex flex-wrap items-start justify-center gap-x-2 gap-y-8">
        {STEPS.map(({ icon: Icon, label }, i) => (
          <div key={label} className="flex items-start">
            {i > 0 && (
              <MoveRight className="mx-2 mt-3 hidden size-5 text-line xl:block" />
            )}
            <div className="w-28 sm:w-32">
              <span className="mx-auto grid size-12 place-items-center rounded-xl border border-line">
                <Icon className="size-5" />
              </span>
              <p className="mt-3 text-[13px] font-semibold leading-snug">
                {i + 1}. {label}
              </p>
            </div>
          </div>
        ))}
      </div>
      <Link
        href="/configurator"
        className="mt-10 inline-block rounded-lg bg-ink px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-85"
      >
        Открыть конфигуратор
      </Link>
    </section>
  );
}

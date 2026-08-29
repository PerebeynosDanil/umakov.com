import Link from "next/link";
import { Box, HardHat, Settings } from "lucide-react";

const ACTIONS = [
  { icon: Box, label: "Собрать конструкцию", href: "/configurator" },
  { icon: HardHat, label: "Заказать монтаж", href: "/installation" },
  { icon: Settings, label: "Вызвать сервис", href: "/service" },
];

export function Cta() {
  return (
    <section className="bg-paper py-12 lg:py-16">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-4 sm:px-6 lg:flex-row">
        <div className="text-center lg:text-left">
          <h2 className="text-2xl font-extrabold tracking-tight lg:text-3xl">
            Готовы начать проект?
          </h2>
          <p className="mt-2 max-w-sm text-sm text-muted">
            Соберите конструкцию сами или закажите монтаж и сервис у нас.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          {ACTIONS.map(({ icon: Icon, label, href }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-xl border border-line bg-white px-6 py-4 transition-shadow hover:shadow-md"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-bronze-soft">
                <Icon className="size-5 text-bronze" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

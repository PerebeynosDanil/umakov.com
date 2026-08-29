import Image from "next/image";
import Link from "next/link";
import { Ruler, Tag, Truck, Wrench, HardHat } from "lucide-react";

const FEATURES = [
  { icon: Ruler, label: "Индивидуальные размеры" },
  { icon: Tag, label: "Прозрачные цены" },
  { icon: Truck, label: "Доставка по всей Германии" },
  { icon: Wrench, label: "Самостоятельный монтаж с инструкцией" },
  { icon: HardHat, label: "Профессиональный монтаж" },
];

export function Hero() {
  return (
    <section className="border-b border-line">
      <div className="relative overflow-hidden bg-paper">
        <div className="absolute inset-0">
          <Image
            src="/images/home/01-hero-modern-house-gates.webp"
            alt="Современный дом с алюминиевым забором и воротами UMAKOV"
            fill
            preload
            sizes="100vw"
            className="object-cover object-[70%_center]"
          />
          <div className="absolute inset-0 bg-paper/70 md:hidden" />
          <div className="absolute inset-0 hidden bg-gradient-to-r from-paper via-paper/85 to-transparent md:block" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
          <h1 className="max-w-xl text-4xl font-extrabold leading-tight tracking-tight lg:text-5xl">
            Заборы, ворота, перила и навесы на ваш вкус
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed">
            Соберите свою систему онлайн.
            <br />
            Установите самостоятельно или закажите монтаж у нас.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/configurator"
              className="rounded-lg bg-ink px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-85"
            >
              Собрать конструкцию
            </Link>
            <Link
              href="/contacts"
              className="rounded-lg border border-ink/20 bg-white px-6 py-3.5 text-xs font-bold uppercase tracking-wider transition-colors hover:bg-paper"
            >
              Получить консультацию
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-5 px-4 py-6 sm:px-6 md:grid-cols-3 xl:grid-cols-5">
          {FEATURES.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-line">
                <Icon className="size-5 text-ink" />
              </span>
              <span className="text-[13px] font-semibold leading-snug">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

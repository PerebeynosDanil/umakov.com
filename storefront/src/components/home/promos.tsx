import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";

export function Promos() {
  return (
    <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-16 sm:px-6 lg:grid-cols-2 lg:pb-20">
      <article className="flex flex-col justify-between gap-6 rounded-2xl bg-ink p-6 text-white sm:flex-row lg:p-8">
        <div className="flex flex-col">
          <h3 className="text-xl font-extrabold">Сервис и ремонт</h3>
          <p className="mt-1.5 text-sm text-white/70">
            Быстро приедем и устраним проблему.
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {[
              "Диагностика и выезд",
              "Ремонт и замена запчастей",
              "Ролики, петли, подшипники",
              "Настройка автоматики",
              "Плановое обслуживание",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <Check className="mt-0.5 size-4 shrink-0 text-bronze" />
                {item}
              </li>
            ))}
          </ul>
          <Link
            href="/service"
            className="mt-6 inline-block self-start rounded-lg bg-white px-6 py-3 text-xs font-bold uppercase tracking-wider text-ink transition-opacity hover:opacity-85"
          >
            Вызвать специалиста
          </Link>
        </div>
        <div className="relative min-h-44 flex-1 overflow-hidden rounded-xl sm:max-w-[45%]">
          <Image
            src="/images/home/09-service-repair-hardware.webp"
            alt="Запчасти для ворот: ролики, петли, подшипники"
            fill
            sizes="(max-width: 640px) 100vw, 30vw"
            className="object-cover"
          />
        </div>
      </article>

      <article className="flex flex-col justify-between gap-6 rounded-2xl border border-line bg-paper p-6 sm:flex-row lg:p-8">
        <div className="flex flex-col">
          <h3 className="text-xl font-extrabold">Автоматика для ворот</h3>
          <p className="mt-1.5 text-sm text-muted">
            Надёжные решения для вашего комфорта и безопасности.
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {[
              "Приводы для откатных и распашных ворот",
              "Пульты управления и аксессуары",
              "Датчики и системы безопасности",
              "Монтаж и настройка",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <Check className="mt-0.5 size-4 shrink-0 text-bronze" />
                {item}
              </li>
            ))}
          </ul>
          <Link
            href="/products"
            className="mt-6 inline-block self-start rounded-lg bg-ink px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-85"
          >
            Подобрать автоматику
          </Link>
        </div>
        <div className="relative min-h-44 flex-1 overflow-hidden rounded-xl sm:max-w-[45%]">
          <Image
            src="/images/home/10-automation-gate-motor.webp"
            alt="Привод для автоматических ворот с пультами"
            fill
            sizes="(max-width: 640px) 100vw, 30vw"
            className="object-cover"
          />
        </div>
      </article>
    </section>
  );
}

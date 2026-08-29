import Image from "next/image";
import { Check, Wrench, HardHat } from "lucide-react";

const OPTIONS = [
  {
    icon: Wrench,
    title: "Самостоятельный монтаж",
    subtitle: "Мы поставляем всё — вы устанавливаете сами.",
    image: "/images/home/07-install-diy-kit.webp",
    imageAlt: "Комплект для самостоятельной установки забора",
    items: [
      "Полный комплект под ваш проект",
      "Подробная инструкция по установке",
      "Поддержка на всех этапах",
      "Доставка по всей Германии",
    ],
  },
  {
    icon: HardHat,
    title: "Монтаж под ключ",
    subtitle: "Приезжаем, устанавливаем и настраиваем.",
    image: "/images/home/08-install-turnkey-service.webp",
    imageAlt: "Бригада UMAKOV устанавливает ворота",
    items: [
      "Консультация и замер (при необходимости)",
      "Доставка всех материалов",
      "Профессиональный монтаж",
      "Настройка и проверка работы",
      "Гарантия на работы",
    ],
  },
];

export function InstallOptions() {
  return (
    <section className="bg-paper py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="text-center text-2xl font-extrabold tracking-tight lg:text-3xl">
          Выбирайте удобный способ
        </h2>
        <div className="relative mt-8 grid gap-6 md:grid-cols-2">
          <span className="absolute left-1/2 top-1/2 z-10 hidden size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-line bg-white text-sm font-extrabold shadow-md md:grid">
            ИЛИ
          </span>
          {OPTIONS.map(({ icon: Icon, ...opt }) => (
            <article
              key={opt.title}
              className="flex flex-col rounded-2xl bg-white p-6 lg:p-8"
            >
              <div className="flex items-start gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-bronze text-white">
                  <Icon className="size-6" />
                </span>
                <div>
                  <h3 className="text-lg font-extrabold">{opt.title}</h3>
                  <p className="mt-1 text-sm text-muted">{opt.subtitle}</p>
                </div>
              </div>
              <ul className="mt-5 space-y-2.5">
                {opt.items.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-bronze" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="relative mt-6 aspect-[16/8] overflow-hidden rounded-xl">
                <Image
                  src={opt.image}
                  alt={opt.imageAlt}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

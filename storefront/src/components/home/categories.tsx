import Image from "next/image";
import Link from "next/link";

const CATEGORIES = [
  {
    title: "Перила и ограждения",
    image: "/images/home/02-category-railings-glass-balcony.webp",
    items: [
      "Балконы и террасы",
      "Лестницы",
      "Стеклянные системы",
      "Нержавеющая сталь",
      "Комплектующие",
    ],
  },
  {
    title: "Заборы",
    image: "/images/home/03-category-fences-aluminum-slats.webp",
    items: [
      "Алюминиевые заборы",
      "Разные варианты заполнения",
      "Столбы и крепления",
      "Цвет и размеры",
      "Комплектующие",
    ],
  },
  {
    title: "Ворота и калитки",
    image: "/images/home/04-category-gates-and-wickets.webp",
    items: [
      "Откатные и распашные",
      "Калитки",
      "Автоматика и аксессуары",
      "Безопасность",
      "Совместимость с заборами",
    ],
  },
  {
    title: "Перегородки",
    image: "/images/home/05-category-glass-partitions.webp",
    items: [
      "Стеклянные",
      "Алюминиевые",
      "Интерьерные и уличные",
      "Индивидуальные размеры",
      "Разные конфигурации",
    ],
  },
  {
    title: "Навесы",
    image: "/images/home/06-category-terrace-canopy.webp",
    items: [
      "Входные навесы",
      "Террасные навесы",
      "Современный дизайн",
      "Разные покрытия",
      "Крепления и аксессуары",
    ],
  },
];

export function Categories() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
      <h2 className="text-2xl font-extrabold tracking-tight lg:text-3xl">
        Выберите, что вам нужно
      </h2>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {CATEGORIES.map((cat) => (
          <article
            key={cat.title}
            className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white"
          >
            <div className="relative aspect-[4/3]">
              <Image
                src={cat.image}
                alt={cat.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                className="object-cover"
              />
            </div>
            <div className="flex flex-1 flex-col p-4">
              <h3 className="text-[15px] font-extrabold leading-snug">
                {cat.title}
              </h3>
              <ul className="mt-3 space-y-1.5 text-[13px] text-muted">
                {cat.items.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-[7px] size-1 shrink-0 rounded-full bg-muted" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/configurator"
                className="mt-4 block rounded-lg border border-ink/20 py-2.5 text-center text-xs font-bold uppercase tracking-wider transition-colors hover:bg-paper"
              >
                Собрать
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

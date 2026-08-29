"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

const PROJECTS = [
  {
    image: "/images/home/11-project-modern-driveway-gate.webp",
    alt: "Откатные ворота у современного дома",
  },
  {
    image: "/images/home/12-project-gate-masonry-pillars.webp",
    alt: "Ворота с каменными столбами",
  },
  {
    image: "/images/home/13-project-glass-balcony-railing.webp",
    alt: "Стеклянные перила на балконе",
  },
  {
    image: "/images/home/14-project-terrace-canopy.webp",
    alt: "Террасный навес",
  },
];

export function Projects() {
  const track = useRef<HTMLDivElement>(null);

  const scroll = (dir: 1 | -1) =>
    track.current?.scrollBy({ left: dir * 360, behavior: "smooth" });

  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:pb-20">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-extrabold tracking-tight lg:text-3xl">
          Реализованные проекты
        </h2>
        <div className="flex items-center gap-3">
          <Link
            href="/projects"
            className="hidden items-center gap-1.5 text-sm font-semibold hover:text-bronze sm:flex"
          >
            Смотреть все проекты
            <ArrowRight className="size-4" />
          </Link>
          <button
            type="button"
            aria-label="Назад"
            onClick={() => scroll(-1)}
            className="grid size-10 place-items-center rounded-full border border-line transition-colors hover:bg-paper"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Вперёд"
            onClick={() => scroll(1)}
            className="grid size-10 place-items-center rounded-full border border-line transition-colors hover:bg-paper"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      </div>

      <div
        ref={track}
        className="no-scrollbar mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto"
      >
        {PROJECTS.map((p) => (
          <div
            key={p.image}
            className="relative aspect-[4/3] w-72 shrink-0 snap-start overflow-hidden rounded-2xl sm:w-85"
          >
            <Image
              src={p.image}
              alt={p.alt}
              fill
              sizes="340px"
              className="object-cover transition-transform duration-300 hover:scale-105"
            />
          </div>
        ))}
      </div>
    </section>
  );
}

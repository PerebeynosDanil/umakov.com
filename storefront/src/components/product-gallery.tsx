"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";

type GalleryImage = { id: string; url: string };

export function ProductGallery({
  images,
  alt,
}: {
  images: GalleryImage[];
  alt: string;
}) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);

  const prev = useCallback(
    () => setActive((a) => (a - 1 + images.length) % images.length),
    [images.length]
  );
  const next = useCallback(
    () => setActive((a) => (a + 1) % images.length),
    [images.length]
  );

  // клавиатура в полноэкранном режиме
  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoom(false);
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom, prev, next]);

  if (images.length === 0) {
    return (
      <div className="grid aspect-square place-items-center rounded-2xl border border-line text-muted">
        Без фото
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        aria-label="Открыть фото на весь экран"
        onClick={() => setZoom(true)}
        className="group relative block aspect-square w-full cursor-zoom-in overflow-hidden rounded-2xl border border-line bg-white"
      >
        <Image
          key={images[active].id}
          src={images[active].url}
          alt={alt}
          fill
          preload
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-contain p-6"
        />
        <span className="absolute bottom-3 right-3 grid size-9 place-items-center rounded-lg bg-white/90 text-muted shadow-sm transition-opacity group-hover:text-ink">
          <Expand className="size-4" />
        </span>
      </button>

      {images.length > 1 && (
        <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              aria-label={`Фото ${i + 1}`}
              onClick={() => setActive(i)}
              className={`relative size-20 shrink-0 overflow-hidden rounded-lg border bg-white transition-colors ${
                i === active ? "border-ink" : "border-line hover:border-muted"
              }`}
            >
              <Image src={img.url} alt="" fill sizes="80px" className="object-contain p-1.5" />
            </button>
          ))}
        </div>
      )}

      {zoom && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-ink/90 p-4"
          onClick={() => setZoom(false)}
        >
          <button
            type="button"
            aria-label="Закрыть"
            className="absolute right-4 top-4 grid size-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="size-5" />
          </button>
          {images.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Предыдущее фото"
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                className="absolute left-4 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <ChevronLeft className="size-6" />
              </button>
              <button
                type="button"
                aria-label="Следующее фото"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                className="absolute right-4 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <ChevronRight className="size-6" />
              </button>
            </>
          )}
          <div className="relative h-full max-h-[85vh] w-full max-w-4xl">
            <Image
              src={images[active].url}
              alt={alt}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
          {images.length > 1 && (
            <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm text-white">
              {active + 1} / {images.length}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

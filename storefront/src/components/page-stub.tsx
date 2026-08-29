import Link from "next/link";
import { Construction } from "lucide-react";

export function PageStub({ title }: { title: string }) {
  return (
    <div className="grid min-h-[60vh] place-items-center px-4 py-20">
      <div className="text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-bronze-soft">
          <Construction className="size-7 text-bronze" />
        </span>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight">{title}</h1>
        <p className="mx-auto mt-3 max-w-sm text-muted">
          Страница в разработке — скоро здесь появится контент.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-lg bg-ink px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-85"
        >
          На главную
        </Link>
      </div>
    </div>
  );
}

import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-ink text-xl font-extrabold text-white">
        U
      </span>
      <span className="leading-none">
        <span className="block text-[17px] font-extrabold tracking-wide">
          UMAKOV
        </span>
        <span className="mt-1 block text-[10px] font-semibold tracking-[0.28em] text-muted">
          GERMANY
        </span>
      </span>
    </Link>
  );
}

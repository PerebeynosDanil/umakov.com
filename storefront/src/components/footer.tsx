import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { NAV, CONTACTS } from "@/lib/nav";
import { Logo } from "@/components/logo";

export function Footer() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 py-10 sm:px-6 lg:flex-row">
        <Logo />

        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted transition-colors hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <div className="text-right text-sm">
            <a href={CONTACTS.phoneHref} className="block font-bold">
              {CONTACTS.phone}
            </a>
            <a
              href={`mailto:${CONTACTS.email}`}
              className="block text-muted hover:text-ink"
            >
              {CONTACTS.email}
            </a>
          </div>
          <a
            href={CONTACTS.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="grid size-10 place-items-center rounded-full border border-line transition-colors hover:bg-paper"
          >
            <MessageCircle className="size-5" />
          </a>
        </div>
      </div>
      <div className="border-t border-line py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} UMAKOV Germany. Все права защищены.
      </div>
    </footer>
  );
}

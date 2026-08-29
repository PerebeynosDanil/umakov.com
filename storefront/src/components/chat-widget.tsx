"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Home,
  Mail,
  MessageCircle,
  Send,
  Truck,
  X,
} from "lucide-react";
import { CONTACTS } from "@/lib/nav";
import { formatPrice } from "@/lib/format";
import { fulfillmentStatusRu, paymentStatusRu } from "@/lib/order-status";

type Msg = { role: "user" | "assistant"; content: string };
type Tab = "home" | "chat" | "track" | "help";

const GREETING: Msg = {
  role: "assistant",
  content:
    "Здравствуйте! Я помощник UMAKOV. Помогу подобрать забор, ворота, перила или комплектующие — просто опишите, что ищете.",
};

// ЧЕРНОВИКИ текстов — заменить реальными условиями магазина
const FAQ: { q: string; a: string }[] = [
  {
    q: "Сколько идёт доставка?",
    a: "Обычно 3–7 рабочих дней по Германии. Крупногабаритные конструкции (ворота, секции заборов) согласуем отдельно.",
  },
  {
    q: "Как отследить заказ?",
    a: "Откройте вкладку «Заказ» здесь в чате и введите номер заказа и почту, указанную при оформлении.",
  },
  {
    q: "Доставляете ли за пределы Германии?",
    a: "Да, в страны ЕС по договорённости — напишите нам, посчитаем стоимость.",
  },
  {
    q: "Какие условия возврата?",
    a: "Стандартный возврат в течение 14 дней для товаров без следов монтажа. Изделия, изготовленные по индивидуальным размерам, возврату не подлежат.",
  },
];

const HELP: { category: string; articles: { title: string; text: string }[] }[] = [
  {
    category: "Заказ и доставка",
    articles: [
      {
        title: "Оплата и счёт",
        text: "Сейчас доступна оплата банковским переводом: после оформления заказа мы высылаем счёт на вашу почту. Заказ уходит в работу после поступления оплаты. Оплата картой появится в ближайшее время.",
      },
      {
        title: "Сроки и стоимость доставки",
        text: "Доставка по всей Германии, обычно 3–7 рабочих дней. Стоимость рассчитывается на шаге оформления заказа и зависит от габаритов.",
      },
      {
        title: "Монтаж",
        text: "Можно установить самостоятельно — поставляем полный комплект с инструкцией, либо заказать монтаж под ключ нашей бригадой (замер, установка, настройка, гарантия на работы).",
      },
    ],
  },
  {
    category: "Обмен и возврат",
    articles: [
      {
        title: "Условия возврата",
        text: "Возврат в течение 14 дней для товаров в исходном состоянии без следов монтажа. Изделия по индивидуальным размерам возврату не подлежат. Напишите нам — подскажем порядок действий.",
      },
    ],
  },
];

/** Рендер текста ассистента: [текст](/ссылка) -> ссылка, \n -> перенос. */
function renderText(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  const pushPlain = (s: string) => {
    s.split("\n").forEach((line, i) => {
      if (i > 0) out.push(<br key={`br${key++}`} />);
      if (line) out.push(<span key={`t${key++}`}>{line}</span>);
    });
  };
  while ((m = re.exec(text))) {
    pushPlain(text.slice(last, m.index));
    const href = m[2];
    out.push(
      href.startsWith("/") ? (
        <Link key={`l${key++}`} href={href} className="font-semibold text-bronze underline">
          {m[1]}
        </Link>
      ) : (
        <a key={`l${key++}`} href={href} className="font-semibold text-bronze underline" target="_blank" rel="noopener noreferrer">
          {m[1]}
        </a>
      )
    );
    last = m.index + m[0].length;
  }
  pushPlain(text.slice(last));
  return out;
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("home");

  useEffect(() => {
    if (window.location.hash === "#chat") setOpen(true);
  }, []);

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Закрыть чат" : "Открыть чат"}
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-50 grid size-14 place-items-center rounded-full bg-ink text-white shadow-lg transition-transform hover:scale-105"
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
      </button>

      {open && (
        <div className="fixed bottom-22 right-5 z-50 flex h-[580px] max-h-[78vh] w-[370px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-2xl">
          <div className="flex-1 overflow-hidden">
            {tab === "home" && <HomeTab goTo={setTab} />}
            {tab === "chat" && <ChatTab />}
            {tab === "track" && <TrackTab />}
            {tab === "help" && <HelpTab />}
          </div>

          <nav className="grid grid-cols-4 border-t border-line bg-white">
            {(
              [
                { key: "home", label: "Главная", Icon: Home },
                { key: "chat", label: "Чат", Icon: MessageCircle },
                { key: "track", label: "Заказ", Icon: Truck },
                { key: "help", label: "Справка", Icon: HelpCircle },
              ] as const
            ).map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors ${
                  tab === key ? "text-ink" : "text-muted hover:text-ink"
                }`}
              >
                <Icon className={`size-5 ${tab === key ? "text-bronze" : ""}`} />
                {label}
              </button>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}

function HomeTab({ goTo }: { goTo: (t: Tab) => void }) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="bg-ink px-5 pb-6 pt-5 text-white">
        <p className="text-2xl font-extrabold">Здравствуйте! 👋</p>
        <p className="mt-1 text-sm text-white/70">Чем можем помочь?</p>
      </div>
      <div className="-mt-3 space-y-3 px-4 pb-4">
        <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
          <p className="text-sm font-bold">Свяжитесь с нами</p>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => goTo("chat")}
              className="flex items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-85"
            >
              <Send className="size-3.5" />
              Написать в чат
            </button>
            <a
              href={`mailto:${CONTACTS.email}`}
              aria-label="Написать на почту"
              className="grid size-10 place-items-center rounded-lg bg-bronze text-white transition-opacity hover:opacity-85"
            >
              <Mail className="size-4" />
            </a>
          </div>
        </div>

        <button
          type="button"
          onClick={() => goTo("track")}
          className="flex w-full items-center justify-between rounded-xl border border-line bg-white p-4 text-left shadow-sm transition-colors hover:bg-paper"
        >
          <span>
            <span className="block text-sm font-bold">Отследить заказ</span>
            <span className="mt-0.5 block text-xs text-muted">
              Статус по номеру заказа и почте
            </span>
          </span>
          <ChevronRight className="size-4 text-muted" />
        </button>

        <div className="rounded-xl border border-line bg-white p-2 shadow-sm">
          {FAQ.map((f, i) => (
            <div key={i} className={i > 0 ? "border-t border-line" : ""}>
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="flex w-full items-center justify-between gap-2 px-2.5 py-3 text-left text-[13px] font-semibold hover:text-bronze"
              >
                {f.q}
                <ChevronDown
                  className={`size-4 shrink-0 text-muted transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                />
              </button>
              {openFaq === i && (
                <p className="px-2.5 pb-3 text-[13px] leading-relaxed text-muted">
                  {f.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChatTab() {
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("umakov_chat");
      if (saved) setMessages(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem("umakov_chat", JSON.stringify(messages.slice(-30)));
    } catch {}
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || typing) return;
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setTyping(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(1) }),
      });
      const data = (await res.json()) as { reply?: string };
      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.reply || "Попробуйте ещё раз." },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Нет связи с сервером. Попробуйте позже." },
      ]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-line bg-ink px-4 py-3 text-white">
        <span className="grid size-9 place-items-center rounded-full bg-bronze">
          <MessageCircle className="size-4" />
        </span>
        <div>
          <p className="text-sm font-bold">Помощник UMAKOV</p>
          <p className="text-[11px] text-white/60">подбор товаров и ответы на вопросы</p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto bg-paper p-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
              m.role === "user"
                ? "ml-auto rounded-br-md bg-ink text-white"
                : "rounded-bl-md border border-line bg-white"
            }`}
          >
            {m.role === "assistant" ? renderText(m.content) : m.content}
          </div>
        ))}
        {typing && (
          <div className="w-fit rounded-2xl rounded-bl-md border border-line bg-white px-4 py-3">
            <span className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="size-1.5 animate-bounce rounded-full bg-muted"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="flex items-center gap-2 border-t border-line bg-white p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ваш вопрос…"
          className="min-w-0 flex-1 rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-bronze"
        />
        <button
          type="submit"
          disabled={typing || !input.trim()}
          aria-label="Отправить"
          className="grid size-10 shrink-0 place-items-center rounded-lg bg-ink text-white transition-opacity hover:opacity-85 disabled:opacity-40"
        >
          <Send className="size-4" />
        </button>
      </form>
    </div>
  );
}

type TrackResult = {
  display_id: number;
  created_at: string;
  total: number;
  status: string;
  payment_status: string;
  fulfillment_status: string;
};

function TrackTab() {
  const [result, setResult] = useState<TrackResult | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");
    setResult(null);
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order: String(fd.get("order")),
          email: String(fd.get("email")),
        }),
      });
      const data = (await res.json()) as {
        order?: TrackResult;
        notFound?: boolean;
        error?: string;
      };
      if (data.order) setResult(data.order);
      else if (data.notFound)
        setMessage("Заказ не найден. Проверьте номер и почту.");
      else setMessage(data.error || "Не получилось проверить заказ.");
    } catch {
      setMessage("Нет связи с сервером. Попробуйте позже.");
    } finally {
      setBusy(false);
    }
  };

  const input =
    "w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-bronze";

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="bg-ink px-5 py-4 text-white">
        <p className="text-lg font-extrabold">Отследить заказ</p>
      </div>
      <div className="space-y-3 p-4">
        <form onSubmit={submit} className="space-y-3 rounded-xl border border-line bg-white p-4 shadow-sm">
          <input name="order" required placeholder="Номер заказа, например 1001" className={input} />
          <input name="email" type="email" required placeholder="Почта из заказа" className={input} />
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-ink py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-85 disabled:opacity-50"
          >
            {busy ? "Проверяем…" : "Проверить"}
          </button>
          {message && <p className="text-sm text-muted">{message}</p>}
        </form>

        {result && (
          <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-extrabold">Заказ №{result.display_id}</p>
              <span className="text-xs text-muted">
                {new Date(result.created_at).toLocaleDateString("ru-RU")}
              </span>
            </div>
            <dl className="mt-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Оплата</dt>
                <dd className="font-semibold">
                  {paymentStatusRu(result.payment_status)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Доставка</dt>
                <dd className="font-semibold">
                  {fulfillmentStatusRu(result.fulfillment_status)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-line pt-1.5">
                <dt className="text-muted">Сумма</dt>
                <dd className="font-extrabold">{formatPrice(result.total)}</dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}

function HelpTab() {
  const [query, setQuery] = useState("");
  const [openArticle, setOpenArticle] = useState<string | null>(null);
  const q = query.trim().toLowerCase();
  const sections = HELP.map((c) => ({
    ...c,
    articles: q
      ? c.articles.filter(
          (a) =>
            a.title.toLowerCase().includes(q) || a.text.toLowerCase().includes(q)
        )
      : c.articles,
  })).filter((c) => c.articles.length > 0);

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="bg-ink px-5 py-4 text-white">
        <p className="text-lg font-extrabold">Справка</p>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по справке…"
          className="mt-3 w-full rounded-lg border-0 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/50 outline-none focus:bg-white/15"
        />
      </div>
      <div className="space-y-3 p-4">
        {sections.length === 0 && (
          <p className="text-sm text-muted">Ничего не нашлось — спросите в чате.</p>
        )}
        {sections.map((c) => (
          <div key={c.category} className="rounded-xl border border-line bg-white p-2 shadow-sm">
            <p className="px-2.5 pb-1 pt-2 text-xs font-bold uppercase tracking-wider text-muted">
              {c.category}
            </p>
            {c.articles.map((a) => (
              <div key={a.title} className="border-t border-line">
                <button
                  type="button"
                  onClick={() =>
                    setOpenArticle(openArticle === a.title ? null : a.title)
                  }
                  className="flex w-full items-center justify-between gap-2 px-2.5 py-3 text-left text-[13px] font-semibold hover:text-bronze"
                >
                  {a.title}
                  <ChevronDown
                    className={`size-4 shrink-0 text-muted transition-transform ${openArticle === a.title ? "rotate-180" : ""}`}
                  />
                </button>
                {openArticle === a.title && (
                  <p className="px-2.5 pb-3 text-[13px] leading-relaxed text-muted">
                    {a.text}
                  </p>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

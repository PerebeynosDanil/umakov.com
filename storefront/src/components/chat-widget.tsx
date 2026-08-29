"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { MessageCircle, Send, X } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

const GREETING: Msg = {
  role: "assistant",
  content:
    "Здравствуйте! Я помощник UMAKOV. Помогу подобрать забор, ворота, перила или комплектующие — просто опишите, что ищете.",
};

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
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("umakov_chat");
      if (saved) setMessages(JSON.parse(saved));
    } catch {}
    // ссылка вида /any-page#chat открывает виджет
    if (window.location.hash === "#chat") setOpen(true);
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem("umakov_chat", JSON.stringify(messages.slice(-30)));
    } catch {}
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing, open]);

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
        <div className="fixed bottom-22 right-5 z-50 flex h-[540px] max-h-[75vh] w-[360px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-2xl">
          <div className="flex items-center gap-3 bg-ink px-4 py-3 text-white">
            <span className="grid size-9 place-items-center rounded-full bg-bronze">
              <MessageCircle className="size-4" />
            </span>
            <div>
              <p className="text-sm font-bold">Помощник UMAKOV</p>
              <p className="text-[11px] text-white/60">
                подбор товаров и ответы на вопросы
              </p>
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
      )}
    </>
  );
}

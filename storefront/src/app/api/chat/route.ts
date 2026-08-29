import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { medusaFetch, getRegionId } from "@/lib/medusa-server";
import { formatPrice } from "@/lib/format";

export const runtime = "nodejs";

type ChatMessage = { role: "user" | "assistant"; content: string };

type FoundProduct = {
  title: string;
  url: string;
  price: string;
  sku?: string;
};

async function searchProducts(query: string): Promise<FoundProduct[]> {
  const region_id = await getRegionId();
  const { products } = await medusaFetch<{
    products: {
      title: string;
      handle: string;
      variants?: {
        sku?: string | null;
        calculated_price?: { calculated_amount?: number };
      }[];
    }[];
  }>("/store/products", {
    q: query,
    limit: 5,
    region_id,
    fields: "title,handle,*variants.calculated_price",
  });
  return products.map((p) => {
    const amounts = (p.variants ?? [])
      .map((v) => v.calculated_price?.calculated_amount)
      .filter((a): a is number => typeof a === "number");
    return {
      title: p.title,
      url: `/products/${p.handle}`,
      price: amounts.length ? formatPrice(Math.min(...amounts)) : "—",
      sku: p.variants?.[0]?.sku ?? undefined,
    };
  });
}

const SYSTEM = `Ты — помощник интернет-магазина UMAKOV Germany (umakov.de).
Магазин продаёт заборы, ворота и калитки, перила и ограждения, перегородки,
навесы, автоматику для ворот, комплектующие из нержавеющей стали и алюминия.
Доставка по всей Германии; возможен самостоятельный монтаж (полный комплект и
инструкция) или монтаж под ключ нашей бригадой; есть сервис и ремонт.

Правила:
- Отвечай на языке, на котором пишет клиент. Коротко и по делу, без воды.
- Для вопросов о товарах ВСЕГДА пользуйся инструментом search_products
  (запрос формулируй по-английски или по-словацки — названия товаров в
  каталоге на этих языках). Не выдумывай товары и цены.
- Найденные товары показывай списком в формате [название](ссылка) — цена.
- Если ничего не нашлось, предложи переформулировать или связаться с нами.
- По вопросам монтажа, замера, сервиса предлагай оставить заявку на странице
  [Контакты](/contacts) или открыть [Конфигуратор](/configurator).
- Не отвечай на темы, не связанные с магазином, — вежливо возвращай разговор
  к ассортименту и услугам.`;

const searchTool: Anthropic.Beta.BetaTool = {
  name: "search_products",
  description:
    "Поиск товаров в каталоге магазина по текстовому запросу. Возвращает до 5 товаров: название, ссылку, цену в EUR, артикул.",
  input_schema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description:
          "Поисковый запрос: название товара, артикул или ключевые слова (лучше по-английски или по-словацки)",
      },
    },
    required: ["query"],
    additionalProperties: false,
  },
  strict: true,
};

/** Без ключа Anthropic работаем как простой поиск по каталогу. */
async function fallbackReply(messages: ChatMessage[]): Promise<string> {
  const last = [...messages].reverse().find((m) => m.role === "user");
  if (!last) return "Напишите, какой товар вы ищете.";
  const found = await searchProducts(last.content);
  if (!found.length) {
    return "По вашему запросу ничего не нашлось. Попробуйте другое название (лучше по-английски) или артикул — либо напишите нам через страницу [Контакты](/contacts).";
  }
  return (
    "Вот что нашлось в каталоге:\n" +
    found.map((f) => `- [${f.title}](${f.url}) — ${f.price}`).join("\n") +
    "\n\nЕсли нужно другое — уточните название или артикул, либо напишите нам на странице [Контакты](/contacts)."
  );
}

async function claudeReply(messages: ChatMessage[]): Promise<string> {
  const client = new Anthropic();
  const history: Anthropic.Beta.BetaMessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  for (let round = 0; round < 4; round++) {
    const response = await client.beta.messages.create({
      model: "claude-opus-5",
      max_tokens: 2048,
      output_config: { effort: "low" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: [
        { type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } },
      ],
      tools: [searchTool],
      messages: history,
    });

    if (response.stop_reason === "refusal") {
      return "Извините, на этот вопрос я ответить не могу. Спросите меня о товарах и услугах UMAKOV.";
    }

    if (response.stop_reason === "pause_turn") {
      history.push({ role: "assistant", content: response.content });
      continue;
    }

    const toolUses = response.content.filter(
      (b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use"
    );
    if (response.stop_reason !== "tool_use" || toolUses.length === 0) {
      return response.content
        .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
    }

    history.push({ role: "assistant", content: response.content });
    const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
    for (const tu of toolUses) {
      let content: string;
      try {
        const { query } = tu.input as { query: string };
        content = JSON.stringify(await searchProducts(query));
      } catch (err) {
        content = `Ошибка поиска: ${err instanceof Error ? err.message : "unknown"}`;
      }
      results.push({
        type: "tool_result",
        tool_use_id: tu.id,
        content,
      });
    }
    history.push({ role: "user", content: results });
  }
  return "Не получилось подобрать ответ — попробуйте переформулировать вопрос.";
}

export async function POST(req: Request) {
  try {
    const { messages } = (await req.json()) as { messages: ChatMessage[] };
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "messages required" }, { status: 400 });
    }
    const trimmed = messages.slice(-12);
    const reply = process.env.ANTHROPIC_API_KEY
      ? await claudeReply(trimmed)
      : await fallbackReply(trimmed);
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("chat error:", err);
    return NextResponse.json(
      { reply: "Что-то пошло не так. Попробуйте ещё раз чуть позже." },
      { status: 200 }
    );
  }
}

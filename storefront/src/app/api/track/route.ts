import { NextResponse } from "next/server";

/**
 * Отслеживание заказа для гостей: номер заказа + почта.
 * Ходит в админ-API Medusa с секретным ключом (только на сервере).
 */

const BASE =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";

type AdminOrder = {
  display_id: number;
  email: string;
  status: string;
  payment_status: string;
  fulfillment_status: string;
  total: number;
  created_at: string;
};

export async function POST(req: Request) {
  const key = process.env.MEDUSA_ADMIN_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "Отслеживание пока не настроено." },
      { status: 200 }
    );
  }
  try {
    const { order, email } = (await req.json()) as {
      order: string;
      email: string;
    };
    const displayId = parseInt(String(order).replace(/\D/g, ""), 10);
    if (!displayId || !email) {
      return NextResponse.json(
        { error: "Укажите номер заказа и почту." },
        { status: 200 }
      );
    }
    const url = new URL("/admin/orders", BASE);
    url.searchParams.set("q", String(displayId));
    url.searchParams.set("limit", "20");
    url.searchParams.set(
      "fields",
      "display_id,email,status,payment_status,fulfillment_status,total,created_at"
    );
    const res = await fetch(url, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${key}:`).toString("base64")}`,
      },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`admin ${res.status}`);
    const { orders } = (await res.json()) as { orders: AdminOrder[] };
    const match = orders.find(
      (o) =>
        o.display_id === displayId &&
        o.email?.toLowerCase() === email.trim().toLowerCase()
    );
    if (!match) {
      return NextResponse.json({ notFound: true });
    }
    return NextResponse.json({
      order: {
        display_id: match.display_id,
        created_at: match.created_at,
        total: match.total,
        status: match.status,
        payment_status: match.payment_status,
        fulfillment_status: match.fulfillment_status,
      },
    });
  } catch (err) {
    console.error("track error:", err);
    return NextResponse.json(
      { error: "Не получилось проверить заказ, попробуйте позже." },
      { status: 200 }
    );
  }
}

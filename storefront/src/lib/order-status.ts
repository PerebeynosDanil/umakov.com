/** Русские подписи статусов заказа (используются в кабинете и чате). */

export const ORDER_STATUS_RU: Record<string, string> = {
  pending: "В обработке",
  completed: "Завершён",
  draft: "Черновик",
  archived: "В архиве",
  canceled: "Отменён",
  requires_action: "Требует действия",
};

export const PAYMENT_STATUS_RU: Record<string, string> = {
  not_paid: "Не оплачен",
  awaiting: "Ожидает оплаты",
  authorized: "Ожидает оплаты (счёт выставлен)",
  partially_authorized: "Ожидает оплаты",
  captured: "Оплачен",
  partially_captured: "Оплачен частично",
  partially_refunded: "Частичный возврат",
  refunded: "Возврат средств",
  canceled: "Оплата отменена",
};

export const FULFILLMENT_STATUS_RU: Record<string, string> = {
  not_fulfilled: "В обработке",
  partially_fulfilled: "Собран частично",
  fulfilled: "Собран",
  partially_shipped: "Отправлен частично",
  shipped: "Отправлен",
  partially_delivered: "Доставлен частично",
  delivered: "Доставлен",
  canceled: "Отменён",
};

export function orderStatusRu(s?: string | null): string {
  return (s && ORDER_STATUS_RU[s]) || s || "—";
}
export function paymentStatusRu(s?: string | null): string {
  return (s && PAYMENT_STATUS_RU[s]) || s || "—";
}
export function fulfillmentStatusRu(s?: string | null): string {
  return (s && FULFILLMENT_STATUS_RU[s]) || s || "—";
}

/** Цвет бейджа: зелёный — хорошо, янтарный — ждём, серый — нейтрально, красный — отмена. */
export function statusTone(s?: string | null): "green" | "amber" | "gray" | "red" {
  switch (s) {
    case "captured":
    case "delivered":
    case "shipped":
    case "completed":
      return "green";
    case "not_paid":
    case "awaiting":
    case "authorized":
    case "not_fulfilled":
    case "pending":
      return "amber";
    case "canceled":
    case "refunded":
      return "red";
    default:
      return "gray";
  }
}

export const TONE_CLS: Record<ReturnType<typeof statusTone>, string> = {
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  red: "bg-red-50 text-red-600 border-red-200",
  gray: "bg-paper text-muted border-line",
};

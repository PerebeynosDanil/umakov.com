import Medusa from "@medusajs/js-sdk";

/** Клиент Medusa для браузера: сессионная авторизация покупателя (cookie). */
export const sdk = new Medusa({
  baseUrl: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000",
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
  auth: { type: "session" },
});

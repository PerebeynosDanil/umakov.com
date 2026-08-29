import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * Сброс пароля покупателя: Medusa генерирует токен и бросает событие,
 * мы формируем ссылку на страницу /account/reset витрины.
 *
 * Пока письмо не отправляется (нет почтового провайдера) — ссылка
 * пишется в лог бэкенда. При деплое подключить Resend/SMTP и слать
 * письмо здесь же через notification-модуль.
 */
export default async function passwordResetHandler({
  event: { data },
  container,
}: SubscriberArgs<{ entity_id: string; token: string; actor_type: string }>) {
  if (data.actor_type !== "customer") return;
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const base = process.env.STOREFRONT_URL ?? "http://localhost:3000";
  const url = `${base}/account/reset?token=${encodeURIComponent(
    data.token
  )}&email=${encodeURIComponent(data.entity_id)}`;
  logger.info(`[password-reset] Ссылка сброса пароля для ${data.entity_id}: ${url}`);
}

export const config: SubscriberConfig = {
  event: "auth.password_reset",
};

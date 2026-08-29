export const NAV = [
  { label: "Продукты", href: "/products" },
  { label: "Конфигуратор", href: "/configurator" },
  { label: "Монтаж", href: "/installation" },
  { label: "Сервис и ремонт", href: "/service" },
  { label: "Проекты", href: "/projects" },
  { label: "О нас", href: "/about" },
  { label: "Контакты", href: "/contacts" },
] as const;

export const CONTACTS = {
  phone: "+49 123 456 789",
  phoneHref: "tel:+49123456789",
  email: "info@umakov.de",
  whatsapp: "https://wa.me/49123456789",
};

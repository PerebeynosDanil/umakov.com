/**
 * Клиентские проверки формы оформления заказа.
 * Дублируются на бэкенде (backend src/api/middlewares.ts) — при правке
 * правил менять в обоих местах.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_RE = /^[\p{L}][\p{L}' -]{1,49}$/u;
const CITY_RE = /^[\p{L}][\p{L}' .-]{1,79}$/u;

const POSTAL_RE: Record<string, { re: RegExp; hint: string }> = {
  de: { re: /^\d{5}$/, hint: "5 цифр, например 10115" },
  at: { re: /^\d{4}$/, hint: "4 цифры, например 1010" },
  sk: { re: /^\d{3}\s?\d{2}$/, hint: "например 811 01" },
  cz: { re: /^\d{3}\s?\d{2}$/, hint: "например 110 00" },
  pl: { re: /^\d{2}-?\d{3}$/, hint: "например 00-001" },
  fr: { re: /^\d{5}$/, hint: "5 цифр, например 75001" },
  it: { re: /^\d{5}$/, hint: "5 цифр, например 00100" },
  nl: { re: /^\d{4}\s?[A-Za-z]{2}$/, hint: "например 1012 AB" },
};

export type CheckoutFields = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address_1: string;
  postal_code: string;
  city: string;
  country_code: string;
};

export function validateCheckout(
  v: CheckoutFields
): Partial<Record<keyof CheckoutFields, string>> {
  const errors: Partial<Record<keyof CheckoutFields, string>> = {};

  if (!NAME_RE.test(v.first_name.trim())) {
    errors.first_name = "Введите имя (минимум 2 буквы, без цифр).";
  }
  if (!NAME_RE.test(v.last_name.trim())) {
    errors.last_name = "Введите фамилию (минимум 2 буквы, без цифр).";
  }
  if (!EMAIL_RE.test(v.email.trim())) {
    errors.email = "Введите настоящий адрес почты, например name@mail.de.";
  }
  const phoneDigits = v.phone.replace(/[\s()\/-]/g, "");
  if (!/^\+?\d{7,15}$/.test(phoneDigits)) {
    errors.phone = "Введите телефон цифрами, например +49 151 2345678.";
  }
  const street = v.address_1.trim();
  if (street.length < 5 || !/\p{L}/u.test(street)) {
    errors.address_1 = "Укажите улицу и номер дома.";
  }
  if (!CITY_RE.test(v.city.trim())) {
    errors.city = "Введите название города.";
  }
  const postal = POSTAL_RE[v.country_code.toLowerCase()];
  if (postal && !postal.re.test(v.postal_code.trim())) {
    errors.postal_code = `Неверный индекс: ${postal.hint}.`;
  }
  return errors;
}

import {
  defineMiddlewares,
  type MedusaNextFunction,
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http";

/**
 * Серверная валидация данных оформления заказа и регистрации.
 * Клиентские проверки в витрине — только для удобства; настоящая
 * защита здесь: мимо неё не пройти даже прямым запросом к API.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_RE = /^[\p{L}][\p{L}' -]{1,49}$/u;
const CITY_RE = /^[\p{L}][\p{L}' .-]{1,79}$/u;

// форматы почтовых индексов стран региона
const POSTAL_RE: Record<string, RegExp> = {
  de: /^\d{5}$/,
  at: /^\d{4}$/,
  sk: /^\d{3}\s?\d{2}$/,
  cz: /^\d{3}\s?\d{2}$/,
  pl: /^\d{2}-?\d{3}$/,
  fr: /^\d{5}$/,
  it: /^\d{5}$/,
  nl: /^\d{4}\s?[A-Za-z]{2}$/,
};

function validPhone(raw: string): boolean {
  const digits = raw.replace(/[\s()\/-]/g, "");
  return /^\+?\d{7,15}$/.test(digits);
}

type AddressBody = {
  first_name?: string;
  last_name?: string;
  phone?: string;
  address_1?: string;
  postal_code?: string;
  city?: string;
  country_code?: string;
};

function addressErrors(a: AddressBody, label: string): string[] {
  const errors: string[] = [];
  if (a.first_name !== undefined && !NAME_RE.test(a.first_name.trim())) {
    errors.push(`${label}: некорректное имя`);
  }
  if (a.last_name !== undefined && !NAME_RE.test(a.last_name.trim())) {
    errors.push(`${label}: некорректная фамилия`);
  }
  if (a.phone !== undefined && a.phone !== "" && !validPhone(a.phone)) {
    errors.push(`${label}: некорректный телефон`);
  }
  if (a.address_1 !== undefined) {
    const street = a.address_1.trim();
    if (street.length < 5 || !/\p{L}/u.test(street)) {
      errors.push(`${label}: укажите улицу и дом`);
    }
  }
  if (a.city !== undefined && !CITY_RE.test(a.city.trim())) {
    errors.push(`${label}: некорректный город`);
  }
  if (a.postal_code !== undefined && a.country_code) {
    const re = POSTAL_RE[a.country_code.toLowerCase()];
    if (re && !re.test(a.postal_code.trim())) {
      errors.push(`${label}: неверный формат индекса для выбранной страны`);
    }
  }
  return errors;
}

function validateCartUpdate(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const body = (req.body ?? {}) as {
    email?: string;
    shipping_address?: AddressBody;
    billing_address?: AddressBody;
  };
  const errors: string[] = [];
  if (body.email !== undefined && !EMAIL_RE.test(body.email.trim())) {
    errors.push("Некорректный адрес почты");
  }
  if (body.shipping_address) {
    errors.push(...addressErrors(body.shipping_address, "Адрес доставки"));
  }
  if (body.billing_address) {
    errors.push(...addressErrors(body.billing_address, "Платёжный адрес"));
  }
  if (errors.length) {
    res.status(400).json({ type: "invalid_data", message: errors.join(". ") });
    return;
  }
  next();
}

function validateRegister(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const body = (req.body ?? {}) as { email?: string; password?: string };
  const errors: string[] = [];
  if (!body.email || !EMAIL_RE.test(body.email.trim())) {
    errors.push("Некорректный адрес почты");
  }
  if (!body.password || body.password.length < 8) {
    errors.push("Пароль должен быть не короче 8 символов");
  }
  if (errors.length) {
    res.status(400).json({ type: "invalid_data", message: errors.join(". ") });
    return;
  }
  next();
}

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/carts/:id",
      method: "POST",
      middlewares: [validateCartUpdate],
    },
    {
      matcher: "/auth/customer/emailpass/register",
      method: "POST",
      middlewares: [validateRegister],
    },
  ],
});

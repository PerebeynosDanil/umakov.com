"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { HttpTypes } from "@medusajs/types";
import { sdk } from "@/lib/medusa";

type AccountContextValue = {
  customer: HttpTypes.StoreCustomer | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  update: (data: {
    first_name?: string;
    last_name?: string;
    phone?: string;
  }) => Promise<void>;
};

const AccountContext = createContext<AccountContextValue | null>(null);

export function useAccount(): AccountContextValue {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccount вне AccountProvider");
  return ctx;
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<HttpTypes.StoreCustomer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sdk.store.customer
      .retrieve()
      .then(({ customer }) => setCustomer(customer))
      .catch(() => setCustomer(null))
      .finally(() => setLoading(false));
  }, []);

  /** Привязать гостевую корзину к вошедшему покупателю. */
  const claimCart = useCallback(async () => {
    try {
      const cartId = localStorage.getItem("umakov_cart_id");
      if (cartId) await sdk.store.cart.transferCart(cartId);
    } catch {
      // корзины может не быть — не страшно
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      await sdk.auth.login("customer", "emailpass", { email, password });
      const { customer } = await sdk.store.customer.retrieve();
      setCustomer(customer);
      await claimCart();
    },
    [claimCart]
  );

  const register = useCallback(
    async (data: {
      email: string;
      password: string;
      first_name: string;
      last_name: string;
    }) => {
      let freshIdentity = true;
      try {
        await sdk.auth.register("customer", "emailpass", {
          email: data.email,
          password: data.password,
        });
      } catch {
        // идентичность уже существует (например, прошлая регистрация
        // оборвалась на полпути) — пробуем войти с этим же паролем;
        // если пароль другой, здесь бросит и покажем обычную ошибку
        freshIdentity = false;
        await sdk.auth.login("customer", "emailpass", {
          email: data.email,
          password: data.password,
        });
      }
      if (freshIdentity) {
        await sdk.store.customer.create({
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
        });
        await sdk.auth.login("customer", "emailpass", {
          email: data.email,
          password: data.password,
        });
      } else {
        // вошли по существующей идентичности; если покупателя ещё
        // нет — досоздаём его и обновляем сессию
        try {
          await sdk.store.customer.retrieve();
        } catch {
          await sdk.store.customer.create({
            email: data.email,
            first_name: data.first_name,
            last_name: data.last_name,
          });
          await sdk.auth.refresh();
        }
      }
      const { customer } = await sdk.store.customer.retrieve();
      setCustomer(customer);
      await claimCart();
    },
    [claimCart]
  );

  const logout = useCallback(async () => {
    await sdk.auth.logout();
    setCustomer(null);
  }, []);

  const update = useCallback(
    async (data: { first_name?: string; last_name?: string; phone?: string }) => {
      const { customer } = await sdk.store.customer.update(data);
      setCustomer(customer);
    },
    []
  );

  const value = useMemo(
    () => ({ customer, loading, login, register, logout, update }),
    [customer, loading, login, register, logout, update]
  );

  return (
    <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
  );
}

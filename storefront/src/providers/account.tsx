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

  const login = useCallback(async (email: string, password: string) => {
    await sdk.auth.login("customer", "emailpass", { email, password });
    const { customer } = await sdk.store.customer.retrieve();
    setCustomer(customer);
  }, []);

  const register = useCallback(
    async (data: {
      email: string;
      password: string;
      first_name: string;
      last_name: string;
    }) => {
      await sdk.auth.register("customer", "emailpass", {
        email: data.email,
        password: data.password,
      });
      await sdk.store.customer.create({
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
      });
      await sdk.auth.login("customer", "emailpass", {
        email: data.email,
        password: data.password,
      });
      const { customer } = await sdk.store.customer.retrieve();
      setCustomer(customer);
    },
    []
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

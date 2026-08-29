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

const CART_ID_KEY = "umakov_cart_id";

type CartContextValue = {
  cart: HttpTypes.StoreCart | null;
  itemCount: number;
  busy: boolean;
  addItem: (variantId: string, quantity?: number) => Promise<void>;
  updateItem: (lineId: string, quantity: number) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>;
  refresh: () => Promise<void>;
  /** Забыть корзину локально (после успешного оформления заказа). */
  reset: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart вне CartProvider");
  return ctx;
}

async function getRegionId(): Promise<string> {
  const { regions } = await sdk.store.region.list();
  return regions[0]?.id ?? "";
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<HttpTypes.StoreCart | null>(null);
  const [busy, setBusy] = useState(false);

  const loadCart = useCallback(async (): Promise<HttpTypes.StoreCart | null> => {
    const id =
      typeof window !== "undefined" ? localStorage.getItem(CART_ID_KEY) : null;
    if (!id) return null;
    try {
      const { cart } = await sdk.store.cart.retrieve(id);
      // оплаченная корзина больше не редактируется — начинаем новую
      if (cart.completed_at) {
        localStorage.removeItem(CART_ID_KEY);
        return null;
      }
      return cart;
    } catch {
      localStorage.removeItem(CART_ID_KEY);
      return null;
    }
  }, []);

  const ensureCart = useCallback(async (): Promise<HttpTypes.StoreCart> => {
    const existing = await loadCart();
    if (existing) return existing;
    const region_id = await getRegionId();
    const { cart } = await sdk.store.cart.create({ region_id });
    localStorage.setItem(CART_ID_KEY, cart.id);
    setCart(cart);
    return cart;
  }, [loadCart]);

  useEffect(() => {
    loadCart().then((c) => setCart(c));
  }, [loadCart]);

  const refresh = useCallback(async () => {
    setCart(await loadCart());
  }, [loadCart]);

  const addItem = useCallback(
    async (variantId: string, quantity = 1) => {
      setBusy(true);
      try {
        const current = await ensureCart();
        await sdk.store.cart.createLineItem(current.id, {
          variant_id: variantId,
          quantity,
        });
        // ответ мутации приходит без пересчитанных сумм — берём свежую корзину
        const { cart } = await sdk.store.cart.retrieve(current.id);
        setCart(cart);
      } finally {
        setBusy(false);
      }
    },
    [ensureCart]
  );

  const updateItem = useCallback(
    async (lineId: string, quantity: number) => {
      if (!cart) return;
      setBusy(true);
      try {
        await sdk.store.cart.updateLineItem(cart.id, lineId, { quantity });
        const { cart: updated } = await sdk.store.cart.retrieve(cart.id);
        setCart(updated);
      } finally {
        setBusy(false);
      }
    },
    [cart]
  );

  const removeItem = useCallback(
    async (lineId: string) => {
      if (!cart) return;
      setBusy(true);
      try {
        await sdk.store.cart.deleteLineItem(cart.id, lineId);
        const { cart: updated } = await sdk.store.cart.retrieve(cart.id);
        setCart(updated);
      } finally {
        setBusy(false);
      }
    },
    [cart]
  );

  const reset = useCallback(() => {
    localStorage.removeItem(CART_ID_KEY);
    setCart(null);
  }, []);

  const itemCount = useMemo(
    () => cart?.items?.reduce((sum, i) => sum + i.quantity, 0) ?? 0,
    [cart]
  );

  const value = useMemo(
    () => ({ cart, itemCount, busy, addItem, updateItem, removeItem, refresh, reset }),
    [cart, itemCount, busy, addItem, updateItem, removeItem, refresh, reset]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

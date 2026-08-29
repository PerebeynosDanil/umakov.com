"use client";

import type { ReactNode } from "react";
import { CartProvider } from "@/providers/cart";
import { AccountProvider } from "@/providers/account";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AccountProvider>
      <CartProvider>{children}</CartProvider>
    </AccountProvider>
  );
}

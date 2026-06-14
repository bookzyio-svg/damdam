"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { type CartItem, lineKey } from "@/lib/cart/types";

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number; // centimes
  ready: boolean;
  add: (item: CartItem) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "bh_cart_v1";
const TOKEN_KEY = "bh_cart_token";

function readStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function getToken(): string {
  let t = localStorage.getItem(TOKEN_KEY);
  if (!t) {
    t = crypto.randomUUID();
    localStorage.setItem(TOKEN_KEY, t);
  }
  return t;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Chargement initial depuis localStorage
  useEffect(() => {
    setItems(readStorage());
    setReady(true);
  }, []);

  // Persistance locale + synchro serveur (panier abandonné) débattue
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* quota plein : on ignore */
    }
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      const token = getToken();
      const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
      fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, items, subtotal }),
        keepalive: true,
      }).catch(() => {});
    }, 1200);
  }, [items, ready]);

  const add = useCallback((item: CartItem) => {
    setItems((arr) => {
      const key = lineKey(item);
      const idx = arr.findIndex((i) => lineKey(i) === key);
      if (idx === -1) return [...arr, item];
      const copy = [...arr];
      const max = item.maxStock && item.maxStock > 0 ? item.maxStock : Infinity;
      copy[idx] = {
        ...copy[idx],
        quantity: Math.min(copy[idx].quantity + item.quantity, max),
      };
      return copy;
    });
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setItems((arr) =>
      arr
        .map((i) => {
          if (lineKey(i) !== key) return i;
          const max = i.maxStock && i.maxStock > 0 ? i.maxStock : Infinity;
          return { ...i, quantity: Math.max(1, Math.min(qty, max)) };
        })
        .filter((i) => i.quantity > 0),
    );
  }, []);

  const remove = useCallback((key: string) => {
    setItems((arr) => arr.filter((i) => lineKey(i) !== key));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((s, i) => s + i.quantity, 0);
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    return { items, count, subtotal, ready, add, setQty, remove, clear };
  }, [items, ready, add, setQty, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart doit être utilisé dans <CartProvider>");
  return ctx;
}

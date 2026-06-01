"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface CartItem {
  id: number;
  name: string;
  price: number;
  origPrice: number;
  size?: string;
  qty: number;
  icon: string;
  color: string;
  image?: string;
  memberDiscount?: boolean;
}

interface CartCtx {
  items: CartItem[];
  count: number;
  total: number;
  addItem: (item: Omit<CartItem, "qty">, qty?: number) => void;
  removeItem: (id: number, size?: string) => void;
  updateQty: (id: number, size: string | undefined, qty: number) => void;
  clearCart: () => void;
}

const Ctx = createContext<CartCtx>({
  items: [], count: 0, total: 0,
  addItem: () => {}, removeItem: () => {}, updateQty: () => {}, clearCart: () => {},
});

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("ascghana_cart") || "[]"); } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem("ascghana_cart", JSON.stringify(items));
  }, [items]);

  const key = (id: number, size?: string) => `${id}-${size || ""}`;

  const addItem = (item: Omit<CartItem, "qty">, qty = 1) => {
    setItems(prev => {
      const k = key(item.id, item.size);
      const exists = prev.find(x => key(x.id, x.size) === k);
      if (exists) return prev.map(x => key(x.id, x.size) === k ? { ...x, qty: x.qty + qty } : x);
      return [...prev, { ...item, qty }];
    });
  };

  const removeItem = (id: number, size?: string) =>
    setItems(prev => prev.filter(x => key(x.id, x.size) !== key(id, size)));

  const updateQty = (id: number, size: string | undefined, qty: number) => {
    if (qty <= 0) { removeItem(id, size); return; }
    setItems(prev => prev.map(x => key(x.id, x.size) === key(id, size) ? { ...x, qty } : x));
  };

  const clearCart = () => setItems([]);

  const count = items.reduce((s, i) => s + i.qty, 0);
  const total  = items.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <Ctx.Provider value={{ items, count, total, addItem, removeItem, updateQty, clearCart }}>
      {children}
    </Ctx.Provider>
  );
}

export const useCart = () => useContext(Ctx);

import { createContext, useContext, useMemo, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]); // [{ labTest }]

  function addItem(labTest) {
    setItems((prev) => (prev.some((i) => i.id === labTest.id) ? prev : [...prev, labTest]));
  }

  function removeItem(labTestId) {
    setItems((prev) => prev.filter((i) => i.id !== labTestId));
  }

  function clear() {
    setItems([]);
  }

  const total = useMemo(() => items.reduce((sum, i) => sum + i.price, 0), [items]);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clear, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

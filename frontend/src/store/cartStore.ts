import { create } from 'zustand';
import type { CartItem, Product } from '@/types';

interface CartStore {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTax: (taxRate?: number) => number;
  getDiscount: () => number;
  setDiscount: (amount: number) => void;
  getTotal: (taxRate?: number) => number;
  discount: number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  discount: 0,

  addItem: (product: Product) => {
    const existing = get().items.find((i) => i.product.id === product.id);
    if (existing) {
      if (existing.quantity < product.stock) {
        set((state) => ({
          items: state.items.map((i) =>
            i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        }));
      }
    } else {
      if (product.stock > 0) {
        set((state) => ({ items: [...state.items, { product, quantity: 1 }] }));
      }
    }
  },

  removeItem: (productId: string) => {
    set((state) => ({ items: state.items.filter((i) => i.product.id !== productId) }));
  },

  updateQuantity: (productId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    set((state) => ({
      items: state.items.map((i) => {
        if (i.product.id === productId) {
          const maxQty = i.product.stock;
          return { ...i, quantity: Math.min(quantity, maxQty) };
        }
        return i;
      }),
    }));
  },

  clearCart: () => set({ items: [], discount: 0 }),

  setDiscount: (amount: number) => set({ discount: amount }),

  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);
  },

  getDiscount: () => get().discount,

  getTax: (taxRate = 10) => {
    const subtotal = get().getSubtotal();
    const discount = get().discount;
    return (subtotal - discount) * (taxRate / 100);
  },

  getTotal: (taxRate = 10) => {
    const subtotal = get().getSubtotal();
    const discount = get().discount;
    const tax = (subtotal - discount) * (taxRate / 100);
    return subtotal - discount + tax;
  },
}));

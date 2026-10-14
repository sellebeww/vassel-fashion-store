import { createContext, useContext } from "react";
import type { Bootstrap, CartLine, Product, User, Variant } from "./types";
export interface Store {
  data: Bootstrap;
  cart: CartLine[];
  wishlist: string[];
  navigate: (path: string) => void;
  refresh: () => Promise<void>;
  setUser: (user: User | null) => Promise<void>;
  updateCart: (lines: CartLine[]) => Promise<void>;
  add: (p: Product, v: Variant, q?: number) => Promise<void>;
  toggleWish: (id: string) => void;
  notify: (message: string, error?: boolean) => void;
  path: string;
  logout: () => Promise<void>;
}
export const StoreContext = createContext<Store>(null!);
export const useStore = () => useContext(StoreContext);

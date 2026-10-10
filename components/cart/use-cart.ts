"use client";

import { useSyncExternalStore } from "react";
import {
  CART_STORAGE_KEY,
  addLine,
  hasLine,
  parseCart,
  removeLine,
  type CartLine,
} from "@/lib/cart/store";

// A tiny external store: the cart lives in memory and is mirrored to
// localStorage. If storage is unavailable (private mode, blocked site data)
// the cart still works for the current page.
const EMPTY: CartLine[] = [];
const listeners = new Set<() => void>();
let lines: CartLine[] | null = null;

function read(): CartLine[] {
  if (lines === null) {
    try {
      lines = parseCart(window.localStorage.getItem(CART_STORAGE_KEY));
    } catch {
      lines = [];
    }
  }
  return lines;
}

function write(next: CartLine[]) {
  if (next === lines) return;
  lines = next;
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Keep the in-memory cart.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Pick up changes made in another tab.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== CART_STORAGE_KEY) return;
    lines = null;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

const subscribeNever = () => () => {};

export function useCart() {
  const current = useSyncExternalStore(subscribe, read, () => EMPTY);
  // False during server rendering and hydration, true once the stored cart is known.
  const ready = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );

  return {
    lines: current,
    count: current.length,
    ready,
    has: (line: CartLine) => hasLine(current, line),
    add: (line: CartLine) => write(addLine(read(), line)),
    remove: (line: CartLine) => write(removeLine(read(), line)),
    replace: (next: CartLine[]) => write(next),
  };
}

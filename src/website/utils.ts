import { derived, type Readable } from 'svelte/store';

export type Unsubscriber = () => void;

export function filtered<T, U>(store: Readable<T>, predicate: (value: unknown) => value is U) {
  return derived<Readable<T>, U>(store, ($store: T, set: (value: U) => void) => {
    if (predicate($store)) {
      set($store);
    }
  });
}

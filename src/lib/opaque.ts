class Branded<T> {
  private __brand!: T;
}

export type Opaque<T, K> = T & Branded<K>;

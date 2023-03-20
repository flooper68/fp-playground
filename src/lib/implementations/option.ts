class Some<V> {
  readonly type = "Some";

  constructor(private readonly _value: V) {}

  unwrap(): V {
    return this._value;
  }

  match<A, B>(onSome: (value: V) => A, _onNone: () => B) {
    return onSome(this._value);
  }

  map<C>(f: (value: V) => C): Option<C> {
    return new Some(f(this._value));
  }
}

class None<V> {
  readonly type = "None";

  unwrap(): never {
    throw new Error("Cannot unwrap None");
  }

  match<A, B>(_onSome: (value: V) => A, onNone: () => B) {
    return onNone();
  }

  map<C>(f: (value: V) => C): Option<C> {
    return new None();
  }
}

export type Option<V> = Some<V> | None<V>;

export const Option = {
  None() {
    return new None<never>();
  },
  Some<V>(value: V) {
    return new Some(value);
  },
  fromNullable<V>(value: V | null | undefined): Option<V> {
    if (value === null || value === undefined) {
      return new None();
    }
    return new Some(value);
  },
};

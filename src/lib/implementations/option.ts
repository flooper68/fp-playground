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

  isSome(): this is Some<V> {
    return true;
  }

  isNone(): this is never {
    return false;
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

  isSome(): this is never {
    return false;
  }

  isNone(): this is None<V> {
    return true;
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
  compare(a: Option<unknown>, b: Option<unknown>): boolean {
    if (a.isNone() && b.isNone()) {
      return true;
    }

    if (a.isSome() && b.isSome()) {
      return a.unwrap() === b.unwrap();
    }

    return false;
  },
};

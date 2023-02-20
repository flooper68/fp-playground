import { of } from "fp-ts/lib/ReaderT";
import { OptionTypeTag } from "../higher-kinded-types";
import { Functor1 } from "../type-classes/functor";
import { Monad1 } from "../type-classes/monad";

interface IdentifyableOption<A> {
  isSome(): this is Some<A>;
  isNone(): this is None;
  unwrap(): A;
}

export class Some<A>
  implements
    Functor1<typeof OptionTypeTag, A>,
    IdentifyableOption<A>,
    Monad1<typeof OptionTypeTag, A>
{
  private constructor(private readonly _value: A) {}

  static of<A>(a: A): Some<A> {
    return new Some(a);
  }

  map<B>(f: (a: A) => B): Some<B> {
    return new Some(f(this._value));
  }

  chain<B>(f: (a: A) => Option<B>): Option<B> {
    return f(this._value);
  }

  fold<B, C>(onSome: (a: A) => B, _onNone: () => C): B | C {
    return onSome(this._value);
  }

  isSome(): this is Some<A> {
    return true;
  }

  isNone(): this is never {
    return false;
  }

  unwrap(): A {
    return this._value;
  }
}

export class None
  implements
    Functor1<typeof OptionTypeTag, never>,
    IdentifyableOption<never>,
    Monad1<typeof OptionTypeTag, never>
{
  static of(): None {
    return new None();
  }

  map<B>(_f: (a: never) => B): None {
    return new None();
  }

  chain<A>(_f: (a: never) => Option<A>): None {
    return new None();
  }

  fold<B, C>(_onSome: (a: never) => B, onNone: () => C): B | C {
    return onNone();
  }

  isSome(): this is never {
    return false;
  }

  isNone(): this is None {
    return true;
  }

  unwrap(): never {
    throw new Error("Cannot unwrap None");
  }
}

export type Option<A> = Some<A> | None;

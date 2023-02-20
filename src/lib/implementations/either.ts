import { EitherTypeTag } from "../higher-kinded-types";
import { Functor2 } from "../type-classes/functor";
import { Monad2 } from "../type-classes/monad";

export class Right<R, L>
  implements
    Functor2<typeof EitherTypeTag, R, L>,
    Monad2<typeof EitherTypeTag, R, L>
{
  constructor(private readonly _value: R) {}

  static of<A>(a: A): Right<A, never> {
    return new Right(a);
  }

  map<B>(f: (a: R) => B): Right<B, L> {
    return new Right(f(this._value));
  }

  chain<A, B>(f: (a: R) => Either<A, B>): Either<A, B> {
    return f(this._value);
  }

  fold<B, C>(onRight: (a: R) => B, _onLeft: (e: L) => C): B | C {
    return onRight(this._value);
  }

  isRight(): this is Right<R, L> {
    return true;
  }

  isLeft(): this is never {
    return false;
  }

  unwrap(): R {
    return this._value;
  }
}

export class Left<R, L>
  implements
    Functor2<typeof EitherTypeTag, R, L>,
    Monad2<typeof EitherTypeTag, R, L>
{
  constructor(private readonly _value: L) {}

  static of<A>(a: A): Left<never, A> {
    return new Left(a);
  }

  map<B>(_f: (a: R) => B): Left<B, L> {
    return new Left(this._value);
  }

  chain<A, B>(_f: (a: R) => Either<A, B>): Either<A, L | B> {
    return new Left(this._value);
  }

  fold<B, C>(_onRight: (a: R) => B, onLeft: (b: L) => C): B | C {
    return onLeft(this._value);
  }

  isRight(): this is never {
    return false;
  }

  isLeft(): this is Left<R, L> {
    return true;
  }

  unwrap(): R {
    throw new Error("Cannot unwrap Left");
  }
}

export type Either<R, L> = Right<R, L> | Left<R, L>;

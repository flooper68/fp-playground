import { BoxTypeTag } from "../higher-kinded-types";
import { Functor1 } from "../type-classes/functor";
import { Monad1 } from "../type-classes/monad";

export class Box<A>
  implements Functor1<typeof BoxTypeTag, A>, Monad1<typeof BoxTypeTag, A>
{
  constructor(private readonly _value: A) {}

  map<B>(f: (a: A) => B): Box<B> {
    return new Box(f(this._value));
  }

  chain<B>(f: (a: A) => Box<B>): Box<B> {
    return f(this._value);
  }

  fold(): A {
    return this._value;
  }
}

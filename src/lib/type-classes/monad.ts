import {
  HigherKindedTypes1,
  HigherKindedTypes2,
  Kind1,
  Kind2,
} from "../higher-kinded-types";

export interface Monad1<F extends HigherKindedTypes1, A> {
  readonly chain: <B>(f: (a: A) => Kind1<F, B>) => Kind1<F, B>;
}

export interface Monad2<F extends HigherKindedTypes2, A, B> {
  readonly chain: <C>(f: (a: A) => Kind2<F, C, B>) => Kind2<F, C, B>;
}

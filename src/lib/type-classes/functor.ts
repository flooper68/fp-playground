import {
  HigherKindedTypes1,
  HigherKindedTypes2,
  Kind1,
  Kind2,
} from "../higher-kinded-types";

export interface Functor1<F extends HigherKindedTypes1, A> {
  readonly map: <B>(f: (a: A) => B) => Kind1<F, B>;
}

export interface Functor2<F extends HigherKindedTypes2, A, B> {
  readonly map: <C>(f: (a: A) => C) => Kind2<F, C, B>;
}

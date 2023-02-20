import { Box } from "./implementations/box";
import { Either } from "./implementations/either";
import { Option } from "./implementations/option";

export const BoxTypeTag = "Box";

export type BoxTypeTag = typeof BoxTypeTag;

export const OptionTypeTag = "Option";

export type OptionTypeTag = typeof OptionTypeTag;

export const EitherTypeTag = "Either";

export type EitherTypeTag = typeof EitherTypeTag;

export interface TypeTagtoKind1<A> {
  readonly [BoxTypeTag]: Box<A>;
  readonly [OptionTypeTag]: Option<A>;
}

export type HigherKindedTypes1 = keyof TypeTagtoKind1<unknown>;

export type Kind1<
  URI extends HigherKindedTypes1,
  A
> = URI extends HigherKindedTypes1 ? TypeTagtoKind1<A>[URI] : never;

export interface TypeTagtoKind2<A, B> {
  readonly [EitherTypeTag]: Either<A, B>;
}

export type HigherKindedTypes2 = keyof TypeTagtoKind2<unknown, unknown>;

export type Kind2<
  URI extends HigherKindedTypes2,
  A,
  B
> = URI extends HigherKindedTypes2 ? TypeTagtoKind2<A, B>[URI] : never;

import { Option } from "./implementations/option";
import { Result } from "./implementations/result";

export const OptionTypeTag = "Option";

export type OptionTypeTag = typeof OptionTypeTag;

export const ResultTypeTag = "Result";

export type ResultTypeTag = typeof ResultTypeTag;

export interface TypeTagtoKind1<A> {
  readonly [OptionTypeTag]: Option<A>;
}

export type HigherKindedTypes1 = keyof TypeTagtoKind1<unknown>;

export type Kind1<
  URI extends HigherKindedTypes1,
  A
> = URI extends HigherKindedTypes1 ? TypeTagtoKind1<A>[URI] : never;

export interface TypeTagtoKind2<A, B> {
  readonly [ResultTypeTag]: Result<A, B>;
}

export type HigherKindedTypes2 = keyof TypeTagtoKind2<unknown, unknown>;

export type Kind2<
  URI extends HigherKindedTypes2,
  A,
  B
> = URI extends HigherKindedTypes2 ? TypeTagtoKind2<A, B>[URI] : never;

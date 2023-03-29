import { RefinementCtx, SafeParseReturnType, ZodError, z } from "zod";

export enum ResultType {
  Ok = "Ok",
  Err = "Err",
}

export type PromisedResult<E, T> = Promise<Result<E, T>>;

export type SerializedResult<E, T> =
  | {
      type: ResultType.Ok;
      value: T;
    }
  | {
      type: ResultType.Err;
      error: E;
    };

class Ok<E, T> {
  readonly type = ResultType.Ok;

  constructor(private readonly _value: T) {}

  unwrap(): T {
    return this._value;
  }

  unwrapErr(): never {
    throw new Error("Cannot unwrap error from Ok");
  }

  map: <U>(f: (value: T) => U) => Result<E, U> = (f) => {
    return new Ok(f(this._value));
  };

  chain<A, B>(f: (value: T) => Result<A, B>): Result<E | A, B>;
  chain<A, B>(f: (value: T) => PromisedResult<A, B>): PromisedResult<E | A, B>;
  chain<A, B>(
    f: (value: T) => PromisedResult<A, B> | Result<A, B>
  ): PromisedResult<E | A, B> | Result<A, B> {
    return f(this._value);
  }

  mapErr: <U>(f: (error: E) => U) => Result<U, T> = (_f) => {
    return new Ok(this._value);
  };

  orElse<A, B>(f: (error: E) => Result<A, B>): Result<A, T | B>;
  orElse<A, B>(f: (error: E) => PromisedResult<A, B>): PromisedResult<A, T | B>;
  orElse<A, B>(
    _f: (error: E) => Result<A, B> | PromisedResult<A, B>
  ): Result<A, T | B> | PromisedResult<A, T | B> {
    return new Ok(this._value);
  }

  match<A, B>(onSuccess: (value: T) => A, _onError: (error: E) => B) {
    return onSuccess(this._value);
  }

  isErr(): this is never {
    return false;
  }

  isOk(): this is Ok<E, T> {
    return true;
  }

  serialize(): SerializedResult<E, T> {
    return {
      type: this.type,
      value: this._value,
    };
  }
}

class Err<E, T> {
  readonly type = ResultType.Err;

  constructor(private readonly _value: E) {}

  unwrap(): never {
    throw new Error("Cannot unwrap Err");
  }

  unwrapErr(): E {
    return this._value;
  }

  map: <U>(f: (value: T) => U) => Result<E, U> = (_f) => {
    return new Err(this._value);
  };

  chain<A, B>(f: (value: T) => Result<A, B>): Result<E | A, B>;
  chain<A, B>(f: (value: T) => PromisedResult<A, B>): PromisedResult<E | A, B>;
  chain<A, B>(
    _f: (value: T) => PromisedResult<A, B> | Result<A, B>
  ): PromisedResult<E | A, B> | Result<A, B> {
    return new Err(this._value) as unknown as
      | Result<A, B>
      | PromisedResult<E | A, B>;
  }

  mapErr: <U>(f: (error: E) => U) => Result<U, T> = (f) => {
    return new Err(f(this._value));
  };

  orElse<A, B>(f: (error: E) => Result<A, B>): Result<A, T | B>;
  orElse<A, B>(f: (error: E) => PromisedResult<A, B>): PromisedResult<A, T | B>;
  orElse<A, B>(
    f: (error: E) => PromisedResult<A, B> | Result<A, B>
  ): PromisedResult<A, T | B> | Result<A | T, B> {
    return f(this._value);
  }

  match<A, B>(_onSuccess: (value: T) => A, onError: (error: E) => B) {
    return onError(this._value);
  }

  isErr(): this is Err<E, T> {
    return true;
  }

  isOk(): this is never {
    return false;
  }

  serialize(): SerializedResult<E, T> {
    return {
      type: this.type,
      error: this._value,
    };
  }
}

export type Result<E, T> = Ok<E, T> | Err<E, T>;

export const ResultValidationErrorType = "ResultValidationError";

export class ResultValidationError<E> extends Error {
  readonly type = ResultValidationErrorType;
  constructor(public readonly errors: E[]) {
    super(
      `${errors
        .map((item) => {
          const message = (item as { message?: string })?.message;

          if (message != null) {
            return `${message}`;
          }

          return `Unknwon error.`;
        })
        .join(" ")}`
    );
  }
}

function isValidationError<E>(
  e: E | ResultValidationError<E>
): e is ResultValidationError<E> {
  return (
    typeof e === "object" &&
    e != null &&
    "type" in e &&
    e.type === ResultValidationErrorType
  );
}

function concatToValidationError<E, F>(
  errorOne: E | ResultValidationError<E>,
  errorTwo: F | ResultValidationError<F>
): ResultValidationError<E | F> {
  if (isValidationError(errorOne)) {
    if (isValidationError(errorTwo)) {
      return new ResultValidationError([
        ...errorOne.errors,
        ...errorTwo.errors,
      ]);
    } else {
      return new ResultValidationError([...errorOne.errors, errorTwo]);
    }
  } else {
    if (isValidationError(errorTwo)) {
      return new ResultValidationError([errorOne, ...errorTwo.errors]);
    } else {
      return new ResultValidationError([errorOne, errorTwo]);
    }
  }
}

type UnwrapValidationError<E> = E extends ResultValidationError<infer F>
  ? F
  : E;
type ResultRecord = Record<string, Result<unknown, unknown>>;
type OkRecord<R extends ResultRecord> = {
  [key in keyof R]: R[key] extends Result<unknown, infer T> ? T : never;
};
type ErrorsUnion<R extends ResultRecord> = {
  [key in keyof R]: R[key] extends Result<infer E, unknown>
    ? UnwrapValidationError<E>
    : never;
}[keyof R];

type ResultArray = Array<Result<unknown, unknown>>;
type OkArray<A extends ResultArray> = A extends Array<Result<unknown, infer O>>
  ? O[]
  : never;
type ErrArrayUnion<A extends ResultArray> = A extends Array<
  Result<infer E, unknown>
>
  ? UnwrapValidationError<E>
  : never;

type MergeTwoValidationErrors<E, F> = E extends ResultValidationError<infer E1>
  ? F extends ResultValidationError<infer F1>
    ? ResultValidationError<E1 | F1>
    : ResultValidationError<E1>
  : F extends ResultValidationError<infer F1>
  ? ResultValidationError<F1>
  : unknown;

export type MergeValidationErrors<
  E,
  F,
  G = unknown,
  H = unknown
> = MergeTwoValidationErrors<
  MergeTwoValidationErrors<MergeTwoValidationErrors<E, F>, G>,
  H
>;

export const Result = {
  Ok<T = void>(value?: T): Result<never, T> {
    return new Ok<never, T>(value ?? (undefined as T));
  },
  Err<E>(value: E): Result<E, never> {
    return new Err<E, never>(value);
  },
  fromNullable<E, T>(
    value: T | null | undefined,
    error: () => E
  ): Result<E, T> {
    if (value === null || value === undefined) {
      return new Err(error());
    }
    return new Ok(value);
  },
  fromZodSafeParse<A, B, C>(
    decode: () => SafeParseReturnType<A, B>,
    onError: (e: ZodError<A>) => C
  ): Result<C, B> {
    const result = decode();

    if (result.success) {
      return new Ok(result.data);
    } else {
      return new Err(onError(result.error));
    }
  },
  fromSerialized<E, T>(value: SerializedResult<E, T>): Result<E, T> {
    if (value.type === "Ok") {
      return new Ok(value.value);
    } else {
      return new Err(value.error);
    }
  },
  toZodTransform<A, B>(type: (arg: A) => Result<unknown, B>) {
    return (arg: A, ctx: RefinementCtx) => {
      const result = type(arg);

      return result.match(
        (value) => {
          return value;
        },
        (e) => {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              (e as { message?: string }).message ??
              "Type transformation failed.",
          });
          return z.NEVER;
        }
      );
    };
  },
  tryCatch<E, A>(f: () => A, onError: (e: unknown) => E): Result<E, A> {
    try {
      const value = f();
      return Result.Ok(value);
    } catch (e) {
      return Result.Err(onError(e));
    }
  },
  async tryCatchAsync<E, A>(
    f: () => Promise<A>,
    onError: (e: unknown) => E
  ): PromisedResult<E, A> {
    try {
      const value = await f();
      return Result.Ok(value);
    } catch (e) {
      return Result.Err(onError(e));
    }
  },
  ap<A, B, C, D>(F: Result<A, (b: B) => C>, b: Result<D, B>): Result<A | D, C> {
    return F.chain((f) => b.map(f));
  },
  apValidation<A, B, C, D>(
    F: Result<A, (b: B) => C>,
    b: Result<D, B>
  ): Result<ResultValidationError<A | D>, C> {
    return F.match(
      (f) => {
        return b.match(
          (b) => {
            return Result.Ok(f(b));
          },
          (be) => {
            return Result.Err(new ResultValidationError([be]));
          }
        );
      },
      (Fe) => {
        return b.match(
          () => {
            return Result.Err(new ResultValidationError([Fe]));
          },
          (eb) => {
            return Result.Err(concatToValidationError(Fe, eb));
          }
        );
      }
    );
  },
  sequenceArray<R extends Array<Result<unknown, unknown>>>(
    array: R
  ): Result<ErrArrayUnion<R>, OkArray<R>> {
    const initial = Result.Ok([]) as Result<unknown, unknown[]>;

    return array.reduce<Result<unknown, unknown[]>>((acc, item) => {
      const appendKey = acc.map((value) => (x: unknown) => [...value, x]);

      return Result.ap(appendKey, item);
    }, initial) as unknown as Result<ErrArrayUnion<R>, OkArray<R>>;
  },
  sequenceArrayValidation<R extends Array<Result<unknown, unknown>>>(
    array: R
  ): Result<ResultValidationError<ErrArrayUnion<R>>, OkArray<R>> {
    const initial = Result.Ok([]) as Result<unknown, unknown[]>;

    return array.reduce<Result<unknown, unknown[]>>((acc, item) => {
      const appendKey = acc.map((value) => (x: unknown) => [...value, x]);

      return Result.apValidation(appendKey, item);
    }, initial) as unknown as Result<
      ResultValidationError<ErrArrayUnion<R>>,
      OkArray<R>
    >;
  },
  sequenceRecord<R extends ResultRecord>(
    record: R
  ): Result<ErrorsUnion<R>, OkRecord<R>> {
    let acc = Result.Ok({} as unknown as Record<keyof R, unknown>) as Result<
      unknown,
      Record<keyof R, unknown>
    >;

    for (const [key, item] of Object.entries(record)) {
      const appendKey = acc.map((value) => (x: unknown) => ({
        ...value,
        [key]: x,
      }));

      acc = Result.ap(appendKey, item);
    }

    return acc as Result<ErrorsUnion<R>, OkRecord<R>>;
  },
  sequenceRecordValidation<R extends ResultRecord>(
    record: R
  ): Result<ResultValidationError<ErrorsUnion<R>>, OkRecord<R>> {
    let acc = Result.Ok({} as unknown as Record<keyof R, unknown>) as Result<
      ResultValidationError<unknown>,
      Record<keyof R, unknown>
    >;

    for (const [key, item] of Object.entries(record)) {
      const appendKey = acc.map((value) => (x: unknown) => ({
        ...value,
        [key]: x,
      }));

      acc = Result.apValidation(appendKey, item);
    }

    return acc as Result<ResultValidationError<ErrorsUnion<R>>, OkRecord<R>>;
  },
};

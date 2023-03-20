import { Option } from "./option";

export enum ResultType {
  Ok = "Ok",
  Err = "Err",
}

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

  chain: <A, B>(f: (value: T) => Result<A, B>) => Result<E | A, B> = (f) => {
    return f(this._value);
  };

  chainAsync: <A, B>(
    f: (value: T) => Promise<Result<A, B>>
  ) => Promise<Result<E | A, B>> = async (f) => {
    return f(this._value);
  };

  orElse: <A, B>(f: (error: E) => Result<A, B>) => Result<A, T | B> = (f) => {
    return new Ok(this._value);
  };

  orElseAsync: <A, B>(
    f: (error: E) => Promise<Result<A, B>>
  ) => Promise<Result<A, T | B>> = async (f) => {
    return new Ok(this._value);
  };

  match<A, B>(onSuccess: (value: T) => A, _onError: (error: E) => B) {
    return onSuccess(this._value);
  }

  isErr(): this is never {
    return false;
  }

  isOk(): this is Ok<E, T> {
    return true;
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

  map: <U>(f: (value: T) => U) => Result<E, U> = (f) => {
    return new Err(this._value);
  };

  chain: <A, B>(f: (value: T) => Result<A, B>) => Result<E | A, B> = (f) => {
    return new Err(this._value);
  };

  chainAsync: <A, B>(
    f: (value: T) => Promise<Result<A, B>>
  ) => Promise<Result<E | A, B>> = async (f) => {
    return new Err(this._value);
  };

  orElse: <A, B>(f: (error: E) => Result<A, B>) => Result<A, T | B> = (f) => {
    return f(this._value);
  };

  orElseAsync = async <A, B>(
    f: (error: E) => Promise<Result<A, B>>
  ): Promise<Result<A, T | B>> => {
    return f(this._value);
  };

  match<A, B>(_onSuccess: (value: T) => A, onError: (error: E) => B) {
    return onError(this._value);
  }

  isErr(): this is Err<E, T> {
    return true;
  }

  isOk(): this is never {
    return false;
  }
}

export type Result<E, T> = Ok<E, T> | Err<E, T>;

export const ValidationErrorType = "ValidationError";

export interface ValidationError<E> {
  readonly type: typeof ValidationErrorType;
  readonly errors: E[];
}

function isValidationError<E>(
  e: E | ValidationError<E>
): e is ValidationError<E> {
  return (
    typeof e === "object" &&
    e != null &&
    "type" in e &&
    e.type === ValidationErrorType
  );
}

function concatToValidationError<E, F>(
  errorOne: E | ValidationError<E>,
  errorTwo: F | ValidationError<F>,
  ValidationError: <E>(error: E[]) => ValidationError<E>
): ValidationError<E | F> {
  if (isValidationError(errorOne)) {
    if (isValidationError(errorTwo)) {
      return ValidationError([...errorOne.errors, ...errorTwo.errors]);
    } else {
      return ValidationError([...errorOne.errors, errorTwo]);
    }
  } else {
    if (isValidationError(errorTwo)) {
      return ValidationError([errorOne, ...errorTwo.errors]);
    } else {
      return ValidationError([errorOne, errorTwo]);
    }
  }
}

type ResultRecord = Record<string, Result<unknown, unknown>>;
type OkRecord<R extends ResultRecord> = {
  [key in keyof R]: R[key] extends Result<unknown, infer T> ? T : never;
};
type ErrorsUnion<R extends ResultRecord> = {
  [key in keyof R]: R[key] extends Result<infer E, unknown> ? E : never;
}[keyof R];

export const Result = {
  of<T>(value: T): Result<never, T> {
    return new Ok<never, T>(value);
  },
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
  fromOption<E, T>(value: Option<T>, error: () => E): Result<E, T> {
    return value.match(
      (value) => new Ok(value),
      () => new Err(error())
    );
  },
  tryCatch<E, A>(f: () => A, onError: (e: unknown) => E): Result<E, A> {
    try {
      return Result.Ok(f());
    } catch (e) {
      return Result.Err(onError(e));
    }
  },
  async asyncTryCatch<E, A>(
    f: () => Promise<A>,
    onError: (e: unknown) => E
  ): Promise<Result<E, A>> {
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
    b: Result<D, B>,
    ValidationError: <E>(error: E[]) => ValidationError<E>
  ): Result<ValidationError<A | D>, C> {
    return F.match(
      (f) => {
        return b.match(
          (b) => {
            return Result.Ok(f(b));
          },
          (be) => {
            return Result.Err(ValidationError([be]));
          }
        );
      },
      (Fe) => {
        return b.match(
          () => {
            return Result.Err(ValidationError([Fe]));
          },
          (eb) => {
            return Result.Err(concatToValidationError(Fe, eb, ValidationError));
          }
        );
      }
    );
  },
  sequenceRecord<R extends ResultRecord>(
    record: R
  ): Result<ErrorsUnion<R>, OkRecord<R>> {
    let acc = Result.of({} as Record<keyof R, unknown>) as Result<
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
    record: R,
    ValidationError: <E>(error: E[]) => ValidationError<E>
  ): Result<ValidationError<ErrorsUnion<R>>, OkRecord<R>> {
    let acc = Result.of({} as Record<keyof R, unknown>) as Result<
      ValidationError<unknown>,
      Record<keyof R, unknown>
    >;

    for (const [key, item] of Object.entries(record)) {
      const appendKey = acc.map((value) => (x: unknown) => ({
        ...value,
        [key]: x,
      }));

      acc = Result.apValidation(appendKey, item, ValidationError);
    }

    return acc as Result<ValidationError<ErrorsUnion<R>>, OkRecord<R>>;
  },
};

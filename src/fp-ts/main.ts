import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/Option";
import * as T from "fp-ts/Task";
import * as TE from "fp-ts/TaskEither";
import { match } from "ts-pattern";
import { Branded, Opaque } from "../lib/opaque";

enum ApplicationStatus {
  New = "new",
  Activated = "activated",
  Deleted = "deleted",
}

type Uuid = Opaque<string, "Uuid">;

function Uuid(uuid: string): E.Either<never, Uuid> {
  return E.right(uuid as Uuid);
}

type ApplicationName = Opaque<string, "ApplicationName">;

class ApplicationNameTooShort extends Branded<"ApplicationNameTooShort"> {
  readonly message = "Application name is too short";
}

class ApplicationNameTooLong extends Branded<"ApplicationNameTooLong"> {
  readonly message = "Application name is too long";
}

function ApplicationName(
  name: string
): E.Either<ApplicationNameTooShort | ApplicationNameTooLong, ApplicationName> {
  if (name.length < 3) {
    return E.left(new ApplicationNameTooShort());
  }

  if (name.length > 20) {
    return E.left(new ApplicationNameTooLong());
  }

  return E.right(name as ApplicationName);
}

type Token = Opaque<string, "Token">;

export class InsecureToken extends Branded<"InsecureToken"> {
  readonly message = "Token is too short";
}

function Token(token: string) {
  if (token.length < 10) {
    return E.left(new InsecureToken());
  }

  return E.right(token as Token);
}

interface NewApplication {
  uuid: Uuid;
  status: ApplicationStatus.New;
  name: ApplicationName;
}

interface ActivatedApplication {
  uuid: Uuid;
  status: ApplicationStatus.Activated;
  name: ApplicationName;
  token: Token;
}

interface DeletedApplication {
  uuid: Uuid;
  status: ApplicationStatus.Deleted;
  name: ApplicationName;
  token: O.Option<Token>;
}

type Application = NewApplication | ActivatedApplication | DeletedApplication;

export const activateApplication =
  (token: Token) =>
  (application: NewApplication): ActivatedApplication => {
    return {
      ...application,
      status: ApplicationStatus.Activated,
      token,
    };
  };

// Helpers to actually make fp-ts handle union types well
function sequenceTuple<R1, L1, R2, L2>(
  a: E.Either<L1, R1>,
  b: E.Either<L2, R2>
): E.Either<L1 | L2, readonly [R1, R2]> {
  const map = (c: R1) => (d: R2) => [c, d] as const;
  return pipe(E.of(map), E.apW(a), E.apW(b));
}

function sequenceTuple3<R1, L1, R2, L2, R3, L3>(
  a: E.Either<L1, R1>,
  b: E.Either<L2, R2>,
  c: E.Either<L3, R3>
): E.Either<L1 | L2 | L3, readonly [R1, R2, R3]> {
  const map = (c: R1) => (d: R2) => (e: R3) => [c, d, e] as const;
  return pipe(E.of(map), E.apW(a), E.apW(b), E.apW(c));
}

interface StoredApplication {
  uuid: string;
  status: ApplicationStatus;
  name: string;
  token: string | null;
}

type ApplicationMappingError =
  | ApplicationNameTooShort
  | ApplicationNameTooLong
  | InsecureToken
  | TokenMissing;

const mapNewApplication = (stored: StoredApplication) => {
  return pipe(
    sequenceTuple(Uuid(stored.uuid), ApplicationName(stored.name)),
    E.map(([uuid, name]) => {
      return {
        uuid: uuid,
        status: ApplicationStatus.New as const,
        name: name,
      };
    })
  );
};

class TokenMissing extends Branded<"TokenMissing"> {
  readonly message = "Token is missing in database.";
}

const mapActivatedApplication = (stored: StoredApplication) => {
  return pipe(
    sequenceTuple3(
      Uuid(stored.uuid),
      ApplicationName(stored.name),
      pipe(stored.token, E.fromNullable(new TokenMissing()), E.chainW(Token))
    ),
    E.map(([uuid, name, token]) => {
      return {
        uuid,
        status: ApplicationStatus.Activated as const,
        name,
        token,
      };
    })
  );
};

const mapDeletedApplication = (
  stored: StoredApplication
): E.Either<
  | ApplicationNameTooShort
  | ApplicationNameTooLong
  | InsecureToken
  | TokenMissing,
  DeletedApplication
> => {
  const token = pipe(
    stored.token,
    O.fromNullable,
    O.match(
      () => E.right(O.none),
      (x) => pipe(Token(x), E.map(O.some))
    )
  );

  return pipe(
    sequenceTuple3(Uuid(stored.uuid), ApplicationName(stored.name), token),
    E.map(([uuid, name, token]) => {
      return {
        uuid,
        status: ApplicationStatus.Deleted as const,
        name,
        token,
      };
    })
  );
};

const mapStoredApplication = (
  storedApplication: StoredApplication
): E.Either<ApplicationMappingError, Application> => {
  return match(storedApplication)
    .with({ status: ApplicationStatus.New }, (item) => {
      return mapNewApplication(item);
    })
    .with({ status: ApplicationStatus.Activated }, (item) => {
      return mapActivatedApplication(item);
    })
    .with({ status: ApplicationStatus.Deleted }, (item) => {
      return mapDeletedApplication(item);
    })
    .exhaustive();
};

class ApplicationNotFound extends Branded<"ApplicationNotFound"> {
  readonly message = "Application not found";
}

const data = new Map<string, StoredApplication>();

const findApplication = (uuid: Uuid): T.Task<O.Option<StoredApplication>> => {
  return pipe(O.fromNullable(data.get(uuid)), T.of, T.delay(200));
};

type GetApplicationErrors = ApplicationNotFound | ApplicationMappingError;

const getApplication = (
  uuid: Uuid
): TE.TaskEither<GetApplicationErrors, Application> => {
  return pipe(
    uuid,
    findApplication,
    TE.fromTask,
    TE.chainW((x) => {
      return pipe(
        x,
        E.fromOption(() => new ApplicationNotFound()),
        E.chainW(mapStoredApplication),
        TE.fromEither
      );
    })
  );
};

class ApplicationCouldNotBeSaved extends Branded<"ApplicationCouldNotBeSaved"> {
  readonly message = "Application could not be saved";
}

const saveApplication = (
  application: Application
): TE.TaskEither<ApplicationCouldNotBeSaved, void> => {
  match(application)
    .with({ status: ApplicationStatus.New }, (item) => {
      data.set(item.uuid, {
        uuid: item.uuid,
        name: item.name,
        status: item.status,
        token: null,
      });
    })
    .with({ status: ApplicationStatus.Activated }, (item) => {
      data.set(item.uuid, {
        uuid: item.uuid,
        name: item.name,
        status: item.status,
        token: item.token,
      });
    })
    .with({ status: ApplicationStatus.Deleted }, (item) => {
      data.set(item.uuid, {
        uuid: item.uuid,
        name: item.name,
        status: item.status,
        token: O.toNullable(item.token),
      });
    });

  return pipe(T.of(undefined), T.delay(200), TE.fromTask);
};

class ApplicationInWrongState extends Branded<"ApplicationInWrongState"> {
  readonly message = "Application is in wrong state";
}

type ActivateApplicationErrors =
  | ApplicationInWrongState
  | GetApplicationErrors
  | ApplicationCouldNotBeSaved;

const activateApplicationHandler = (props: {
  uuid: Uuid;
  token: Token;
}): TE.TaskEither<ActivateApplicationErrors, void> => {
  return pipe(
    props.uuid,
    getApplication,
    TE.chainW((application) => {
      return match(application)
        .with(
          {
            status: ApplicationStatus.New,
          },
          (item) => {
            return pipe(
              item,
              activateApplication(props.token),
              E.right,
              TE.fromEither
            );
          }
        )
        .otherwise(() => {
          return pipe(new ApplicationInWrongState(), E.left, TE.fromEither);
        });
    }),
    TE.chainW(saveApplication)
  );
};

const activateController = (props: { uuid: string; token: string }) => {
  return pipe(
    sequenceTuple(Uuid(props.uuid), Token(props.token)),
    TE.fromEither,
    TE.chain(([uuid, token]) => {
      return activateApplicationHandler({
        uuid,
        token,
      });
    }),
    TE.fold(
      (e) => {
        return match(e)
          .with(
            {
              message: "Application is in wrong state",
            },
            (_) => {
              return T.of({
                status: 400,
                message: "Application is in wrong state",
              });
            }
          )
          .with({ message: "Application not found" }, (_) => {
            return T.of({
              status: 404,
              message: "Application not found",
            });
          })
          .otherwise((_) => {
            return T.of({
              status: 500,
              message: "Internal server error",
            });
          });
      },
      (_) => {
        return T.of({
          status: 200,
        });
      }
    )
  );
};

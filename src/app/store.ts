import { writeFile, readFile, access } from "node:fs/promises";
import { z } from "zod";
import { Option } from "../lib/implementations/option";
import { Result } from "../lib/implementations/result";

export interface StoredTodo {
  uuid: string;
  title: string;
  description: string;
  note: string | null;
  done: boolean;
}

interface FileContent {
  todos: Map<string, StoredTodo>;
}

const FileDecoder = z.object({
  todos: z.record(
    z.object({
      uuid: z.string(),
      title: z.string(),
      description: z.string(),
      note: z.string().nullable(),
      done: z.boolean(),
    })
  ),
});

function parseFileContent(data: string): Result<
  ErrorParsingDataError,
  {
    todos: Map<string, StoredTodo>;
  }
> {
  return Result.tryCatch(
    () => FileDecoder.parse(JSON.parse(data)),
    (e) => new ErrorParsingDataError(e)
  ).map((parsed) => {
    return {
      todos: new Map(Object.entries(parsed.todos)),
    };
  });
}

export enum TodoStoreErrorType {
  ErrorSavingData = "ErrorSavingData",
  ErrorReadingData = "ErrorReadingData",
  ErrorParsingData = "ErrorParsingData",
  DeletedTodoNotFound = "DeletedTodoNotFound",
  FileCouldNotBeCreated = "FileCouldNotBeCreated",
}

export class ErrorSavingDataError {
  readonly type = TodoStoreErrorType.ErrorSavingData;
  constructor(public readonly error: unknown) {}
}

export class ErrorReadingDataError {
  readonly type = TodoStoreErrorType.ErrorReadingData;
  constructor(public readonly error: unknown) {}
}

export class ErrorParsingDataError {
  readonly type = TodoStoreErrorType.ErrorParsingData;
  constructor(public readonly error: unknown) {}
}

export class DeletedTodoNotFoundError {
  readonly type = TodoStoreErrorType.DeletedTodoNotFound;
  constructor(public readonly uuid: string) {}
}

export class FileCouldNotBeCreatedError {
  readonly type = TodoStoreErrorType.FileCouldNotBeCreated;
  constructor(public readonly error: unknown) {}
}

export type StoreReadErrors =
  | ErrorReadingDataError
  | ErrorParsingDataError
  | FileCouldNotBeCreatedError;

export type StoreReadWriteErrors = StoreReadErrors | ErrorSavingDataError;

export type TodoStoreError = StoreReadWriteErrors | DeletedTodoNotFoundError;

export interface TodoStore {
  get(uuid: string): Promise<Result<StoreReadWriteErrors, Option<StoredTodo>>>;
  set(
    uuid: string,
    todo: StoredTodo
  ): Promise<Result<StoreReadWriteErrors, void>>;
  delete(uuid: string): Promise<Result<TodoStoreError, void>>;
  getAll(): Promise<Result<StoreReadWriteErrors, StoredTodo[]>>;
}

export function TodoMemoryStore(): TodoStore {
  const store = new Map<string, StoredTodo>();

  return {
    async get(uuid) {
      return Result.Ok(Option.fromNullable(store.get(uuid)));
    },
    async set(uuid, todo) {
      store.set(uuid, todo);
      return Result.Ok();
    },
    async delete(uuid) {
      if (!store.has(uuid)) {
        return Result.Err(new DeletedTodoNotFoundError(uuid));
      }
      store.delete(uuid);
      return Result.Ok();
    },
    async getAll() {
      return Result.Ok(Array.from(store.values()));
    },
  };
}

export function TodoFileStore(context: {
  config: {
    dataFile: string;
  };
}): TodoStore {
  const { config } = context;

  const getFileContent = async () => {
    const existCheck = await Result.asyncTryCatch(
      () => access(config.dataFile),
      (e) => new ErrorReadingDataError(e)
    );

    const fileExists = await existCheck.orElseAsync(
      async (e): Promise<Result<StoreReadWriteErrors, void>> => {
        if (
          e.error instanceof Error &&
          "code" in e.error &&
          e.error.code === "ENOENT"
        ) {
          return saveFile({ todos: new Map() });
        }

        return Result.Err(new FileCouldNotBeCreatedError(e.error));
      }
    );

    const fileContent = await fileExists.chainAsync(async () => {
      return Result.asyncTryCatch(
        () => readFile(config.dataFile, "utf-8"),
        (e) => new ErrorReadingDataError(e)
      );
    });

    return fileContent.chain(parseFileContent);
  };

  const saveFile = async (data: FileContent) => {
    return Result.asyncTryCatch(
      () =>
        writeFile(
          config.dataFile,
          JSON.stringify({
            todos: Object.fromEntries(data.todos.entries()),
          })
        ),
      (e) => new ErrorSavingDataError(e)
    );
  };

  return {
    async get(uuid) {
      const fileContent = await getFileContent();

      return fileContent.map((v) => {
        return Option.fromNullable(v.todos.get(uuid));
      });
    },
    async set(uuid, todo) {
      const fileContent = await getFileContent();

      return fileContent.match(
        async (data) => {
          data.todos.set(uuid, todo);
          return saveFile(data);
        },
        async (e) => Result.Err(e)
      );
    },
    async delete(uuid: string) {
      const fileContent = await getFileContent();

      return fileContent.chainAsync(
        async (ok): Promise<Result<TodoStoreError, void>> => {
          if (!ok.todos.has(uuid)) {
            return Result.Err(new DeletedTodoNotFoundError(uuid));
          }
          ok.todos.delete(uuid);
          return saveFile(ok);
        }
      );
    },
    async getAll() {
      const fileContent = await getFileContent();

      return fileContent.map((v) => Array.from(v.todos.values()));
    },
  };
}

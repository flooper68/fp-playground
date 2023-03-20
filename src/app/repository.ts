import { match } from "ts-pattern";
import { Result, ValidationErrorType } from "../lib/implementations/result";
import {
  StoredTodo,
  StoreReadWriteErrors,
  TodoStore,
  TodoStoreError,
} from "./store";
import {
  FinishedTodo,
  Todo,
  TodoDescription,
  TodoDomainError,
  TodoFinishNote,
  TodoTitle,
  TodoUuid,
  UnfinishedTodo,
} from "./todo-domain";

export enum TodoMappingErrorType {
  NoteIsMissing = "NoteIsMissing",
}

export class NoteIsMissingError {
  readonly type = TodoMappingErrorType.NoteIsMissing;
  constructor(public readonly uuid: string) {}
}

export class TodoValidationError<E> {
  readonly type = ValidationErrorType;
  constructor(public readonly errors: E[]) {}
}

export type TodoMappingError = TodoValidationError<
  NoteIsMissingError | TodoDomainError
>;

function mapFinishedTodo(
  storedTodo: StoredTodo
): Result<TodoMappingError, FinishedTodo> {
  return Result.sequenceRecordValidation(
    {
      done: Result.Ok(true as const),
      uuid: TodoUuid(storedTodo.uuid),
      title: TodoTitle(storedTodo.title),
      description: TodoDescription(storedTodo.description),
      note: Result.fromNullable(
        storedTodo.note,
        () => new NoteIsMissingError(storedTodo.uuid)
      ).chain((note) => TodoFinishNote(note)),
    },
    (e) => new TodoValidationError(e)
  );
}

function mapUnfinishedTodo(
  storedTodo: StoredTodo
): Result<TodoMappingError, UnfinishedTodo> {
  return Result.sequenceRecordValidation(
    {
      done: Result.Ok(false as const),
      uuid: TodoUuid(storedTodo.uuid),
      title: TodoTitle(storedTodo.title),
      description: TodoDescription(storedTodo.description),
    },
    (e) => new TodoValidationError(e)
  );
}

const mapTodo = (
  storedTodo: StoredTodo
): Result<TodoMappingError, FinishedTodo | UnfinishedTodo> => {
  return match(storedTodo.done)
    .with(true, () => mapFinishedTodo(storedTodo))
    .with(false, () => mapUnfinishedTodo(storedTodo))
    .exhaustive();
};

export enum TodoRepositoryErrorType {
  NotFound = "NotFound",
}

export class TodoNotFoundError {
  readonly type = TodoRepositoryErrorType.NotFound;
  constructor(public readonly uuid: string) {}
}

export type TodoRepositoryError =
  | TodoNotFoundError
  | TodoMappingError
  | StoreReadWriteErrors;

export function TodoRepository(context: { store: TodoStore }) {
  const { store } = context;

  return {
    async getTodo(uuid: TodoUuid): Promise<Result<TodoRepositoryError, Todo>> {
      const todo = await store.get(uuid);

      return todo
        .chain((value) =>
          Result.fromOption(value, () => new TodoNotFoundError(uuid))
        )
        .chain(mapTodo);
    },
    saveTodo(todo: Todo): Promise<Result<StoreReadWriteErrors, void>> {
      return match(todo)
        .with({ done: true }, async (finished) => {
          return await store.set(todo.uuid, {
            uuid: finished.uuid,
            title: finished.title,
            description: finished.description,
            note: finished.note,
            done: finished.done,
          });
        })
        .with({ done: false }, async (unfinished) => {
          return await store.set(todo.uuid, {
            uuid: unfinished.uuid,
            title: unfinished.title,
            description: unfinished.description,
            note: null,
            done: unfinished.done,
          });
        })
        .exhaustive();
    },
    deleteTodo(
      uuid: TodoUuid
    ): Promise<Result<TodoNotFoundError | TodoStoreError, void>> {
      return Result.fromNullable(
        store.get(uuid),
        () => new TodoNotFoundError(uuid)
      ).chainAsync(async () => {
        await store.delete(uuid);
        return Result.Ok();
      });
    },
  };
}

export type TodoRepository = ReturnType<typeof TodoRepository>;

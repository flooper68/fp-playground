import { match } from "ts-pattern";
import { Result } from "../lib/implementations/result";
import { TodoRepository, TodoRepositoryError } from "./repository";
import { StoreReadWriteErrors } from "./store";
import {
  createTodo,
  editDescription,
  editTitle,
  finishTodo,
  isTodoUnfinished,
  TodoDescription,
  TodoFinishNote,
  TodoTitle,
  TodoUuid,
} from "./todo-domain";

export enum TodoCommandErrorType {
  TodoNotInUnfinishedState = "TodoNotInUnfinishedState",
}

export class TodoNotInUnfinishedState {
  readonly type = TodoCommandErrorType.TodoNotInUnfinishedState;
  constructor(public readonly uuid: string) {}
}

export type TodoCommandError = TodoNotInUnfinishedState | TodoRepositoryError;

type TodoCommandResult = Promise<
  Result<
    StoreReadWriteErrors | TodoNotInUnfinishedState | TodoRepositoryError,
    void
  >
>;

export function TodoCommandHandlers(context: { repository: TodoRepository }) {
  const { repository } = context;

  return {
    async createTodo(props: {
      uuid: TodoUuid;
      title: TodoTitle;
      description: TodoDescription;
    }): Promise<Result<StoreReadWriteErrors, void>> {
      const todo = createTodo(props);
      return repository.saveTodo(todo);
    },
    async editTitle(props: {
      uuid: TodoUuid;
      title: TodoTitle;
    }): TodoCommandResult {
      const todo = await repository.getTodo(props.uuid);

      return todo.chainAsync(async (ok): TodoCommandResult => {
        return match(ok)
          .when(isTodoUnfinished, async (unfinished) => {
            const updated = editTitle(props.title, unfinished);

            return repository.saveTodo(updated);
          })
          .otherwise(async () => {
            return Result.Err(new TodoNotInUnfinishedState(ok.uuid));
          });
      });
    },
    async editDescription(props: {
      uuid: TodoUuid;
      description: TodoDescription;
    }): TodoCommandResult {
      const todo = await repository.getTodo(props.uuid);

      return todo.chainAsync(async (ok): TodoCommandResult => {
        return match(ok)
          .when(isTodoUnfinished, async (unfinished) => {
            const updated = editDescription(props.description, unfinished);

            return repository.saveTodo(updated);
          })
          .otherwise(async () => {
            return Result.Err(new TodoNotInUnfinishedState(ok.uuid));
          });
      });
    },
    async finishTodo(props: {
      uuid: TodoUuid;
      note: TodoFinishNote;
    }): TodoCommandResult {
      const result = await repository.getTodo(props.uuid);

      return result.chainAsync((ok): TodoCommandResult => {
        return match(ok)
          .when(isTodoUnfinished, async (unfinished) => {
            const updated = finishTodo(props.note, unfinished);

            return repository.saveTodo(updated);
          })
          .otherwise(async () => {
            return Result.Err(new TodoNotInUnfinishedState(ok.uuid));
          });
      });
    },
  };
}

export type TodoCommandHandlers = ReturnType<typeof TodoCommandHandlers>;

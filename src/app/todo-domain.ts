import { Result } from "../lib/implementations/result";
import { Opaque } from "../lib/opaque";

export enum TodoDomainErrorType {
  TitleEmpty = "TitleEmpty",
  TitleTooLong = "TitleTooLong",
  DescriptionTooLong = "DescriptionTooLong",
  FinishNoteTooLong = "FinishNoteTooLong",
}

export type TodoUuid = Opaque<"TodoUuid", string>;

export const TodoUuid = (uuid: string): Result<never, TodoUuid> => {
  return Result.of(uuid as TodoUuid);
};

export type TodoTitle = Opaque<"TodoTitle", string>;

export class TitleEmpty {
  readonly type = TodoDomainErrorType.TitleEmpty;
  readonly message = "Title cannot be empty";
  constructor(public readonly title: string) {}
}

export class TitleTooLong {
  readonly type = TodoDomainErrorType.TitleTooLong;
  readonly message = "Title cannot not be longer than 20 characters";
  constructor(public readonly title: string) {}
}

export type TitleErrors = TitleEmpty | TitleTooLong;

export const TodoTitle = (title: string): Result<TitleErrors, TodoTitle> => {
  if (title.length === 0) {
    return Result.Err(new TitleEmpty(title));
  }

  if (title.length > 20) {
    return Result.Err(new TitleTooLong(title));
  }

  return Result.of(title as TodoTitle);
};

export class DescriptionTooLong {
  readonly type = TodoDomainErrorType.DescriptionTooLong;
  readonly message = "Description cannot not be longer than 100 characters";
  constructor(public readonly description: string) {}
}

export type TodoDescription = Opaque<"TodoDescription", string>;

export const TodoDescription = (
  description: string
): Result<DescriptionTooLong, TodoDescription> => {
  if (description.length > 100) {
    return Result.Err(new DescriptionTooLong(description));
  }

  return Result.of(description as TodoDescription);
};

export class FinishNoteTooLong {
  readonly type = TodoDomainErrorType.FinishNoteTooLong;
  readonly message = "FinishNote cannot not be longer than 1000 characters";
  constructor(public readonly FinishNote: string) {}
}

export type TodoFinishNote = Opaque<"TodoFinishNote", string>;

export const TodoFinishNote = (
  note: string
): Result<FinishNoteTooLong, TodoFinishNote> => {
  if (note.length > 1000) {
    return Result.Err(new FinishNoteTooLong(note));
  }

  return Result.of(note as TodoFinishNote);
};

export type TodoDomainError =
  | TitleErrors
  | DescriptionTooLong
  | FinishNoteTooLong;

export type UnfinishedTodo = {
  uuid: TodoUuid;
  title: TodoTitle;
  description: TodoDescription;
  done: false;
};

export function isTodoUnfinished(todo: Todo): todo is UnfinishedTodo {
  return !todo.done;
}

export type FinishedTodo = {
  uuid: TodoUuid;
  title: TodoTitle;
  description: TodoDescription;
  note: TodoFinishNote;
  done: true;
};

export function isTodoFinished(todo: Todo): todo is FinishedTodo {
  return todo.done;
}

export type Todo = UnfinishedTodo | FinishedTodo;

export const createTodo = (props: {
  uuid: TodoUuid;
  title: TodoTitle;
  description: TodoDescription;
}): UnfinishedTodo => {
  return {
    uuid: props.uuid,
    title: props.title,
    description: props.description,
    done: false,
  };
};

export const editTitle = (title: TodoTitle, todo: UnfinishedTodo): Todo => {
  return {
    ...todo,
    title,
  };
};

export const editDescription = (
  description: TodoDescription,
  todo: UnfinishedTodo
) => {
  return {
    ...todo,
    description,
  };
};

export const finishTodo = (
  note: TodoFinishNote,
  todo: UnfinishedTodo
): FinishedTodo => {
  return {
    uuid: todo.uuid,
    title: todo.title,
    description: todo.description,
    note,
    done: true,
  };
};

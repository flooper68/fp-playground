import { Option } from "../lib/implementations/option";
import { Result } from "../lib/implementations/result";
import { StoreReadWriteErrors, TodoStore } from "./store";
import { TodoUuid } from "./todo-domain";

interface TodoDetail {
  uuid: string;
  title: string;
  description: string;
  note: Option<string>;
  done: boolean;
}

interface TodoListItem {
  uuid: string;
  title: string;
}

export function TodoQueryHandlers(context: { store: TodoStore }) {
  const { store } = context;

  return {
    async getList(): Promise<Result<StoreReadWriteErrors, TodoListItem[]>> {
      const values = await store.getAll();

      return values.map((items) => {
        return items.map((x) => {
          return {
            uuid: x.uuid,
            title: x.title,
          };
        });
      });
    },
    async getDetail(
      uuid: TodoUuid
    ): Promise<Result<StoreReadWriteErrors, Option<TodoDetail>>> {
      const todo = await store.get(uuid);

      return todo.map((data) => {
        return data.map((some) => {
          return {
            uuid: some.uuid,
            title: some.title,
            description: some.description,
            note: Option.fromNullable(some.note),
            done: some.done,
          };
        });
      });
    },
  };
}

export type TodoQueryHandlers = ReturnType<typeof TodoQueryHandlers>;

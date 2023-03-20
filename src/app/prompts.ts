import prompts from "prompts";
import { match } from "ts-pattern";
import {
  TodoDescription,
  TodoDomainErrorType,
  TodoFinishNote,
  TodoTitle,
  TodoUuid,
} from "./todo-domain";

export const promptForTodoUuid = async (): Promise<TodoUuid> => {
  const result = await prompts({
    type: "text",
    name: "value",
    message: "Enter Todo Uuid",
  });

  return TodoUuid(result.value).match(
    async (title) => {
      return title;
    },
    async (error) => {
      return error;
    }
  );
};

export const promptForTodoTitle = async (): Promise<TodoTitle> => {
  const result = await prompts({
    type: "text",
    name: "value",
    message: "Enter Title",
  });

  return TodoTitle(result.value).match(
    async (title) => {
      return title;
    },
    async (error) => {
      match(error)
        .with(
          {
            type: TodoDomainErrorType.TitleEmpty,
          },
          () => {
            console.log("Title cannot be empty \n");
          }
        )
        .with(
          {
            type: TodoDomainErrorType.TitleTooLong,
          },
          () => {
            console.log("Title cannot not be longer than 20 characters \n");
          }
        )
        .exhaustive();

      return await promptForTodoTitle();
    }
  );
};

export const promptForTodoDescription = async (): Promise<TodoDescription> => {
  const result = await prompts({
    type: "text",
    name: "value",
    message: "Enter Description",
  });

  return TodoDescription(result.value).match(
    async (title) => {
      return title;
    },
    async (error) => {
      match(error)
        .with(
          {
            type: TodoDomainErrorType.DescriptionTooLong,
          },
          () => {
            console.log("Description can not be longer than 100 characters \n");
          }
        )
        .exhaustive();

      return await promptForTodoDescription();
    }
  );
};

export const promptForTodoFinishNote = async (): Promise<TodoFinishNote> => {
  const result = await prompts({
    type: "text",
    name: "value",
    message: "Enter Finish Note",
  });

  return TodoFinishNote(result.value).match(
    async (title) => {
      return title;
    },
    async (error) => {
      match(error)
        .with(
          {
            type: TodoDomainErrorType.FinishNoteTooLong,
          },
          () => {
            console.log(
              "Finish Note can not be longer than 1000 characters \n"
            );
          }
        )
        .exhaustive();

      return await promptForTodoFinishNote();
    }
  );
};

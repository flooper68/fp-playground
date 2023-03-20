import prompts from "prompts";
import { match, P } from "ts-pattern";
import { ValidationErrorType } from "../lib/implementations/result";
import { TodoCommandErrorType, TodoCommandHandlers } from "./commands";
import {
  promptForTodoDescription,
  promptForTodoFinishNote,
  promptForTodoTitle,
  promptForTodoUuid,
} from "./prompts";
import { TodoQueryHandlers } from "./queries";
import {
  TodoMappingError,
  TodoMappingErrorType,
  TodoRepositoryErrorType,
} from "./repository";
import { TodoStoreErrorType } from "./store";
import { TodoDomainErrorType } from "./todo-domain";

export enum InteractionType {
  CreateTodo = "CreateTodo",
  ListTodos = "ListTodos",
  GetDetail = "GetDetail",
  FinishTodo = "FinishTodo",
  EditTitle = "EditTitle",
  EditDescription = "EditDescription",
  Exit = "Exit",
}

export interface AppContext {
  commandHandlers: TodoCommandHandlers;
  queryHandlers: TodoQueryHandlers;
}

enum ShouldExit {
  Yes = "Yes",
  No = "No",
}

function reportDataCorruption(e: TodoMappingError) {
  console.log("Data corruption detected!");

  e.errors.forEach((error) => {
    match(error)
      .with({ type: TodoMappingErrorType.NoteIsMissing }, () => {
        console.log(`Note is missing in the store.`);
      })
      .with({ type: TodoDomainErrorType.DescriptionTooLong }, () => {
        console.log(`Description is too long.`);
      })
      .with({ type: TodoDomainErrorType.FinishNoteTooLong }, () => {
        console.log(`Finish note is too long.`);
      })
      .with({ type: TodoDomainErrorType.TitleEmpty }, () => {
        console.log(`Title is empty.`);
      })
      .with({ type: TodoDomainErrorType.TitleTooLong }, () => {
        console.log(`Title is too long.`);
      })
      .exhaustive();
  });
}

async function handleCreateTodo(context: AppContext): Promise<ShouldExit> {
  const { commandHandlers } = context;

  console.log(`Creating todo...`);

  const uuid = await promptForTodoUuid();
  const title = await promptForTodoTitle();
  const description = await promptForTodoDescription();

  const result = await commandHandlers.createTodo({
    uuid,
    title,
    description,
  });

  result.match(
    () => {
      console.log(`Todo ${uuid} created successfully!`);
    },
    (error) => {
      console.log(`Error creating todo`, error);
    }
  );

  return ShouldExit.No;
}

async function handleListTodos(context: AppContext): Promise<ShouldExit> {
  const { queryHandlers } = context;

  console.log(`Listing todos...`);

  const list = await queryHandlers.getList();

  list.match(
    (ok) => {
      console.log(`Found ${ok.length} todos!`);
      console.log(ok);
    },
    (err) => {
      console.log(`Error listing todos!`, err);
    }
  );

  return ShouldExit.No;
}

async function handleGetDetail(context: AppContext): Promise<ShouldExit> {
  const { queryHandlers } = context;

  console.log(`Getting todo detail...`);

  const uuid = await promptForTodoUuid();

  const result = await queryHandlers.getDetail(uuid);

  result.match(
    (todo) => {
      console.log(`Requested Todo ${uuid} found!`);
      console.log(todo);
    },
    (err) => {
      console.log(`Todo ${uuid} can not be loaded! Error accessing store`, err);
    }
  );

  return ShouldExit.No;
}

async function handleFinishTodo(context: AppContext) {
  const { commandHandlers } = context;

  console.log(`Finishing todo...`);

  const uuid = await promptForTodoUuid();
  const note = await promptForTodoFinishNote();

  const result = await commandHandlers.finishTodo({
    uuid,
    note,
  });

  result.match(
    () => {
      console.log(`Todo ${uuid} finished successfully!`);
    },
    (e) => {
      match(e)
        .with(
          {
            type: TodoRepositoryErrorType.NotFound,
          },
          (err) => {
            console.log(`Can not finish Todo ${err.uuid}, it was not found!`);
          }
        )
        .with(
          {
            type: ValidationErrorType,
          },
          (err) => {
            reportDataCorruption(err);
          }
        )
        .with(
          {
            type: TodoCommandErrorType.TodoNotInUnfinishedState,
          },
          (err) => {
            console.log(
              `Todo ${err.uuid} can not be finished! It already is finished!`
            );
          }
        )
        .with(
          {
            type: P.union(
              TodoStoreErrorType.ErrorParsingData,
              TodoStoreErrorType.ErrorReadingData,
              TodoStoreErrorType.ErrorSavingData,
              TodoStoreErrorType.FileCouldNotBeCreated
            ),
          },
          (err) => {
            console.log(
              `Todo ${uuid} can not be finished! Error accessing store`,
              err
            );
          }
        )
        .exhaustive();
    }
  );

  return ShouldExit.No;
}

async function handleEditTitle(context: AppContext) {
  const { commandHandlers } = context;

  console.log(`Editing todo title...`);

  const uuid = await promptForTodoUuid();
  const title = await promptForTodoTitle();

  const result = await commandHandlers.editTitle({
    uuid,
    title,
  });

  result.match(
    () => {
      console.log(`Todo ${uuid} title edited successfully!`);
    },
    (e) => {
      match(e)
        .with(
          {
            type: TodoRepositoryErrorType.NotFound,
          },
          (err) => {
            console.log(
              `Can not edit title of Todo ${err.uuid}, it was not found!`
            );
          }
        )
        .with(
          {
            type: ValidationErrorType,
          },
          (err) => {
            reportDataCorruption(err);
          }
        )
        .with(
          {
            type: TodoCommandErrorType.TodoNotInUnfinishedState,
          },
          (err) => {
            console.log(
              `Can not edit title of Todo ${err.uuid}, it already is finished!`
            );
          }
        )
        .with(
          {
            type: P.union(
              TodoStoreErrorType.ErrorParsingData,
              TodoStoreErrorType.ErrorReadingData,
              TodoStoreErrorType.ErrorSavingData,
              TodoStoreErrorType.FileCouldNotBeCreated
            ),
          },
          (err) => {
            console.log(
              `Todo ${uuid} can not be finished! Error accessing store`,
              err
            );
          }
        )
        .exhaustive();
    }
  );
}

async function handleEditDescription(context: AppContext) {
  const { commandHandlers } = context;

  console.log(`Editing todo description...`);

  const uuid = await promptForTodoUuid();
  const description = await promptForTodoDescription();

  const result = await commandHandlers.editDescription({
    uuid,
    description,
  });

  result.match(
    () => {
      console.log(`Todo ${uuid} description edited successfully!`);
    },
    (e) => {
      match(e)
        .with(
          {
            type: TodoRepositoryErrorType.NotFound,
          },
          (err) => {
            console.log(
              `Can not edit description of Todo ${err.uuid}, it was not found!`
            );
          }
        )
        .with(
          {
            type: ValidationErrorType,
          },
          (err) => {
            reportDataCorruption(err);
          }
        )
        .with(
          {
            type: TodoCommandErrorType.TodoNotInUnfinishedState,
          },
          (err) => {
            console.log(
              `Can not edit description of Todo ${err.uuid}, it already is finished!`
            );
          }
        )
        .with(
          {
            type: P.union(
              TodoStoreErrorType.ErrorParsingData,
              TodoStoreErrorType.ErrorReadingData,
              TodoStoreErrorType.ErrorSavingData,
              TodoStoreErrorType.FileCouldNotBeCreated
            ),
          },
          (err) => {
            console.log(
              `Todo ${uuid} can not be finished! Error accessing store`,
              err
            );
          }
        )
        .exhaustive();
    }
  );
}

export async function startControllers(context: AppContext) {
  const result: {
    value?: InteractionType;
  } = await prompts({
    type: "select",
    name: "value",
    message: "What do you want to do?",
    choices: [
      {
        title: "Create Todo",
        value: InteractionType.CreateTodo,
      },
      { title: "List Todos", value: InteractionType.ListTodos },
      { title: "Get Detail", value: InteractionType.GetDetail },
      { title: "Finish Todo", value: InteractionType.FinishTodo },
      { title: "Edit Title", value: InteractionType.EditTitle },
      { title: "Edit Description", value: InteractionType.EditDescription },
      { title: "Exit", value: InteractionType.Exit },
    ],
  });

  const shouldExit = await match(result)
    .with({ value: InteractionType.CreateTodo }, async () => {
      return await handleCreateTodo(context);
    })
    .with({ value: InteractionType.ListTodos }, async () => {
      return await handleListTodos(context);
    })
    .with({ value: InteractionType.GetDetail }, async () => {
      return await handleGetDetail(context);
    })
    .with({ value: InteractionType.FinishTodo }, async () => {
      return await handleFinishTodo(context);
    })
    .with({ value: InteractionType.EditTitle }, async () => {
      return await handleEditTitle(context);
    })
    .with({ value: InteractionType.EditDescription }, async () => {
      return await handleEditDescription(context);
    })
    .with({ value: InteractionType.Exit }, async () => {
      return ShouldExit.Yes;
    })
    .with({}, () => {
      return ShouldExit.Yes;
    })
    .with({ value: undefined }, () => {
      return ShouldExit.Yes;
    })
    .exhaustive();

  if (shouldExit === ShouldExit.Yes) {
    return;
  } else {
    await startControllers(context);
  }
}

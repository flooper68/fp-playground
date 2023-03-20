import { TodoCommandHandlers } from "./commands";
import { AppContext, startControllers } from "./controllers";
import { TodoQueryHandlers } from "./queries";
import { TodoRepository } from "./repository";
import { TodoFileStore } from "./store";

const main = async () => {
  const store = TodoFileStore({
    config: {
      dataFile: "data.json",
    },
  });
  const repository = TodoRepository({ store });
  const commandHandlers = TodoCommandHandlers({ repository });
  const queryHandlers = TodoQueryHandlers({ store });

  const context: AppContext = {
    commandHandlers,
    queryHandlers,
  };

  await startControllers(context);

  console.log("Program finished! Closing...");
};

void main();

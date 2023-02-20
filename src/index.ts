import {
  runFailureEitherExample,
  runSuccessEitherExample,
} from "./examples/either-examples";
import {
  runFailureOptionExample,
  runSuccessOptionExample,
} from "./examples/option-examples";

runSuccessOptionExample();
runFailureOptionExample();

runSuccessEitherExample();
runFailureEitherExample();

import { Result } from "../../lib/implementations/result";
import { StateWithEvents } from "../common";
import { DomainErrors } from "../errors";
import { DomainEvent } from "../events";
import { createInitialSetup } from "../reducer";
import { Screen } from "../screen";
import { Setup, SetupUuid } from "../setup";
import { AuditUser } from "../user";

export function createSetupAction(props: {
  user: AuditUser;
  uuid: SetupUuid;
  danteEnabled: boolean;
  screens: Screen[];
}): Result<DomainErrors, StateWithEvents<Setup, DomainEvent>> {
  return createInitialSetup({
    user: props.user,
    uuid: props.uuid,
    danteEnabled: props.danteEnabled,
    screens: props.screens,
  });
}

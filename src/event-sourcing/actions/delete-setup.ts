import { Result } from "../../lib/implementations/result";
import { StateWithEvents } from "../common";
import { DomainErrors } from "../errors";
import { DomainEvent } from "../events";
import { reduceDomainEvent } from "../reducer";
import { Setup, SetupRemoved, SetupUuid } from "../setup";
import { AuditUser } from "../user";

export function deleteSetupAction(
  props: {
    user: AuditUser;
    uuid: SetupUuid;
  },
  state: StateWithEvents<Setup, DomainEvent>
): Result<DomainErrors, StateWithEvents<Setup, DomainEvent>> {
  const segmentUpdated = new SetupRemoved({
    user: props.user,
    uuid: props.uuid,
  });

  return reduceDomainEvent(state, segmentUpdated);
}

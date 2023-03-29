import { Result } from "../../lib/implementations/result";
import { StateWithEvents } from "../common";
import { DomainErrors } from "../errors";
import { DomainEvent, EntityDomainEvent } from "../events";
import { reduceDomainEvent } from "../reducer";
import { EditableSetup, Setup, SetupAdded } from "../setup";

export const getHistorySnapshot = (events: DomainEvent[], index: number) => {
  if (index === 0) {
    return Result.Err("Can not create snapshot from empty history" as const);
  }

  const snapshot = events.slice(1, index) as EntityDomainEvent[];

  const firstEvent = events[0] as SetupAdded;

  const initialState = EditableSetup({
    uuid: firstEvent.payload.uuid,
    danteEnabled: firstEvent.payload.danteEnabled,
    screens: firstEvent.payload.screens,
  }).map((setup) => {
    return {
      state: setup,
      events: [],
    };
  });

  return snapshot
    .reduce<Result<DomainErrors, StateWithEvents<Setup, DomainEvent>>>(
      (acc, event) => acc.chain((setup) => reduceDomainEvent(setup, event)),
      initialState
    )
    .map((setup) => setup.state);
};

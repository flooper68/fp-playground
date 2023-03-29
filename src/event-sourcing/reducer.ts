import { match } from "ts-pattern";
import { Result } from "../lib/implementations/result";
import { StateWithEvents } from "./common";
import { DomainErrors } from "./errors";
import { DomainEvent, DomainEventType, EntityDomainEvent } from "./events";
import { Screen, ScreenAdded, ScreenRemoved, ScreenUpdated } from "./screen";
import { SegmentAdded, SegmentRemoved, SegmentUpdated } from "./segment";
import {
  DanteDisabled,
  DanteEnabled,
  EditableSetup,
  Setup,
  SetupActions,
  SetupAdded,
  SetupRemoved,
  SetupUuid,
} from "./setup";
import { AuditUser } from "./user";

export function createInitialSetup(props: {
  user: AuditUser;
  uuid: SetupUuid;
  danteEnabled: boolean;
  screens: Screen[];
}): Result<DomainErrors, StateWithEvents<Setup, DomainEvent>> {
  const setupAdded = new SetupAdded({
    user: props.user,
    uuid: props.uuid,
    danteEnabled: props.danteEnabled,
    screens: props.screens,
  });

  const setup = EditableSetup({
    uuid: props.uuid,
    danteEnabled: props.danteEnabled,
    screens: props.screens,
  });

  return setup.map((setup) => {
    return {
      state: setup,
      events: [setupAdded],
    };
  });
}

function mergeSetupWithEvents(events: DomainEvent[], event: DomainEvent) {
  return (setup: Setup): StateWithEvents<Setup, DomainEvent> => {
    return {
      state: setup,
      events: [...events, event],
    };
  };
}

function applySetupRemoved(
  state: StateWithEvents<Setup, DomainEvent>,
  event: SetupRemoved
): Result<DomainErrors, StateWithEvents<Setup, DomainEvent>> {
  return SetupActions.assertEditableSetup(state.state)
    .chain(SetupActions.deleteSetup)
    .map(mergeSetupWithEvents(state.events, event));
}

function applyScreenAdded(
  state: StateWithEvents<Setup, DomainEvent>,
  event: ScreenAdded
): Result<DomainErrors, StateWithEvents<Setup, DomainEvent>> {
  return SetupActions.assertEditableSetup(state.state)
    .chain((setup) => {
      return SetupActions.createScreen(
        {
          uuid: event.payload.uuid,
          height: event.payload.height,
          segments: event.payload.segments,
        },
        setup
      );
    })
    .map(mergeSetupWithEvents(state.events, event));
}

function applyScreenUpdated(
  state: StateWithEvents<Setup, DomainEvent>,
  event: ScreenUpdated
): Result<DomainErrors, StateWithEvents<Setup, DomainEvent>> {
  return SetupActions.assertEditableSetup(state.state)
    .chain((setup) =>
      SetupActions.updateScreenProperties(
        {
          uuid: event.payload.uuid,
          height: event.payload.height,
        },
        setup
      )
    )
    .map(mergeSetupWithEvents(state.events, event));
}

function applyScreenRemoved(
  state: StateWithEvents<Setup, DomainEvent>,
  event: ScreenRemoved
): Result<DomainErrors, StateWithEvents<Setup, DomainEvent>> {
  return SetupActions.assertEditableSetup(state.state)
    .chain((setup) => {
      return SetupActions.removeScreen(
        {
          uuid: event.payload.uuid,
        },
        setup
      );
    })
    .map(mergeSetupWithEvents(state.events, event));
}

function applySegmentAdded(
  state: StateWithEvents<Setup, DomainEvent>,
  event: SegmentAdded
): Result<DomainErrors, StateWithEvents<Setup, DomainEvent>> {
  return SetupActions.assertEditableSetup(state.state)
    .chain((setup) => {
      return SetupActions.addSegmentToScreen(
        {
          uuid: event.payload.uuid,
          screenUuid: event.payload.screenUuid,
          width: event.payload.width,
          audioChannel: event.payload.audioChannel,
        },
        setup
      );
    })
    .map(mergeSetupWithEvents(state.events, event));
}

function applySegmentUpdated(
  state: StateWithEvents<Setup, DomainEvent>,
  event: SegmentUpdated
): Result<DomainErrors, StateWithEvents<Setup, DomainEvent>> {
  return SetupActions.assertEditableSetup(state.state)
    .chain((s) => {
      return SetupActions.updateSegmentProperties(
        {
          uuid: event.payload.uuid,
          width: event.payload.width,
          audioChannel: event.payload.audioChannel,
        },
        s
      );
    })
    .map(mergeSetupWithEvents(state.events, event));
}

function applySegmentRemoved(
  state: StateWithEvents<Setup, DomainEvent>,
  event: SegmentRemoved
): Result<DomainErrors, StateWithEvents<Setup, DomainEvent>> {
  const screenOfSegment = state.state.screens.find((screen) =>
    screen.segments.map((s) => s.uuid).includes(event.payload.uuid)
  );

  if (screenOfSegment == null) {
    return Result.Err(DomainErrors.SegmentNotFound);
  }

  return SetupActions.assertEditableSetup(state.state)
    .chain((setup) => {
      return SetupActions.removeSegment(
        {
          uuid: event.payload.uuid,
        },
        setup
      );
    })
    .map(mergeSetupWithEvents(state.events, event));
}

function applyDanteDisabled(
  state: StateWithEvents<Setup, DomainEvent>,
  event: DanteDisabled
): Result<DomainErrors, StateWithEvents<Setup, DomainEvent>> {
  return SetupActions.assertEditableSetup(state.state)
    .chain((setup) => {
      return SetupActions.disableDante(setup);
    })
    .map(mergeSetupWithEvents(state.events, event));
}

function applyDanteEnabled(
  state: StateWithEvents<Setup, DomainEvent>,
  event: DanteEnabled
): Result<DomainErrors, StateWithEvents<Setup, DomainEvent>> {
  return SetupActions.assertEditableSetup(state.state)
    .chain((setup) => {
      return SetupActions.enableDante(
        { defaultAudioChannel: event.payload.defaultAudioChannel },
        setup
      );
    })
    .map(mergeSetupWithEvents(state.events, event));
}

export function reduceDomainEvent(
  state: StateWithEvents<Setup, DomainEvent>,
  event: EntityDomainEvent
): Result<DomainErrors, StateWithEvents<Setup, DomainEvent>> {
  return match(event)
    .with(
      {
        type: DomainEventType.SetupRemoved,
      },
      (e) => applySetupRemoved(state, e)
    )
    .with(
      {
        type: DomainEventType.ScreenAdded,
      },
      (e) => applyScreenAdded(state, e)
    )
    .with(
      {
        type: DomainEventType.ScreenUpdated,
      },
      (e) => applyScreenUpdated(state, e)
    )
    .with(
      {
        type: DomainEventType.ScreenRemoved,
      },
      (e) => applyScreenRemoved(state, e)
    )
    .with(
      {
        type: DomainEventType.SegmentAdded,
      },
      (e) => applySegmentAdded(state, e)
    )
    .with(
      {
        type: DomainEventType.SegmentUpdated,
      },
      (e) => applySegmentUpdated(state, e)
    )
    .with(
      {
        type: DomainEventType.SegmentRemoved,
      },
      (e) => applySegmentRemoved(state, e)
    )
    .with(
      {
        type: DomainEventType.DanteEnabled,
      },
      (e) => applyDanteEnabled(state, e)
    )
    .with(
      {
        type: DomainEventType.DanteDisabled,
      },
      (e) => applyDanteDisabled(state, e)
    )
    .exhaustive();
}

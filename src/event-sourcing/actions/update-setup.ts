import { Option } from "../../lib/implementations/option";
import { Result } from "../../lib/implementations/result";
import { StateWithEvents } from "../common";
import { DomainErrors } from "../errors";
import { DomainEvent, EntityDomainEvent } from "../events";
import { reduceDomainEvent } from "../reducer";
import {
  Screen,
  ScreenAdded,
  ScreenRemoved,
  ScreenUpdated,
  ScreenUuid,
} from "../screen";
import {
  Segment,
  SegmentAdded,
  SegmentAudioChannel,
  SegmentRemoved,
  SegmentUpdated,
} from "../segment";
import { DanteDisabled, DanteEnabled, EditableSetup, Setup } from "../setup";
import { AuditUser } from "../user";

function getSetupUpdates(
  props: {
    user: AuditUser;
    setup: EditableSetup;
  },
  state: StateWithEvents<Setup, DomainEvent>
): EntityDomainEvent[] {
  if (props.setup.danteEnabled === state.state.danteEnabled) {
    return [];
  }

  if (props.setup.danteEnabled) {
    return [
      new DanteEnabled({
        user: props.user,
        uuid: props.setup.uuid,
        defaultAudioChannel: SegmentAudioChannel(1).unwrap(),
      }),
    ];
  } else {
    return [new DanteDisabled({ user: props.user, uuid: props.setup.uuid })];
  }
}

function getSegmentUpdates(
  user: AuditUser,
  screenUuid: ScreenUuid,
  newSegments: Segment[],
  oldSegments: Segment[]
) {
  const createAndUpdateEvents = newSegments
    .map((segment) => {
      const oldSegment = oldSegments.find((s) => s.uuid === segment.uuid);

      if (oldSegment == null) {
        return Option.Some(
          new SegmentAdded({
            user,
            uuid: segment.uuid,
            screenUuid,
            width: segment.width,
            audioChannel: segment.audioChannel,
          })
        );
      }

      if (
        oldSegment.width === segment.width &&
        Option.compare(oldSegment.audioChannel, segment.audioChannel)
      ) {
        return Option.None();
      }

      return Option.Some(
        new SegmentUpdated({
          user,
          uuid: segment.uuid,
          audioChannel: segment.audioChannel,
          width: segment.width,
        })
      );
    })
    .filter((e) => e.isSome());

  const deletedEvents = oldSegments
    .map((segment) => {
      const newScreen = newSegments.find((s) => s.uuid === segment.uuid);

      if (newScreen == null) {
        return Option.Some(
          new SegmentRemoved({
            user: user,
            uuid: segment.uuid,
          })
        );
      }

      return Option.None();
    })
    .filter((e) => e.isSome());

  return [...createAndUpdateEvents, ...deletedEvents];
}

function getScreenUpdates(
  user: AuditUser,
  newScreens: Screen[],
  oldScreens: Screen[]
): EntityDomainEvent[] {
  const createAndUpdateEvents = newScreens
    .flatMap((screen): Option<EntityDomainEvent>[] => {
      const oldScreen = oldScreens.find((s) => s.uuid === screen.uuid);

      if (oldScreen == null) {
        return [
          Option.Some(
            new ScreenAdded({
              user: user,
              uuid: screen.uuid,
              height: screen.height,
              segments: screen.segments,
            })
          ),
        ];
      }

      const segmentUpdates = getSegmentUpdates(
        user,
        screen.uuid,
        screen.segments,
        oldScreen.segments
      );

      if (oldScreen.height === screen.height) {
        return [Option.None(), ...segmentUpdates];
      }

      return [
        Option.Some(
          new ScreenUpdated({
            user: user,
            uuid: screen.uuid,
            height: screen.height,
          })
        ),
        ...segmentUpdates,
      ];
    })
    .filter((e) => e.isSome());

  const deletedEvents = oldScreens
    .map((screen): Option<EntityDomainEvent> => {
      const newScreen = newScreens.find((s) => s.uuid === screen.uuid);

      if (newScreen == null) {
        return Option.Some(
          new ScreenRemoved({
            user: user,
            uuid: screen.uuid,
          })
        );
      }

      return Option.None();
    })
    .filter((e) => e.isSome());

  return [...createAndUpdateEvents, ...deletedEvents].map((e) => e.unwrap());
}

export function updateSetupAction(
  props: {
    user: AuditUser;
    setup: EditableSetup;
  },
  state: StateWithEvents<Setup, DomainEvent>
): Result<DomainErrors, StateWithEvents<Setup, DomainEvent>> {
  const events = [
    ...getSetupUpdates(props, state),
    ...getScreenUpdates(props.user, props.setup.screens, state.state.screens),
  ];

  return events.reduce<
    Result<DomainErrors, StateWithEvents<Setup, DomainEvent>>
  >((acc, event) => {
    return acc.chain((state) => reduceDomainEvent(state, event));
  }, Result.Ok(state));
}

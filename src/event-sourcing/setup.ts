import { Option } from "../lib/implementations/option";
import { Result } from "../lib/implementations/result";
import { Opaque } from "../lib/opaque";
import { DomainErrors } from "./errors";
import { DomainEventType } from "./events";
import { Screen, ScreenActions, ScreenHeight, ScreenUuid } from "./screen";
import {
  Segment,
  SegmentActions,
  SegmentAudioChannel,
  SegmentUuid,
  SegmentWidth,
} from "./segment";
import { AuditUser } from "./user";

export type SetupUuid = Opaque<string, "SetupUuid">;

export function SetupUuid(value: string): Result<never, SetupUuid> {
  return Result.Ok(value as SetupUuid);
}

export type EditableSetup = Opaque<
  {
    uuid: SetupUuid;
    danteEnabled: boolean;
    screens: Screen[];
    deleted: false;
  },
  "EditableSetup"
>;

export function EditableSetup(props: {
  uuid: SetupUuid;
  danteEnabled: boolean;
  screens: Screen[];
}): Result<DomainErrors, EditableSetup> {
  const segments = props.screens
    .filter((screen) => !screen.deleted)
    .flatMap((screen) => screen.segments);

  if (
    props.danteEnabled &&
    segments.some((segment) => segment.audioChannel.isNone())
  ) {
    return Result.Err(DomainErrors.DanteEnabledButInvalidSegments);
  }

  if (
    !props.danteEnabled &&
    segments.some((segment) => segment.audioChannel.isSome())
  ) {
    return Result.Err(DomainErrors.DanteDisabledButInvalidSegments);
  }

  if (props.screens.length < 1) {
    return Result.Err(DomainErrors.ThereIsNoScreen);
  }

  return Result.Ok({
    uuid: props.uuid,
    danteEnabled: props.danteEnabled,
    screens: props.screens,
    deleted: false,
  } as EditableSetup);
}

export type DeletedSetup = Opaque<
  {
    uuid: SetupUuid;
    danteEnabled: boolean;
    screens: Screen[];
    deleted: true;
  },
  "DeletedSetup"
>;

export function DeletedSetup(props: {
  uuid: SetupUuid;
  danteEnabled: boolean;
  screens: Screen[];
}): Result<DomainErrors, DeletedSetup> {
  const segments = props.screens
    .filter((screen) => !screen.deleted)
    .flatMap((screen) => screen.segments);

  if (
    props.danteEnabled &&
    segments.some((segment) => segment.audioChannel.isNone())
  ) {
    return Result.Err(DomainErrors.DanteEnabledButInvalidSegments);
  }

  if (
    !props.danteEnabled &&
    segments.some((segment) => segment.audioChannel.isSome())
  ) {
    return Result.Err(DomainErrors.DanteDisabledButInvalidSegments);
  }

  return Result.Ok({
    uuid: props.uuid,
    danteEnabled: props.danteEnabled,
    screens: props.screens,
    deleted: true,
  } as DeletedSetup);
}

export type Setup = EditableSetup | DeletedSetup;

export class SetupAdded {
  readonly type = DomainEventType.SetupAdded;
  readonly version = 1;
  constructor(
    readonly payload: Readonly<{
      user: AuditUser;
      uuid: SetupUuid;
      danteEnabled: boolean;
      screens: Screen[];
    }>
  ) {}
}

export class DanteEnabled {
  readonly type = DomainEventType.DanteEnabled;
  readonly version = 1;
  constructor(
    readonly payload: Readonly<{
      user: AuditUser;
      uuid: SetupUuid;
      defaultAudioChannel: SegmentAudioChannel;
    }>
  ) {}
}

export class DanteDisabled {
  readonly type = DomainEventType.DanteDisabled;
  readonly version = 1;
  constructor(
    readonly payload: Readonly<{
      user: AuditUser;
      uuid: SetupUuid;
    }>
  ) {}
}

export class SetupRemoved {
  readonly type = DomainEventType.SetupRemoved;
  readonly version = 1;
  constructor(
    readonly payload: Readonly<{
      user: AuditUser;
      uuid: SetupUuid;
    }>
  ) {}
}

export type SetupEvent =
  | SetupAdded
  | SetupRemoved
  | DanteEnabled
  | DanteDisabled;

export const SetupActions = {
  assertEditableSetup(setup: Setup): Result<DomainErrors, EditableSetup> {
    if (setup.deleted) {
      return Result.Err(DomainErrors.SetupNotEditable);
    } else {
      return Result.Ok(setup);
    }
  },
  createScreen(
    props: { uuid: ScreenUuid; height: ScreenHeight; segments: Segment[] },
    setup: EditableSetup
  ) {
    const newScreen = ScreenActions.create({
      uuid: props.uuid,
      height: props.height,
      segments: props.segments,
    });

    return newScreen.chain((screen) => {
      return EditableSetup({
        uuid: setup.uuid,
        danteEnabled: setup.danteEnabled,
        screens: [...setup.screens, screen],
      });
    });
  },
  updateScreenProperties(
    props: { uuid: ScreenUuid; height: ScreenHeight },
    setup: EditableSetup
  ) {
    const screen = setup.screens.find((s) => s.uuid === props.uuid);

    if (screen == null) {
      return Result.Err(DomainErrors.ScreenNoFound);
    }

    const editableScreen = ScreenActions.assertEditableScreen(screen);

    const updatedScreen = editableScreen.chain((editable) =>
      ScreenActions.updateProperties(
        {
          uuid: props.uuid,
          height: props.height,
        },
        editable
      )
    );

    return updatedScreen.chain((updatedScreen) => {
      return EditableSetup({
        uuid: setup.uuid,
        danteEnabled: setup.danteEnabled,
        screens: setup.screens.map((screen) => {
          if (screen.uuid !== props.uuid) {
            return screen;
          }

          return updatedScreen;
        }),
      });
    });
  },
  removeScreen(props: { uuid: ScreenUuid }, setup: EditableSetup) {
    const screen = setup.screens.find((s) => s.uuid === props.uuid);

    if (screen == null) {
      return Result.Err(DomainErrors.ScreenNoFound);
    }

    const updatedScreen = ScreenActions.assertEditableScreen(screen).chain(
      (s) => {
        return ScreenActions.delete(s);
      }
    );

    return updatedScreen.chain((updatedScreen) => {
      return EditableSetup({
        uuid: setup.uuid,
        danteEnabled: setup.danteEnabled,
        screens: setup.screens.map((screen) => {
          if (screen.uuid !== props.uuid) {
            return screen;
          }

          return updatedScreen;
        }),
      });
    });
  },
  addSegmentToScreen(
    props: {
      uuid: SegmentUuid;
      screenUuid: ScreenUuid;
      width: SegmentWidth;
      audioChannel: Option<SegmentAudioChannel>;
    },
    setup: EditableSetup
  ) {
    const screen = setup.screens.find((s) => s.uuid === props.screenUuid);

    if (screen == null) {
      return Result.Err(DomainErrors.ScreenNoFound);
    }

    const editableScreen = ScreenActions.assertEditableScreen(screen);

    const updatedScreen = editableScreen.chain((screen) => {
      const newSegment = SegmentActions.create({
        uuid: props.uuid,
        width: props.width,
        audioChannel: props.audioChannel,
      });

      return ScreenActions.addSegment({ segment: newSegment }, screen);
    });

    const updatedSetup = updatedScreen.chain((updatedScreen) => {
      return EditableSetup({
        uuid: setup.uuid,
        danteEnabled: setup.danteEnabled,
        screens: setup.screens.map((screen) => {
          if (screen.uuid === updatedScreen.uuid) {
            return updatedScreen;
          }

          return screen;
        }),
      });
    });

    return updatedSetup;
  },
  updateSegmentProperties(
    props: {
      uuid: SegmentUuid;
      width: SegmentWidth;
      audioChannel: Option<SegmentAudioChannel>;
    },
    setup: EditableSetup
  ) {
    const screenOfSegment = setup.screens.find((screen) =>
      screen.segments.map((s) => s.uuid).includes(props.uuid)
    );

    if (screenOfSegment == null) {
      return Result.Err(DomainErrors.ScreenNoFound);
    }

    const editableScreen = ScreenActions.assertEditableScreen(screenOfSegment);

    const updatedScreen = editableScreen.chain((screen) => {
      return ScreenActions.updateSegmentProperties(
        {
          uuid: props.uuid,
          width: props.width,
          audioChannel: props.audioChannel,
        },
        screen
      );
    });

    const updatedSetup = updatedScreen.chain((updatedScreen) => {
      return EditableSetup({
        uuid: setup.uuid,
        danteEnabled: setup.danteEnabled,
        screens: setup.screens.map((screen) => {
          if (screen.uuid === screenOfSegment.uuid) {
            return updatedScreen;
          }

          return screen;
        }),
      });
    });

    return updatedSetup;
  },
  removeSegment(
    props: {
      uuid: SegmentUuid;
    },
    setup: EditableSetup
  ) {
    const screenOfSegment = setup.screens.find((screen) =>
      screen.segments.map((s) => s.uuid).includes(props.uuid)
    );

    if (screenOfSegment == null) {
      return Result.Err(DomainErrors.ScreenNoFound);
    }

    const editableScreen = ScreenActions.assertEditableScreen(screenOfSegment);

    const updatedScreen = editableScreen.chain((screen) => {
      return ScreenActions.removeSegment(
        {
          uuid: props.uuid,
        },
        screen
      );
    });

    const updatedSetup = updatedScreen.chain((updatedScreen) => {
      return EditableSetup({
        uuid: setup.uuid,
        danteEnabled: setup.danteEnabled,
        screens: setup.screens.map((screen) => {
          if (screen.uuid === updatedScreen.uuid) {
            return updatedScreen;
          }

          return screen;
        }),
      });
    });

    return updatedSetup;
  },
  disableDante(setup: EditableSetup): Result<DomainErrors, EditableSetup> {
    const editableScreens = setup.screens.filter((screen) => !screen.deleted);

    const screens = Result.sequenceArray(
      editableScreens.map((screen) => {
        const editable = ScreenActions.assertEditableScreen(screen);

        return editable.chain((screen) => {
          return ScreenActions.disabledSegmentsDante(screen);
        });
      })
    );

    return screens.chain((screens) => {
      return EditableSetup({
        ...setup,
        danteEnabled: false,
        screens,
      });
    });
  },
  enableDante(
    props: {
      defaultAudioChannel: SegmentAudioChannel;
    },
    setup: EditableSetup
  ): Result<DomainErrors, EditableSetup> {
    const editableScreens = setup.screens.filter((screen) => !screen.deleted);

    const screens = Result.sequenceArray(
      editableScreens.map((screen) => {
        const editable = ScreenActions.assertEditableScreen(screen);

        return editable.chain((screen) => {
          return ScreenActions.setSegmentsDante(
            { audioChannel: props.defaultAudioChannel },
            screen
          );
        });
      })
    );

    return screens.chain((screens) => {
      return EditableSetup({
        ...setup,
        danteEnabled: true,
        screens,
      });
    });
  },
  deleteSetup(setup: EditableSetup): Result<DomainErrors, Setup> {
    return DeletedSetup({
      uuid: setup.uuid,
      danteEnabled: setup.danteEnabled,
      screens: setup.screens,
    });
  },
};

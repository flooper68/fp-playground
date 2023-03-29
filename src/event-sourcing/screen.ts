import { Option } from "../lib/implementations/option";
import { Result } from "../lib/implementations/result";
import { Opaque } from "../lib/opaque";
import { DomainErrors } from "./errors";
import { DomainEventType } from "./events";
import {
  Segment,
  SegmentActions,
  SegmentAudioChannel,
  SegmentUuid,
  SegmentWidth,
} from "./segment";
import { AuditUser } from "./user";

export type ScreenUuid = Opaque<string, "ScreenUuid">;

export function ScreenUuid(value: string): Result<never, ScreenUuid> {
  return Result.Ok(value as ScreenUuid);
}

export type ScreenHeight = Opaque<number, "ScreenHeight">;

export function ScreenHeight(
  value: number
): Result<"HeightIsNotPositiveNumber" | "HeightIsBiggerThanMax", ScreenHeight> {
  if (value <= 0) {
    return Result.Err("HeightIsNotPositiveNumber" as const);
  }
  if (value > 1000) {
    return Result.Err("HeightIsBiggerThanMax" as const);
  }
  return Result.Ok(value as ScreenHeight);
}

export type EditableScreen = Opaque<
  {
    uuid: ScreenUuid;
    height: ScreenHeight;
    segments: Segment[];
    deleted: false;
  },
  "EditableScreen"
>;

export function EditableScreen(props: {
  uuid: ScreenUuid;
  height: ScreenHeight;
  segments: Segment[];
}): Result<DomainErrors, EditableScreen> {
  if (props.segments.length < 1) {
    return Result.Err(DomainErrors.ScreenHasNoSegments);
  }

  return Result.Ok({
    uuid: props.uuid,
    height: props.height,
    segments: props.segments,
    deleted: false,
  } as EditableScreen);
}

export type DeletedScreen = Opaque<
  {
    uuid: ScreenUuid;
    height: ScreenHeight;
    segments: Segment[];
    deleted: true;
  },
  "DeletedScreen"
>;

export function DeletedScreen(props: {
  uuid: ScreenUuid;
  height: ScreenHeight;
  segments: Segment[];
}): Result<DomainErrors, DeletedScreen> {
  if (props.segments.length < 1) {
    return Result.Err(DomainErrors.ScreenHasNoSegments);
  }

  return Result.Ok({
    uuid: props.uuid,
    height: props.height,
    segments: props.segments,
    deleted: true,
  } as DeletedScreen);
}

export type Screen = EditableScreen | DeletedScreen;

export class ScreenAdded {
  readonly type = DomainEventType.ScreenAdded;
  readonly version = 1;
  constructor(
    readonly payload: Readonly<{
      user: AuditUser;
      uuid: ScreenUuid;
      height: ScreenHeight;
      segments: Segment[];
    }>
  ) {}
}

export class ScreenUpdated {
  readonly type = DomainEventType.ScreenUpdated;
  readonly version = 1;
  constructor(
    readonly payload: Readonly<{
      user: AuditUser;
      uuid: ScreenUuid;
      height: ScreenHeight;
    }>
  ) {}
}

export class ScreenRemoved {
  readonly type = DomainEventType.ScreenRemoved;
  readonly version = 1;
  constructor(
    readonly payload: Readonly<{
      user: AuditUser;
      uuid: ScreenUuid;
    }>
  ) {}
}

export type ScreenEvent = ScreenAdded | ScreenRemoved | ScreenUpdated;

export const ScreenActions = {
  assertEditableScreen(screen: Screen): Result<DomainErrors, EditableScreen> {
    if (screen.deleted) {
      return Result.Err(DomainErrors.ScreenNotEditable);
    } else {
      return Result.Ok(screen);
    }
  },
  create(props: {
    uuid: ScreenUuid;
    height: ScreenHeight;
    segments: Segment[];
  }): Result<DomainErrors, EditableScreen> {
    return EditableScreen({
      uuid: props.uuid,
      height: props.height,
      segments: props.segments,
    });
  },
  updateProperties(
    props: { uuid: ScreenUuid; height: ScreenHeight },
    screen: EditableScreen
  ): Result<DomainErrors, EditableScreen> {
    return EditableScreen({
      uuid: props.uuid,
      height: props.height,
      segments: screen.segments,
    });
  },
  delete(screen: EditableScreen): Result<DomainErrors, DeletedScreen> {
    return DeletedScreen({
      uuid: screen.uuid,
      height: screen.height,
      segments: screen.segments,
    });
  },
  updateHeight(
    props: {
      height: ScreenHeight;
    },
    screen: EditableScreen
  ): Result<DomainErrors, EditableScreen> {
    return EditableScreen({
      uuid: screen.uuid,
      height: props.height,
      segments: screen.segments,
    });
  },
  addSegment(
    props: {
      segment: Segment;
    },
    screen: EditableScreen
  ): Result<DomainErrors, EditableScreen> {
    return EditableScreen({
      ...screen,
      segments: [...screen.segments, props.segment],
    });
  },
  updateSegmentProperties(
    props: {
      uuid: SegmentUuid;
      width: SegmentWidth;
      audioChannel: Option<SegmentAudioChannel>;
    },
    screen: EditableScreen
  ): Result<DomainErrors, EditableScreen> {
    const segment = screen.segments.find(
      (segment) => segment.uuid === props.uuid
    );

    if (!segment) {
      return Result.Err(DomainErrors.SegmentNotFound);
    }

    const updatedSegment = SegmentActions.update(
      {
        width: props.width,
        audioChannel: props.audioChannel,
      },
      segment
    );

    return EditableScreen({
      ...screen,
      segments: screen.segments.map((segment) => {
        if (segment.uuid === props.uuid) {
          return updatedSegment;
        } else {
          return segment;
        }
      }),
    });
  },
  removeSegment(
    props: {
      uuid: SegmentUuid;
    },
    screen: EditableScreen
  ): Result<DomainErrors, EditableScreen> {
    const segment = screen.segments.find(
      (segment) => segment.uuid === props.uuid
    );

    if (!segment) {
      return Result.Err(DomainErrors.SegmentNotFound);
    }

    return EditableScreen({
      ...screen,
      segments: screen.segments.filter(
        (segment) => segment.uuid !== props.uuid
      ),
    });
  },
  disabledSegmentsDante(
    screen: EditableScreen
  ): Result<DomainErrors, EditableScreen> {
    return EditableScreen({
      ...screen,
      segments: screen.segments.map((segment) => {
        return SegmentActions.unsetAudioChannel(segment);
      }),
    });
  },
  setSegmentsDante(
    props: { audioChannel: SegmentAudioChannel },
    screen: EditableScreen
  ): Result<DomainErrors, EditableScreen> {
    return EditableScreen({
      ...screen,
      segments: screen.segments.map((segment) => {
        return SegmentActions.setAudioChannel(props, segment);
      }),
    });
  },
};

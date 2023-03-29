import { Option } from "../lib/implementations/option";
import { Result } from "../lib/implementations/result";
import { Opaque } from "../lib/opaque";
import { DomainEventType } from "./events";
import { ScreenUuid } from "./screen";
import { AuditUser } from "./user";

export type SegmentUuid = Opaque<string, "SegmentUuid">;

export function SegmentUuid(value: string): Result<never, SegmentUuid> {
  return Result.Ok(value as SegmentUuid);
}

export type SegmentWidth = Opaque<number, "SegmentWidth">;

export function SegmentWidth(
  value: number
): Result<
  "SegmentWidthIsNotPositiveNumber" | "SegmentWidthIsBiggerThanMax",
  SegmentWidth
> {
  if (value <= 0) {
    return Result.Err("SegmentWidthIsNotPositiveNumber" as const);
  }
  if (value > 1000) {
    return Result.Err("SegmentWidthIsBiggerThanMax" as const);
  }
  return Result.Ok(value as SegmentWidth);
}

export type SegmentAudioChannel = Opaque<number, "SegmentAudioChannel">;

export function SegmentAudioChannel(
  value: number
): Result<
  "AudioChannelIsNotPositiveNumber" | "AudioChannelIsBiggerThanMax",
  SegmentAudioChannel
> {
  if (value <= 0) {
    return Result.Err("AudioChannelIsNotPositiveNumber" as const);
  }

  if (value > 1000) {
    return Result.Err("AudioChannelIsBiggerThanMax");
  }

  return Result.Ok(value as SegmentAudioChannel);
}

export interface Segment {
  uuid: SegmentUuid;
  width: SegmentWidth;
  audioChannel: Option<SegmentAudioChannel>;
}

export class SegmentAdded {
  readonly type = DomainEventType.SegmentAdded;
  readonly version = 1;
  constructor(
    readonly payload: Readonly<{
      user: AuditUser;
      uuid: SegmentUuid;
      screenUuid: ScreenUuid;
      width: SegmentWidth;
      audioChannel: Option<SegmentAudioChannel>;
    }>
  ) {}
}

export class SegmentUpdated {
  readonly type = DomainEventType.SegmentUpdated;
  readonly version = 1;
  constructor(
    readonly payload: Readonly<{
      user: AuditUser;
      uuid: SegmentUuid;
      width: SegmentWidth;
      audioChannel: Option<SegmentAudioChannel>;
    }>
  ) {}
}

export class SegmentRemoved {
  readonly type = DomainEventType.SegmentRemoved;
  readonly version = 1;
  constructor(
    readonly payload: Readonly<{
      user: AuditUser;
      uuid: SegmentUuid;
    }>
  ) {}
}

export type SegmentEvent = SegmentAdded | SegmentUpdated | SegmentRemoved;

export const SegmentActions = {
  create(props: {
    uuid: SegmentUuid;
    width: SegmentWidth;
    audioChannel: Option<SegmentAudioChannel>;
  }): Segment {
    return {
      uuid: props.uuid,
      width: props.width,
      audioChannel: props.audioChannel,
    };
  },
  update(
    props: {
      width: SegmentWidth;
      audioChannel: Option<SegmentAudioChannel>;
    },
    segment: Segment
  ): Segment {
    return {
      uuid: segment.uuid,
      width: props.width,
      audioChannel: props.audioChannel,
    };
  },
  unsetAudioChannel(segment: Segment): Segment {
    return {
      uuid: segment.uuid,
      width: segment.width,
      audioChannel: Option.None(),
    };
  },
  setAudioChannel(
    props: {
      audioChannel: SegmentAudioChannel;
    },
    segment: Segment
  ): Segment {
    return {
      uuid: segment.uuid,
      width: segment.width,
      audioChannel: Option.Some(props.audioChannel),
    };
  },
};

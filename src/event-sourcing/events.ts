import { ScreenEvent } from "./screen";
import { SegmentEvent } from "./segment";
import { SetupAdded, SetupEvent } from "./setup";

export enum DomainEventType {
  SegmentAdded = "SEGMENT_ADDED",
  SegmentUpdated = "SEGMENT_UPDATED",
  SegmentRemoved = "SEGMENT_REMOVED",
  ScreenAdded = "SCREEN_ADDED",
  ScreenUpdated = "SCREEN_UPDATED",
  ScreenRemoved = "SCREEN_REMOVED",
  SetupAdded = "SETUP_ADDED",
  DanteEnabled = "DANTE_ENABLED",
  DanteDisabled = "DANTE_DISABLED",
  SetupRemoved = "SETUP_REMOVED",
}

export type DomainEvent = SegmentEvent | ScreenEvent | SetupEvent;
export type EntityDomainEvent = Exclude<DomainEvent, SetupAdded>;

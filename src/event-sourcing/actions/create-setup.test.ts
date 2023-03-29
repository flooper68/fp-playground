import { describe, expect, it } from "vitest";
import { Option } from "../../lib/implementations/option";
import { DomainEventType } from "../events";
import { SegmentAudioChannel, SegmentUuid, SegmentWidth } from "../segment";
import { SetupUuid } from "../setup";
import { AuditUser } from "../user";
import { EditableScreen, ScreenHeight, ScreenUuid } from "../screen";
import { createSetupAction } from "./create-setup";

describe("createSetupAction", () => {
  it("should create Setup and emit SetupAdded event", () => {
    const result = createSetupAction({
      user: AuditUser({
        uuid: "user-uuid",
        email: "user-email",
      }).unwrap(),
      uuid: SetupUuid("setup-uuid").unwrap(),
      danteEnabled: true,
      screens: [
        EditableScreen({
          uuid: ScreenUuid("segment-uuid").unwrap(),
          height: ScreenHeight(100).unwrap(),
          segments: [
            {
              uuid: SegmentUuid("segment-uuid").unwrap(),
              width: SegmentWidth(100).unwrap(),
              audioChannel: Option.Some(SegmentAudioChannel(1).unwrap()),
            },
          ],
        }).unwrap(),
      ],
    });

    expect(result.unwrap().events.length).toBe(1);
    expect(result.unwrap().events[0].type).toBe(DomainEventType.SetupAdded);
  });
});

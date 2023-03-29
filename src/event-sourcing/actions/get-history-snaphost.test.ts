import { describe, expect, it } from "vitest";
import { Option } from "../../lib/implementations/option";
import { DomainEvent } from "../events";
import {
  EditableScreen,
  ScreenHeight,
  ScreenUpdated,
  ScreenUuid,
} from "../screen";
import { SegmentUuid, SegmentWidth } from "../segment";
import { SetupAdded, SetupUuid } from "../setup";
import { AuditUser } from "../user";
import { getHistorySnapshot } from "./get-history-snapshot";

const user = AuditUser({
  email: "email",
  uuid: "user-uuid",
}).unwrap();

describe("getHistorySnapshot", () => {
  it("should return an error if the index is 0", () => {
    const history: DomainEvent[] = [];

    const result = getHistorySnapshot(history, 0);

    expect(result.isErr()).toBe(true);
  });

  it("should return correct state of history of given index", () => {
    const history: DomainEvent[] = [
      new SetupAdded({
        user,
        uuid: SetupUuid("setup-uuid").unwrap(),
        danteEnabled: false,
        screens: [
          EditableScreen({
            uuid: ScreenUuid("screen-uuid").unwrap(),
            height: ScreenHeight(100).unwrap(),
            segments: [
              {
                uuid: SegmentUuid("segment-uuid").unwrap(),
                width: SegmentWidth(100).unwrap(),
                audioChannel: Option.None(),
              },
            ],
          }).unwrap(),
        ],
      }),
      new ScreenUpdated({
        user,
        uuid: ScreenUuid("screen-uuid").unwrap(),
        height: ScreenHeight(200).unwrap(),
      }),
    ];

    const result = getHistorySnapshot(history, 1);

    expect(result.unwrap().screens[0].height).toBe(100);
  });

  it("should return last state if index is higher than history length", () => {
    const history: DomainEvent[] = [
      new SetupAdded({
        user,
        uuid: SetupUuid("setup-uuid").unwrap(),
        danteEnabled: false,
        screens: [
          EditableScreen({
            uuid: ScreenUuid("screen-uuid").unwrap(),
            height: ScreenHeight(100).unwrap(),
            segments: [
              {
                uuid: SegmentUuid("segment-uuid").unwrap(),
                width: SegmentWidth(100).unwrap(),
                audioChannel: Option.None(),
              },
            ],
          }).unwrap(),
        ],
      }),
      new ScreenUpdated({
        user,
        uuid: ScreenUuid("screen-uuid").unwrap(),
        height: ScreenHeight(200).unwrap(),
      }),
    ];

    const result = getHistorySnapshot(history, 10);

    expect(result.unwrap().screens[0].height).toBe(200);
  });
});

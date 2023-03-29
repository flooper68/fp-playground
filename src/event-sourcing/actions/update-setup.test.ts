import { describe, expect, it } from "vitest";
import { Option } from "../../lib/implementations/option";
import { DomainEventType } from "../events";
import { EditableScreen, ScreenHeight, ScreenUuid } from "../screen";
import { SegmentAudioChannel, SegmentUuid, SegmentWidth } from "../segment";
import { EditableSetup, SetupUuid } from "../setup";
import { AuditUser } from "../user";
import { updateSetupAction } from "./update-setup";

describe("updateSetupAction", () => {
  it("should disable Dante", () => {
    const initialState = {
      state: EditableSetup({
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
      }).unwrap(),
      events: [],
    };

    const result = updateSetupAction(
      {
        user: AuditUser({
          uuid: "user-uuid",
          email: "user-email",
        }).unwrap(),
        setup: EditableSetup({
          uuid: SetupUuid("setup-uuid").unwrap(),
          danteEnabled: false,
          screens: [
            EditableScreen({
              uuid: ScreenUuid("segment-uuid").unwrap(),
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
        }).unwrap(),
      },
      initialState
    );

    expect(result.unwrap().events.length).toBe(2);
    expect(result.unwrap().events[0].type).toBe(DomainEventType.DanteDisabled);
    expect(result.unwrap().events[1].type).toBe(DomainEventType.SegmentUpdated);
  });

  it("should enable Dante", () => {
    const initialState = {
      state: EditableSetup({
        uuid: SetupUuid("setup-uuid").unwrap(),
        danteEnabled: false,
        screens: [
          EditableScreen({
            uuid: ScreenUuid("segment-uuid").unwrap(),
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
      }).unwrap(),
      events: [],
    };

    const result = updateSetupAction(
      {
        user: AuditUser({
          uuid: "user-uuid",
          email: "user-email",
        }).unwrap(),
        setup: EditableSetup({
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
                  audioChannel: Option.Some(SegmentAudioChannel(2).unwrap()),
                },
              ],
            }).unwrap(),
          ],
        }).unwrap(),
      },
      initialState
    );

    expect(result.unwrap().events.length).toBe(2);
    expect(result.unwrap().events[0].type).toBe(DomainEventType.DanteEnabled);
    expect(result.unwrap().events[1].type).toBe(DomainEventType.SegmentUpdated);
  });

  it("should update Screen", () => {
    const initialState = {
      state: EditableSetup({
        uuid: SetupUuid("setup-uuid").unwrap(),
        danteEnabled: false,
        screens: [
          EditableScreen({
            uuid: ScreenUuid("segment-uuid").unwrap(),
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
      }).unwrap(),
      events: [],
    };

    const result = updateSetupAction(
      {
        user: AuditUser({
          uuid: "user-uuid",
          email: "user-email",
        }).unwrap(),
        setup: EditableSetup({
          uuid: SetupUuid("setup-uuid").unwrap(),
          danteEnabled: false,
          screens: [
            EditableScreen({
              uuid: ScreenUuid("segment-uuid").unwrap(),
              height: ScreenHeight(200).unwrap(),
              segments: [
                {
                  uuid: SegmentUuid("segment-uuid").unwrap(),
                  width: SegmentWidth(100).unwrap(),
                  audioChannel: Option.None(),
                },
              ],
            }).unwrap(),
          ],
        }).unwrap(),
      },
      initialState
    );

    expect(result.unwrap().events.length).toBe(1);
    expect(result.unwrap().events[0].type).toBe(DomainEventType.ScreenUpdated);
  });

  it("should update Segment", () => {
    const initialState = {
      state: EditableSetup({
        uuid: SetupUuid("setup-uuid").unwrap(),
        danteEnabled: false,
        screens: [
          EditableScreen({
            uuid: ScreenUuid("segment-uuid").unwrap(),
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
      }).unwrap(),
      events: [],
    };

    const result = updateSetupAction(
      {
        user: AuditUser({
          uuid: "user-uuid",
          email: "user-email",
        }).unwrap(),
        setup: EditableSetup({
          uuid: SetupUuid("setup-uuid").unwrap(),
          danteEnabled: false,
          screens: [
            EditableScreen({
              uuid: ScreenUuid("segment-uuid").unwrap(),
              height: ScreenHeight(100).unwrap(),
              segments: [
                {
                  uuid: SegmentUuid("segment-uuid").unwrap(),
                  width: SegmentWidth(200).unwrap(),
                  audioChannel: Option.None(),
                },
              ],
            }).unwrap(),
          ],
        }).unwrap(),
      },
      initialState
    );

    expect(result.unwrap().events.length).toBe(1);
    expect(result.unwrap().events[0].type).toBe(DomainEventType.SegmentUpdated);
  });

  it("should delete Segment", () => {
    const initialState = {
      state: EditableSetup({
        uuid: SetupUuid("setup-uuid").unwrap(),
        danteEnabled: false,
        screens: [
          EditableScreen({
            uuid: ScreenUuid("segment-uuid").unwrap(),
            height: ScreenHeight(100).unwrap(),
            segments: [
              {
                uuid: SegmentUuid("segment-uuid").unwrap(),
                width: SegmentWidth(100).unwrap(),
                audioChannel: Option.None(),
              },
              {
                uuid: SegmentUuid("segment-uuid2").unwrap(),
                width: SegmentWidth(100).unwrap(),
                audioChannel: Option.None(),
              },
            ],
          }).unwrap(),
        ],
      }).unwrap(),
      events: [],
    };

    const result = updateSetupAction(
      {
        user: AuditUser({
          uuid: "user-uuid",
          email: "user-email",
        }).unwrap(),
        setup: EditableSetup({
          uuid: SetupUuid("setup-uuid").unwrap(),
          danteEnabled: false,
          screens: [
            EditableScreen({
              uuid: ScreenUuid("segment-uuid").unwrap(),
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
        }).unwrap(),
      },
      initialState
    );

    expect(result.unwrap().events.length).toBe(1);
    expect(result.unwrap().events[0].type).toBe(DomainEventType.SegmentRemoved);
  });

  it("should delete Screen", () => {
    const initialState = {
      state: EditableSetup({
        uuid: SetupUuid("setup-uuid").unwrap(),
        danteEnabled: false,
        screens: [
          EditableScreen({
            uuid: ScreenUuid("segment-uuid").unwrap(),
            height: ScreenHeight(100).unwrap(),
            segments: [
              {
                uuid: SegmentUuid("segment-uuid").unwrap(),
                width: SegmentWidth(100).unwrap(),
                audioChannel: Option.None(),
              },
            ],
          }).unwrap(),
          EditableScreen({
            uuid: ScreenUuid("segment-uuid2").unwrap(),
            height: ScreenHeight(100).unwrap(),
            segments: [
              {
                uuid: SegmentUuid("segment-uuid2").unwrap(),
                width: SegmentWidth(100).unwrap(),
                audioChannel: Option.None(),
              },
            ],
          }).unwrap(),
        ],
      }).unwrap(),
      events: [],
    };

    const result = updateSetupAction(
      {
        user: AuditUser({
          uuid: "user-uuid",
          email: "user-email",
        }).unwrap(),
        setup: EditableSetup({
          uuid: SetupUuid("setup-uuid").unwrap(),
          danteEnabled: false,
          screens: [
            EditableScreen({
              uuid: ScreenUuid("segment-uuid").unwrap(),
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
        }).unwrap(),
      },
      initialState
    );

    expect(result.unwrap().events.length).toBe(1);
    expect(result.unwrap().events[0].type).toBe(DomainEventType.ScreenRemoved);
  });

  it("should add Segment", () => {
    const initialState = {
      state: EditableSetup({
        uuid: SetupUuid("setup-uuid").unwrap(),
        danteEnabled: false,
        screens: [
          EditableScreen({
            uuid: ScreenUuid("segment-uuid").unwrap(),
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
      }).unwrap(),
      events: [],
    };

    const result = updateSetupAction(
      {
        user: AuditUser({
          uuid: "user-uuid",
          email: "user-email",
        }).unwrap(),
        setup: EditableSetup({
          uuid: SetupUuid("setup-uuid").unwrap(),
          danteEnabled: false,
          screens: [
            EditableScreen({
              uuid: ScreenUuid("segment-uuid").unwrap(),
              height: ScreenHeight(100).unwrap(),
              segments: [
                {
                  uuid: SegmentUuid("segment-uuid").unwrap(),
                  width: SegmentWidth(100).unwrap(),
                  audioChannel: Option.None(),
                },
                {
                  uuid: SegmentUuid("segment-uuid2").unwrap(),
                  width: SegmentWidth(100).unwrap(),
                  audioChannel: Option.None(),
                },
              ],
            }).unwrap(),
          ],
        }).unwrap(),
      },
      initialState
    );

    expect(result.unwrap().events.length).toBe(1);
    expect(result.unwrap().events[0].type).toBe(DomainEventType.SegmentAdded);
  });

  it("should add Screen", () => {
    const initialState = {
      state: EditableSetup({
        uuid: SetupUuid("setup-uuid").unwrap(),
        danteEnabled: false,
        screens: [
          EditableScreen({
            uuid: ScreenUuid("segment-uuid").unwrap(),
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
      }).unwrap(),
      events: [],
    };

    const result = updateSetupAction(
      {
        user: AuditUser({
          uuid: "user-uuid",
          email: "user-email",
        }).unwrap(),
        setup: EditableSetup({
          uuid: SetupUuid("setup-uuid").unwrap(),
          danteEnabled: false,
          screens: [
            EditableScreen({
              uuid: ScreenUuid("segment-uuid").unwrap(),
              height: ScreenHeight(100).unwrap(),
              segments: [
                {
                  uuid: SegmentUuid("segment-uuid").unwrap(),
                  width: SegmentWidth(100).unwrap(),
                  audioChannel: Option.None(),
                },
              ],
            }).unwrap(),
            EditableScreen({
              uuid: ScreenUuid("segment-uuid2").unwrap(),
              height: ScreenHeight(100).unwrap(),
              segments: [
                {
                  uuid: SegmentUuid("segment-uuid2").unwrap(),
                  width: SegmentWidth(100).unwrap(),
                  audioChannel: Option.None(),
                },
              ],
            }).unwrap(),
          ],
        }).unwrap(),
      },
      initialState
    );

    expect(result.unwrap().events.length).toBe(1);
    expect(result.unwrap().events[0].type).toBe(DomainEventType.ScreenAdded);
  });
});

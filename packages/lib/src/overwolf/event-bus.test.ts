import { EventBus, MESSAGES } from "./event-bus";

describe("EventBus", () => {
  it("replays the latest value of each message to a listener that attaches late", () => {
    const bus = new EventBus();
    // The unified plugin reports the admin error once; the overlay window opens later.
    bus.trigger(MESSAGES.PLAYER_ERROR, "Please run as administrator");
    bus.trigger(MESSAGES.PLAYER, { x: 1, y: 2 });
    bus.trigger(MESSAGES.PLAYER, { x: 3, y: 4 });

    const seen: Array<[string, unknown]> = [];
    bus.addListener((name, value) => seen.push([name, value]));

    expect(seen).toEqual([
      [MESSAGES.PLAYER_ERROR, "Please run as administrator"],
      [MESSAGES.PLAYER, { x: 3, y: 4 }],
    ]);
  });

  it("replays a cleared error as null, so a recovered state is not shown as an error", () => {
    const bus = new EventBus();
    bus.trigger(MESSAGES.PLAYER_ERROR, "Please run as administrator");
    bus.trigger(MESSAGES.PLAYER_ERROR, null);

    const listener = jest.fn();
    bus.addListener(listener);
    expect(listener).toHaveBeenCalledWith(MESSAGES.PLAYER_ERROR, null);
  });

  it("still delivers live messages to every listener", () => {
    const bus = new EventBus();
    const a = jest.fn();
    const b = jest.fn();
    bus.addListener(a);
    bus.addListener(b);
    bus.trigger(MESSAGES.ACTORS, []);
    expect(a).toHaveBeenCalledWith(MESSAGES.ACTORS, []);
    expect(b).toHaveBeenCalledWith(MESSAGES.ACTORS, []);
    bus.removeListener(a);
    bus.trigger(MESSAGES.ACTORS, [1]);
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(2);
  });
});

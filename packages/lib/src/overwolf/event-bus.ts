declare global {
  interface Window {
    gameEventBus: EventBus;
  }
}

export const MESSAGES = {
  PLAYER: "player",
  PLAYER_ERROR: "player_error",
  ACTORS: "actors",
  CHARACTER: "character",
  DUNGEON_NAVMESH: "dungeon_navmesh",
};
// Every message is STATE (the latest value replaces the previous one), so a listener that
// attaches late - a window opened after the plugin already reported - gets the current value
// replayed. The unified THGL plugin only emits on change (one "Please run as administrator",
// one player while standing still), unlike the legacy 250 ms re-trigger loop, so without the
// replay a later-opened overlay never showed the admin error.
export class EventBus {
  private _listeners: Array<(eventName: string, eventValue: any) => void>;
  private _latest = new Map<string, any>();

  constructor() {
    this._listeners = [];
  }

  addListener(
    eventHandler: (eventName: string, eventValue: any) => void,
  ): void {
    this._listeners.push(eventHandler);
    this._latest.forEach((value, name) => eventHandler(name, value));
  }

  removeListener(
    eventHandler: (eventName: string, eventValue: any) => void,
  ): void {
    const index = this._listeners.indexOf(eventHandler);

    if (index > -1) {
      this._listeners.splice(index, 1);
    }
  }

  trigger(eventName: string, eventValue: any): void {
    this._latest.set(eventName, eventValue);
    this._listeners.forEach((listener) => listener(eventName, eventValue));
  }
}

export class EventBus {
  private _listeners: Array<(eventName: string, eventValue: any) => void>;

  constructor() {
    this._listeners = [];
  }

  addListener(
    eventHandler: (eventName: string, eventValue: any) => void,
  ): void {
    this._listeners.push(eventHandler);
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
    this._listeners.forEach((listener) =>
      listener(eventName, JSON.stringify(eventValue)),
    );
  }
}

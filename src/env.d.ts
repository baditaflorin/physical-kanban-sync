/// <reference types="vite/client" />

declare const __APP_VERSION__: string;
declare const __APP_COMMIT__: string;
declare const __APP_BUILD_TIME__: string;

interface Navigator {
  gpu?: unknown;
}

declare module "y-webrtc" {
  import type * as Y from "yjs";

  export class WebrtcProvider {
    awareness: {
      setLocalStateField(field: string, value: unknown): void;
      getStates(): Map<number, unknown>;
      on(eventName: string, callback: () => void): void;
      off(eventName: string, callback: () => void): void;
    };

    constructor(roomName: string, doc: Y.Doc, options?: Record<string, unknown>);
    on(eventName: string, callback: (event: { status: string }) => void): void;
    off(eventName: string, callback: (event: { status: string }) => void): void;
    destroy(): void;
  }
}

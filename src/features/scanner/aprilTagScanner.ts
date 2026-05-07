import type { WallDetection } from "../board/boardTypes";

type PendingRequest = {
  resolve: (detections: WallDetection[]) => void;
  reject: (error: Error) => void;
};

type WorkerMessage =
  | { id: number; type: "ready" }
  | { id: number; type: "detections"; detections: WallDetection[] }
  | { id: number; type: "error"; message: string };

export class BrowserAprilTagScanner {
  private worker: Worker;
  private pending = new Map<number, PendingRequest>();
  private sequence = 0;
  private ready: Promise<void>;

  constructor(baseUrl: string) {
    this.worker = new Worker(`${baseUrl}scanner.worker.js`);
    this.worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      this.handleMessage(event.data);
    };
    this.ready = this.initialize(baseUrl);
  }

  async detect(grayscale: Uint8Array, width: number, height: number) {
    await this.ready;
    const id = this.nextId();

    return new Promise<WallDetection[]>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.worker.postMessage(
        {
          id,
          type: "detect",
          payload: {
            grayscale: grayscale.buffer,
            width,
            height,
          },
        },
        [grayscale.buffer],
      );
    });
  }

  destroy() {
    this.pending.forEach(({ reject }) =>
      reject(new Error("Scanner worker was stopped.")),
    );
    this.pending.clear();
    this.worker.terminate();
  }

  private initialize(baseUrl: string) {
    const id = this.nextId();
    return new Promise<void>((resolve, reject) => {
      this.pending.set(id, {
        resolve: () => resolve(),
        reject,
      });
      this.worker.postMessage({
        id,
        type: "init",
        payload: { baseUrl },
      });
    });
  }

  private handleMessage(message: WorkerMessage) {
    const request = this.pending.get(message.id);
    if (!request) return;

    this.pending.delete(message.id);
    if (message.type === "error") {
      request.reject(new Error(message.message));
      return;
    }

    if (message.type === "detections") {
      request.resolve(message.detections);
      return;
    }

    request.resolve([]);
  }

  private nextId() {
    this.sequence += 1;
    return this.sequence;
  }
}

export function captureVideoFrame(video: HTMLVideoElement, maxWidth = 640) {
  const sourceWidth = video.videoWidth || maxWidth;
  const sourceHeight = video.videoHeight || Math.round(maxWidth * 0.75);
  const scale = Math.min(1, maxWidth / sourceWidth);
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    throw new Error("Could not read camera frame.");
  }

  context.drawImage(video, 0, 0, width, height);
  const rgba = context.getImageData(0, 0, width, height).data;
  const grayscale = new Uint8Array(width * height);

  for (let rgbaIndex = 0, grayIndex = 0; rgbaIndex < rgba.length; rgbaIndex += 4) {
    grayscale[grayIndex] = Math.round(
      rgba[rgbaIndex] * 0.299 +
        rgba[rgbaIndex + 1] * 0.587 +
        rgba[rgbaIndex + 2] * 0.114,
    );
    grayIndex += 1;
  }

  return { grayscale, width, height };
}

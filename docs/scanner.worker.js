let detectorPromise = null;
let detector = null;
let vendorBase = "";

self.onmessage = async (event) => {
  const { id, type, payload } = event.data;

  try {
    if (type === "init") {
      vendorBase = `${payload.baseUrl.replace(/\/?$/, "/")}vendor/apriltag/`;
      detectorPromise = createDetector();
      detector = await detectorPromise;
      self.postMessage({ id, type: "ready" });
      return;
    }

    if (type === "detect") {
      if (!detector) {
        detector = await detectorPromise;
      }

      const grayscale = new Uint8Array(payload.grayscale);
      const rawDetections = detector.detect(grayscale, payload.width, payload.height);
      const detections = rawDetections.map((detection) => ({
        tagId: detection.id,
        x: clamp01(detection.center.x / payload.width),
        y: clamp01(detection.center.y / payload.height),
        corners: detection.corners.map((corner) => ({
          x: clamp01(corner.x / payload.width),
          y: clamp01(corner.y / payload.height),
        })),
      }));

      self.postMessage({ id, type: "detections", detections });
    }
  } catch (error) {
    self.postMessage({
      id,
      type: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function createDetector() {
  if (typeof AprilTagWasm === "undefined") {
    importScripts(`${vendorBase}apriltag_wasm.js`);
  }

  return new Promise((resolve, reject) => {
    const detectorInstance = new AprilTagDetector({
      locateFile: (path) => `${vendorBase}${path}`,
      onReady: () => resolve(detectorInstance),
      onError: reject,
    });
  });
}

class AprilTagDetector {
  constructor({ locateFile, onReady, onError }) {
    this.module = null;
    this.imgBuffer = 0;

    AprilTagWasm({ locateFile })
      .then((module) => {
        this.module = module;
        this.init = module.cwrap("atagjs_init", "number", []);
        this.destroy = module.cwrap("atagjs_destroy", "number", []);
        this.setDetectorOptions = module.cwrap(
          "atagjs_set_detector_options",
          "number",
          ["number", "number", "number", "number", "number", "number", "number"],
        );
        this.setImageBuffer = module.cwrap("atagjs_set_img_buffer", "number", [
          "number",
          "number",
          "number",
        ]);
        this.detectTags = module.cwrap("atagjs_detect", "number", []);

        this.init();
        this.setDetectorOptions(2.0, 0.0, 1, 1, 0, 0, 0);
        onReady();
      })
      .catch(onError);
  }

  detect(grayscaleImg, width, height) {
    this.imgBuffer = this.setImageBuffer(width, height, width);
    if (width * height < grayscaleImg.length) {
      throw new Error("Image data is larger than the configured AprilTag frame.");
    }

    this.module.HEAPU8.set(grayscaleImg, this.imgBuffer);
    const resultPtr = this.detectTags();
    const jsonLength = this.module.getValue(resultPtr, "i32");
    if (jsonLength === 0) return [];

    const jsonPtr = this.module.getValue(resultPtr + 4, "i32");
    const bytes = new Uint8Array(this.module.HEAP8.buffer, jsonPtr, jsonLength);
    let json = "";
    for (let index = 0; index < jsonLength; index += 1) {
      json += String.fromCharCode(bytes[index]);
    }

    return JSON.parse(json);
  }
}

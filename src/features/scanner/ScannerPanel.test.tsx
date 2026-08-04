import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSeedBoard } from "../board/boardTypes";
import { ScannerPanel } from "./ScannerPanel";

// The AprilTag worker wrapper talks to a real Worker and WASM module, both
// unavailable in jsdom. Stub it so the test can control exactly when a scan
// succeeds or fails, which is what triggers the camera-leak bug below.
const detectMock = vi.fn();
const destroyMock = vi.fn();
vi.mock("./aprilTagScanner", async () => {
  const actual =
    await vi.importActual<typeof import("./aprilTagScanner")>("./aprilTagScanner");
  return {
    ...actual,
    BrowserAprilTagScanner: function MockScanner() {
      return { detect: detectMock, destroy: destroyMock };
    },
  };
});

function makeStream() {
  const track = { stop: vi.fn() };
  const stream = { getTracks: () => [track] } as unknown as MediaStream;
  return { stream, track };
}

describe("ScannerPanel camera lifecycle", () => {
  let getUserMediaMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    detectMock.mockReset();
    destroyMock.mockReset();
    getUserMediaMock = vi.fn();
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: getUserMediaMock },
      configurable: true,
    });
    // jsdom's HTMLMediaElement has no real playback pipeline.
    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("releases the camera stream when a scan fails instead of leaving it running", async () => {
    const first = makeStream();
    getUserMediaMock.mockResolvedValueOnce(first.stream);
    // Every detect() call fails, simulating a worker/WASM crash mid-session.
    detectMock.mockRejectedValue(new Error("worker crashed"));

    const { container } = render(
      <ScannerPanel
        board={createSeedBoard()}
        onBoardChange={() => {}}
        onDetections={() => {}}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByTitle("Start camera"));
      // Let the getUserMedia + video.play() microtasks resolve.
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(screen.getByText("Scanning")).toBeInTheDocument();

    // jsdom's <video> never actually loads media, so readyState stays at
    // HAVE_NOTHING (0) and scanFrame()'s readiness guard would otherwise
    // skip every scan. Force it into a "frame available" state, matching a
    // real live camera feed.
    const video = container.querySelector("video");
    if (!video) throw new Error("video element not found");
    Object.defineProperty(video, "readyState", {
      value: HTMLMediaElement.HAVE_CURRENT_DATA,
      configurable: true,
    });

    // Trigger scanFrame() directly via the "Frame" button rather than
    // waiting on the 850ms interval, and give its detect() rejection a
    // chance to propagate through the component's catch block.
    await act(async () => {
      fireEvent.click(screen.getByTitle("Scan one frame"));
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    // Regression: previously the catch-block in scanFrame only set an error
    // message and never called stopCamera(), so the MediaStream's track was
    // never stopped even though the button reverted to "Start camera".
    expect(first.track.stop).toHaveBeenCalled();
    expect(destroyMock).toHaveBeenCalled();
    expect(screen.getByTitle("Start camera")).toBeInTheDocument();

    // Clicking "Camera" again (as a user would after seeing the error)
    // must not pile a second live stream on top of an already-leaked first
    // one.
    const second = makeStream();
    getUserMediaMock.mockResolvedValueOnce(second.stream);
    detectMock.mockResolvedValue([]);
    await act(async () => {
      fireEvent.click(screen.getByTitle("Start camera"));
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(screen.getByText("Scanning")).toBeInTheDocument();

    expect(getUserMediaMock).toHaveBeenCalledTimes(2);
    // The first stream's track must already have been released by the time
    // the second session starts — not still hot in the background.
    expect(first.track.stop).toHaveBeenCalledTimes(1);
  });
});

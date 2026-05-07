import { Camera, ScanLine, SquareMousePointer, StopCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { BoardState, WallDetection } from "../board/boardTypes";
import { simulateWallPan } from "../board/boardLogic";
import { BrowserAprilTagScanner, captureVideoFrame } from "./aprilTagScanner";

type ScannerPanelProps = {
  board: BoardState;
  onBoardChange: (board: BoardState) => void;
  onDetections: (detections: WallDetection[]) => void;
};

type ScannerState = "idle" | "starting" | "running" | "error";

export function ScannerPanel({
  board,
  onBoardChange,
  onDetections,
}: ScannerPanelProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<BrowserAprilTagScanner | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);
  const [scannerState, setScannerState] = useState<ScannerState>("idle");
  const [message, setMessage] = useState("Camera idle");
  const [lastDetections, setLastDetections] = useState<WallDetection[]>([]);

  useEffect(() => stopCamera, []);

  async function startCamera() {
    setScannerState("starting");
    setMessage("Opening camera");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      scannerRef.current = new BrowserAprilTagScanner(import.meta.env.BASE_URL);
      intervalRef.current = window.setInterval(scanFrame, 850);
      setScannerState("running");
      setMessage("Scanning");
    } catch (error) {
      stopCamera();
      setScannerState("error");
      setMessage(error instanceof Error ? error.message : "Camera unavailable");
    }
  }

  function stopCamera() {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    scannerRef.current?.destroy();
    scannerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setScannerState("idle");
  }

  async function scanFrame() {
    if (!videoRef.current || !scannerRef.current) return;
    if (videoRef.current.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;

    try {
      const frame = captureVideoFrame(videoRef.current);
      const detections = await scannerRef.current.detect(
        frame.grayscale,
        frame.width,
        frame.height,
      );
      setLastDetections(detections);
      setMessage(`${detections.length} tags`);
      if (detections.length > 0) {
        onDetections(detections);
      }
    } catch (error) {
      setScannerState("error");
      setMessage(error instanceof Error ? error.message : "Scanner failed");
    }
  }

  function simulateScan() {
    const nextBoard = simulateWallPan(board);
    setLastDetections(
      nextBoard.cards.map((card) => ({
        tagId: card.tagId,
        x: card.x,
        y: card.y,
      })),
    );
    setMessage(`${nextBoard.cards.length} tags`);
    onBoardChange(nextBoard);
  }

  const running = scannerState === "running" || scannerState === "starting";

  return (
    <section className="panel" aria-labelledby="scanner-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">AprilTag</p>
          <h2 id="scanner-title">Wall Scan</h2>
        </div>
        <span className={`status-pill status-${scannerState}`}>{message}</span>
      </div>

      <div className="camera-frame">
        <video ref={videoRef} muted playsInline aria-label="Wall camera preview" />
        {lastDetections.map((detection) => (
          <span
            className="detection-dot"
            key={detection.tagId}
            style={{
              left: `${detection.x * 100}%`,
              top: `${detection.y * 100}%`,
            }}
            title={`Tag ${detection.tagId}`}
          >
            {detection.tagId}
          </span>
        ))}
      </div>

      <div className="button-row">
        <button
          className="icon-button primary"
          type="button"
          onClick={running ? stopCamera : startCamera}
          title={running ? "Stop camera" : "Start camera"}
        >
          {running ? <StopCircle size={18} /> : <Camera size={18} />}
          <span>{running ? "Stop" : "Camera"}</span>
        </button>
        <button
          className="icon-button"
          type="button"
          onClick={scanFrame}
          disabled={!running}
          title="Scan one frame"
        >
          <ScanLine size={18} />
          <span>Frame</span>
        </button>
        <button
          className="icon-button"
          type="button"
          onClick={simulateScan}
          data-testid="simulate-scan"
          title="Simulate wall pan"
        >
          <SquareMousePointer size={18} />
          <span>Simulate</span>
        </button>
      </div>
    </section>
  );
}

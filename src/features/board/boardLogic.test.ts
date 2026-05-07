import { describe, expect, it } from "vitest";
import { createSeedBoard } from "./boardTypes";
import {
  applyWallDetections,
  cardsForColumn,
  columnForX,
  simulateWallPan,
} from "./boardLogic";

describe("boardLogic", () => {
  it("maps normalized x positions to Kanban columns", () => {
    expect(columnForX(0)).toBe("todo");
    expect(columnForX(0.26)).toBe("doing");
    expect(columnForX(0.51)).toBe("review");
    expect(columnForX(0.99)).toBe("done");
  });

  it("updates card columns and scan metadata from wall detections", () => {
    const board = createSeedBoard();
    const updated = applyWallDetections(
      board,
      [
        { tagId: 1, x: 0.83, y: 0.4 },
        { tagId: 99, x: 0.1, y: 0.2 },
      ],
      "2026-05-08T00:00:00.000Z",
    );

    expect(updated.cards.find((card) => card.tagId === 1)?.columnId).toBe("done");
    expect(updated.cards.find((card) => card.tagId === 99)?.columnId).toBe("todo");
    expect(updated.calibration.lastDetectionCount).toBe(2);
  });

  it("keeps simulated pan deterministic enough for smoke tests", () => {
    const board = createSeedBoard();
    const simulated = simulateWallPan(board, "2026-05-08T00:00:00.000Z");

    expect(simulated.cards).toHaveLength(board.cards.length);
    expect(cardsForColumn(simulated, "todo").length).toBeGreaterThan(0);
    expect(simulated.calibration.lastScanAt).toBe("2026-05-08T00:00:00.000Z");
  });
});

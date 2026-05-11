import { describe, expect, it } from "vitest";
import { createSeedBoard } from "./boardTypes";
import {
  applyWallDetections,
  calibrateBoundariesFromCards,
  cardsForColumn,
  columnForX,
  setColumnBoundaries,
  simulateWallPan,
} from "./boardLogic";

describe("boardLogic", () => {
  it("maps normalized x positions to Kanban columns", () => {
    expect(columnForX(0)).toBe("todo");
    expect(columnForX(0.26)).toBe("doing");
    expect(columnForX(0.51)).toBe("review");
    expect(columnForX(0.99)).toBe("done");
  });

  it("honors custom column boundaries on a calibrated wall", () => {
    const boundaries: [number, number, number] = [0.15, 0.4, 0.85];
    expect(columnForX(0.1, boundaries)).toBe("todo");
    expect(columnForX(0.3, boundaries)).toBe("doing");
    expect(columnForX(0.7, boundaries)).toBe("review");
    expect(columnForX(0.9, boundaries)).toBe("done");
  });

  it("sorts incoming boundaries before applying them", () => {
    // Boundaries are intentionally given out-of-order; the helper must still
    // produce a valid sorted layout.
    const next = setColumnBoundaries(createSeedBoard(), [0.7, 0.3, 0.5]);
    expect(next.calibration.columnBoundaries).toEqual([0.3, 0.5, 0.7]);
  });

  it("reflows cards onto the new column layout when boundaries change", () => {
    const board = createSeedBoard();
    // Shrink the "Done" column to anything past 0.95 — most existing seed
    // cards in "Done" should slide back into "Review" because their x values
    // are around 0.86 and 0.91.
    const next = setColumnBoundaries(board, [0.25, 0.5, 0.95]);
    const doneCards = cardsForColumn(next, "done");
    expect(doneCards.length).toBe(0);
    const reviewCards = cardsForColumn(next, "review");
    expect(reviewCards.length).toBeGreaterThan(0);
  });

  it("derives calibration boundaries from existing card layout", () => {
    const board = createSeedBoard();
    const calibrated = calibrateBoundariesFromCards(board);
    expect(calibrated[0]).toBeGreaterThan(0);
    expect(calibrated[0]).toBeLessThan(calibrated[1]);
    expect(calibrated[1]).toBeLessThan(calibrated[2]);
    expect(calibrated[2]).toBeLessThan(1);
  });

  it("routes wall detections through the board's calibration", () => {
    const board = setColumnBoundaries(createSeedBoard(), [0.4, 0.55, 0.85]);
    const updated = applyWallDetections(
      board,
      [{ tagId: 42, x: 0.5, y: 0.3 }],
      "2026-05-08T00:00:00.000Z",
    );
    // x=0.5 lands inside [0.4, 0.55), which is the "doing" column once we
    // calibrated the wall — under the old equal-quarter logic it would have
    // landed in "review" instead.
    expect(updated.cards.find((card) => card.tagId === 42)?.columnId).toBe("doing");
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

import { z } from "zod";

export const BOARD_SCHEMA_VERSION = "physical-kanban-board-v1";

export const columnIds = ["todo", "doing", "review", "done"] as const;
export type ColumnId = (typeof columnIds)[number];

export const noteColors = ["yellow", "pink", "mint", "blue", "orange"] as const;
export type NoteColor = (typeof noteColors)[number];

export const columnSchema = z.object({
  id: z.enum(columnIds),
  title: z.string().min(1),
});

export const cardSchema = z.object({
  id: z.string().min(1),
  tagId: z.number().int().min(0),
  title: z.string().min(1),
  description: z.string(),
  columnId: z.enum(columnIds),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  color: z.enum(noteColors),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// columnBoundaries: three breakpoints in [0, 1] that split the wall into
// four Kanban columns. Defaults to equal quarters. Real walls rarely have
// equal-width lanes (a "Done" column shrinks under tape, the "Doing" lane
// widens to absorb in-progress notes) so this must be calibratable.
export const calibrationSchema = z.object({
  wallName: z.string(),
  lastScanAt: z.string().datetime().optional(),
  lastDetectionCount: z.number().int().min(0),
  columnBoundaries: z
    .tuple([
      z.number().min(0).max(1),
      z.number().min(0).max(1),
      z.number().min(0).max(1),
    ])
    .default([0.25, 0.5, 0.75]),
});

export const boardSchema = z.object({
  schemaVersion: z.literal(BOARD_SCHEMA_VERSION),
  boardId: z.string().min(1),
  title: z.string().min(1),
  columns: z.array(columnSchema).length(columnIds.length),
  cards: z.array(cardSchema),
  calibration: calibrationSchema,
  updatedAt: z.string().datetime(),
});

export type KanbanColumn = z.infer<typeof columnSchema>;
export type KanbanCard = z.infer<typeof cardSchema>;
export type BoardState = z.infer<typeof boardSchema>;

export type WallDetection = {
  tagId: number;
  x: number;
  y: number;
  corners?: Array<{ x: number; y: number }>;
};

export function parseBoardState(value: unknown): BoardState {
  return boardSchema.parse(value);
}

export function nowIso() {
  return new Date().toISOString();
}

export function createId(prefix: string) {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `${prefix}_${random}`;
}

export function createSeedBoard(): BoardState {
  const timestamp = nowIso();

  return {
    schemaVersion: BOARD_SCHEMA_VERSION,
    boardId: "local-wall",
    title: "Wall board",
    columns: [
      { id: "todo", title: "To do" },
      { id: "doing", title: "Doing" },
      { id: "review", title: "Review" },
      { id: "done", title: "Done" },
    ],
    cards: [
      seedCard(
        1,
        "Print tag kit",
        "Cut tag labels for each sticky.",
        "todo",
        0.09,
        0.18,
        "yellow",
        timestamp,
      ),
      seedCard(
        2,
        "Phone pan",
        "Scan the wall from left to right.",
        "todo",
        0.16,
        0.52,
        "pink",
        timestamp,
      ),
      seedCard(
        3,
        "Calibrate columns",
        "Map camera positions to workflow lanes.",
        "doing",
        0.34,
        0.32,
        "mint",
        timestamp,
      ),
      seedCard(
        4,
        "Remote sync",
        "Share a room code with teammates.",
        "doing",
        0.44,
        0.66,
        "blue",
        timestamp,
      ),
      seedCard(
        5,
        "LLM triage",
        "Summarize blockers locally with WebGPU.",
        "review",
        0.62,
        0.24,
        "orange",
        timestamp,
      ),
      seedCard(
        6,
        "Smoke test",
        "Verify the simulated scan path.",
        "review",
        0.7,
        0.7,
        "yellow",
        timestamp,
      ),
      seedCard(
        7,
        "Publish Pages",
        "Expose repo, PayPal, version, commit.",
        "done",
        0.86,
        0.3,
        "mint",
        timestamp,
      ),
      seedCard(
        8,
        "Postmortem",
        "Capture tradeoffs after v1.",
        "done",
        0.91,
        0.72,
        "blue",
        timestamp,
      ),
    ],
    calibration: {
      wallName: "Workshop wall",
      lastDetectionCount: 0,
      columnBoundaries: [0.25, 0.5, 0.75],
    },
    updatedAt: timestamp,
  };
}

function seedCard(
  tagId: number,
  title: string,
  description: string,
  columnId: ColumnId,
  x: number,
  y: number,
  color: NoteColor,
  timestamp: string,
): KanbanCard {
  return {
    id: `tag-${tagId}`,
    tagId,
    title,
    description,
    columnId,
    x,
    y,
    color,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

import {
  type BoardState,
  type ColumnId,
  type KanbanCard,
  type NoteColor,
  columnIds,
  createId,
  noteColors,
  nowIso,
  type WallDetection,
} from "./boardTypes";

export function columnForX(x: number): ColumnId {
  const normalized = clamp01(x);
  const index = Math.min(
    columnIds.length - 1,
    Math.floor(normalized * columnIds.length),
  );
  return columnIds[index];
}

export function applyWallDetections(
  board: BoardState,
  detections: WallDetection[],
  timestamp = nowIso(),
): BoardState {
  const cardsByTag = new Map(board.cards.map((card) => [card.tagId, card]));
  const nextCards = new Map(board.cards.map((card) => [card.id, card]));

  for (const detection of detections) {
    const existing = cardsByTag.get(detection.tagId);
    const columnId = columnForX(detection.x);

    if (existing) {
      nextCards.set(existing.id, {
        ...existing,
        columnId,
        x: clamp01(detection.x),
        y: clamp01(detection.y),
        updatedAt: timestamp,
      });
      continue;
    }

    const card = createCardFromTag(detection.tagId, columnId, detection, timestamp);
    nextCards.set(card.id, card);
    cardsByTag.set(card.tagId, card);
  }

  return {
    ...board,
    cards: sortCards(Array.from(nextCards.values())),
    calibration: {
      ...board.calibration,
      lastScanAt: timestamp,
      lastDetectionCount: detections.length,
    },
    updatedAt: timestamp,
  };
}

export function moveCardToColumn(
  board: BoardState,
  cardId: string,
  columnId: ColumnId,
  timestamp = nowIso(),
): BoardState {
  const targetCards = board.cards.filter((card) => card.columnId === columnId);
  const y = clamp01(Math.max(0.12, ...targetCards.map((card) => card.y)) + 0.08);

  return updateCard(
    board,
    cardId,
    {
      columnId,
      x: columnCenter(columnId),
      y,
    },
    timestamp,
  );
}

export function updateCard(
  board: BoardState,
  cardId: string,
  patch: Partial<
    Pick<KanbanCard, "title" | "description" | "columnId" | "x" | "y" | "color">
  >,
  timestamp = nowIso(),
): BoardState {
  return {
    ...board,
    cards: sortCards(
      board.cards.map((card) =>
        card.id === cardId
          ? {
              ...card,
              ...patch,
              x: patch.x === undefined ? card.x : clamp01(patch.x),
              y: patch.y === undefined ? card.y : clamp01(patch.y),
              updatedAt: timestamp,
            }
          : card,
      ),
    ),
    updatedAt: timestamp,
  };
}

export function addManualCard(board: BoardState, timestamp = nowIso()): BoardState {
  const tagId = nextTagId(board.cards);
  const color = noteColors[tagId % noteColors.length];
  const card = createCardFromTag(
    tagId,
    "todo",
    { tagId, x: 0.12, y: 0.2 + (tagId % 5) * 0.12 },
    timestamp,
    color,
  );

  return {
    ...board,
    cards: sortCards([...board.cards, card]),
    updatedAt: timestamp,
  };
}

export function removeCard(
  board: BoardState,
  cardId: string,
  timestamp = nowIso(),
): BoardState {
  return {
    ...board,
    cards: board.cards.filter((card) => card.id !== cardId),
    updatedAt: timestamp,
  };
}

export function simulateWallPan(board: BoardState, timestamp = nowIso()) {
  const detections = board.cards.map((card, index) => ({
    tagId: card.tagId,
    x: clamp01(columnCenter(card.columnId) + seededJitter(index, 0.035)),
    y: clamp01(0.14 + ((index * 0.19) % 0.74)),
  }));

  return applyWallDetections(board, detections, timestamp);
}

export function cardsForColumn(board: BoardState, columnId: ColumnId) {
  return board.cards
    .filter((card) => card.columnId === columnId)
    .sort((left, right) => left.y - right.y || left.tagId - right.tagId);
}

function createCardFromTag(
  tagId: number,
  columnId: ColumnId,
  detection: WallDetection,
  timestamp: string,
  color: NoteColor = noteColors[tagId % noteColors.length],
): KanbanCard {
  return {
    id: createId(`tag-${tagId}`),
    tagId,
    title: `Sticky #${tagId}`,
    description: "Captured from wall scan.",
    columnId,
    x: clamp01(detection.x),
    y: clamp01(detection.y),
    color,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function sortCards(cards: KanbanCard[]) {
  return [...cards].sort(
    (left, right) =>
      columnIds.indexOf(left.columnId) - columnIds.indexOf(right.columnId) ||
      left.y - right.y ||
      left.tagId - right.tagId,
  );
}

function nextTagId(cards: KanbanCard[]) {
  return Math.max(0, ...cards.map((card) => card.tagId)) + 1;
}

function columnCenter(columnId: ColumnId) {
  const index = columnIds.indexOf(columnId);
  return (index + 0.5) / columnIds.length;
}

function seededJitter(seed: number, magnitude: number) {
  const value = Math.sin(seed * 999 + 7) * 10000;
  return (value - Math.floor(value) - 0.5) * magnitude;
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

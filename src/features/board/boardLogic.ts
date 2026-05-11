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

export function columnForX(
  x: number,
  boundaries: readonly [number, number, number] = [0.25, 0.5, 0.75],
): ColumnId {
  const normalized = clamp01(x);
  const safe = sortedBoundaries(boundaries);
  for (let index = 0; index < safe.length; index += 1) {
    if (normalized < safe[index]) {
      return columnIds[index];
    }
  }
  return columnIds[columnIds.length - 1];
}

/**
 * Compute fresh column boundaries from the average x of cards already placed
 * in each column. Used after a user manually arranges a few cards to teach
 * the wall scanner where the actual column edges live.
 */
export function calibrateBoundariesFromCards(
  board: BoardState,
): [number, number, number] {
  const columnAverages = columnIds.map((columnId) => {
    const cards = board.cards.filter((card) => card.columnId === columnId);
    if (cards.length === 0) return null;
    const sum = cards.reduce((total, card) => total + card.x, 0);
    return sum / cards.length;
  });
  const next: [number, number, number] = [0.25, 0.5, 0.75];
  for (let index = 0; index < 3; index += 1) {
    const left = columnAverages[index];
    const right = columnAverages[index + 1];
    if (left !== null && right !== null) {
      next[index] = clamp01((left + right) / 2);
    }
  }
  // Force the boundaries into strict ascending order, never collapsing two
  // columns onto the same boundary (which would make one column unreachable).
  for (let index = 1; index < next.length; index += 1) {
    if (next[index] <= next[index - 1]) {
      next[index] = Math.min(1, next[index - 1] + 0.02);
    }
  }
  return next;
}

export function setColumnBoundaries(
  board: BoardState,
  boundaries: [number, number, number],
  timestamp = nowIso(),
): BoardState {
  const sorted = sortedBoundaries(boundaries);
  // Re-snap every existing card so a freshly calibrated wall reflows the
  // current placement on screen without needing another scan.
  const reflowed = board.cards.map((card) => {
    const columnId = columnForX(card.x, sorted);
    return columnId === card.columnId
      ? card
      : { ...card, columnId, updatedAt: timestamp };
  });
  return {
    ...board,
    cards: reflowed,
    calibration: {
      ...board.calibration,
      columnBoundaries: sorted,
    },
    updatedAt: timestamp,
  };
}

function sortedBoundaries(boundaries: readonly number[]): [number, number, number] {
  const safe = boundaries.slice(0, 3).map((value) => clamp01(value));
  safe.sort((a, b) => a - b);
  while (safe.length < 3) {
    safe.push(1);
  }
  return [safe[0] ?? 0.25, safe[1] ?? 0.5, safe[2] ?? 0.75];
}

export function applyWallDetections(
  board: BoardState,
  detections: WallDetection[],
  timestamp = nowIso(),
): BoardState {
  const cardsByTag = new Map(board.cards.map((card) => [card.tagId, card]));
  const nextCards = new Map(board.cards.map((card) => [card.id, card]));
  const boundaries = board.calibration.columnBoundaries;

  for (const detection of detections) {
    const existing = cardsByTag.get(detection.tagId);
    const columnId = columnForX(detection.x, boundaries);

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
      x: columnCenter(columnId, board.calibration.columnBoundaries),
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
  const boundaries = board.calibration.columnBoundaries;
  const detections = board.cards.map((card, index) => ({
    tagId: card.tagId,
    x: clamp01(columnCenter(card.columnId, boundaries) + seededJitter(index, 0.035)),
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

function columnCenter(
  columnId: ColumnId,
  boundaries: readonly [number, number, number] = [0.25, 0.5, 0.75],
) {
  const index = columnIds.indexOf(columnId);
  if (index === -1) return 0.5;
  const left = index === 0 ? 0 : boundaries[index - 1];
  const right = index === columnIds.length - 1 ? 1 : boundaries[index];
  return clamp01((left + right) / 2);
}

function seededJitter(seed: number, magnitude: number) {
  const value = Math.sin(seed * 999 + 7) * 10000;
  return (value - Math.floor(value) - 0.5) * magnitude;
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

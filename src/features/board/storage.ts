import { openDB } from "idb";
import { type BoardState, createSeedBoard, parseBoardState } from "./boardTypes";

const DB_NAME = "physical-kanban-sync";
const STORE_NAME = "boards";
const BOARD_KEY = "default";

type StoredBoard = {
  key: string;
  board: BoardState;
};

async function getDatabase() {
  return openDB<{
    boards: {
      key: string;
      value: StoredBoard;
    };
  }>(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE_NAME, { keyPath: "key" });
    },
  });
}

export async function loadBoard() {
  const db = await getDatabase();
  const stored = await db.get(STORE_NAME, BOARD_KEY);
  if (!stored) return createSeedBoard();
  return parseBoardState(stored.board);
}

export async function saveBoard(board: BoardState) {
  const db = await getDatabase();
  await db.put(STORE_NAME, { key: BOARD_KEY, board });
}

export async function clearBoard() {
  const db = await getDatabase();
  await db.delete(STORE_NAME, BOARD_KEY);
}

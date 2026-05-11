import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";
import { type BoardState, parseBoardState } from "../board/boardTypes";
import { loadSignalingUrls, refreshTurnCredentials } from "./meshConfig";

export type SyncStatus = {
  roomName: string;
  transport: "idle" | "connecting" | "connected" | "disconnected";
  peers: number;
};

export type SyncSession = {
  publish(board: BoardState): void;
  destroy(): void;
};

type SyncSessionOptions = {
  roomName: string;
  initialBoard: BoardState;
  onRemoteBoard: (board: BoardState) => void;
  onStatus: (status: SyncStatus) => void;
};

export async function createSyncSession({
  roomName,
  initialBoard,
  onRemoteBoard,
  onStatus,
}: SyncSessionOptions): Promise<SyncSession> {
  const doc = new Y.Doc();
  // Fetch fresh HMAC TURN credentials so peers behind symmetric NAT have
  // a working relay from first connect. Falls back to STUN-only on failure.
  const iceServers = await refreshTurnCredentials();
  const provider = new WebrtcProvider(roomName, doc, {
    signaling: loadSignalingUrls(),
    peerOpts: { config: { iceServers } },
  });
  const boardMap = doc.getMap<unknown>("board");
  let suppressRemote = false;

  provider.awareness.setLocalStateField("app", {
    name: "Physical Kanban Sync",
    boardId: initialBoard.boardId,
  });

  const emitStatus = (transport: SyncStatus["transport"]) => {
    onStatus({
      roomName,
      transport,
      peers: provider.awareness.getStates().size,
    });
  };

  const handleAwareness = () => emitStatus("connected");
  provider.awareness.on("change", handleAwareness);
  provider.on("status", (event) => {
    emitStatus(event.status === "connected" ? "connected" : "disconnected");
  });

  boardMap.observe(() => {
    if (suppressRemote) return;

    try {
      const remoteBoard = parseBoardState(boardMap.get("state"));
      onRemoteBoard(remoteBoard);
    } catch {
      emitStatus("disconnected");
    }
  });

  if (boardMap.has("state")) {
    try {
      onRemoteBoard(parseBoardState(boardMap.get("state")));
    } catch {
      publish(initialBoard);
    }
  } else {
    publish(initialBoard);
  }

  emitStatus("connecting");

  function publish(board: BoardState) {
    suppressRemote = true;
    boardMap.set("state", board);
    suppressRemote = false;
  }

  return {
    publish,
    destroy() {
      provider.awareness.off("change", handleAwareness);
      provider.destroy();
      doc.destroy();
      emitStatus("idle");
    },
  };
}

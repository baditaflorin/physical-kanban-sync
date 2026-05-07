import { Link2, RadioTower, Unplug } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { BoardState } from "../board/boardTypes";
import type { SyncSession, SyncStatus } from "./syncSession";

type SyncPanelProps = {
  board: BoardState;
  onRemoteBoard: (board: BoardState) => void;
};

const defaultStatus: SyncStatus = {
  roomName: "physical-kanban-sync-demo",
  transport: "idle",
  peers: 1,
};

export function SyncPanel({ board, onRemoteBoard }: SyncPanelProps) {
  const sessionRef = useRef<SyncSession | null>(null);
  const [roomName, setRoomName] = useState(defaultStatus.roomName);
  const [status, setStatus] = useState<SyncStatus>(defaultStatus);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    sessionRef.current?.publish(board);
  }, [board]);

  useEffect(
    () => () => {
      sessionRef.current?.destroy();
      sessionRef.current = null;
    },
    [],
  );

  async function connect() {
    setBusy(true);
    try {
      const { createSyncSession } = await import("./syncSession");
      sessionRef.current?.destroy();
      sessionRef.current = createSyncSession({
        roomName,
        initialBoard: board,
        onRemoteBoard,
        onStatus: setStatus,
      });
    } finally {
      setBusy(false);
    }
  }

  function disconnect() {
    sessionRef.current?.destroy();
    sessionRef.current = null;
    setStatus({ ...defaultStatus, roomName, transport: "idle" });
  }

  const connected = status.transport === "connected";
  const active = status.transport !== "idle";

  return (
    <section className="panel" aria-labelledby="sync-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Yjs WebRTC</p>
          <h2 id="sync-title">Room Sync</h2>
        </div>
        <span className={`status-pill sync-${status.transport}`}>
          {connected ? `${status.peers} peers` : status.transport}
        </span>
      </div>

      <label className="field-label" htmlFor="room-name">
        Room
      </label>
      <input
        className="text-input"
        id="room-name"
        value={roomName}
        onChange={(event) => setRoomName(event.target.value)}
      />

      <div className="button-row">
        <button
          className="icon-button primary"
          type="button"
          onClick={connect}
          disabled={busy || roomName.trim().length < 3}
          title="Join sync room"
        >
          {active ? <RadioTower size={18} /> : <Link2 size={18} />}
          <span>{busy ? "Joining" : "Join"}</span>
        </button>
        <button
          className="icon-button"
          type="button"
          onClick={disconnect}
          disabled={!active}
          title="Leave sync room"
        >
          <Unplug size={18} />
          <span>Leave</span>
        </button>
      </div>
    </section>
  );
}

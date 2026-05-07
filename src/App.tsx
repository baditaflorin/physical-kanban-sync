import { Download, HeartHandshake, Star, Upload, Wifi } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AssistantPanel } from "./features/assistant/AssistantPanel";
import { KanbanBoard } from "./features/board/KanbanBoard";
import {
  type BoardState,
  createSeedBoard,
  parseBoardState,
  type WallDetection,
} from "./features/board/boardTypes";
import { applyWallDetections } from "./features/board/boardLogic";
import { clearBoard, loadBoard, saveBoard } from "./features/board/storage";
import { ScannerPanel } from "./features/scanner/ScannerPanel";
import { TagSheet } from "./features/scanner/TagSheet";
import { SyncPanel } from "./features/sync/SyncPanel";
import {
  APP_BUILD_TIME,
  APP_COMMIT,
  APP_VERSION,
  LIVE_URL,
  PAYPAL_URL,
  REPOSITORY_URL,
} from "./features/meta/meta";

const queryClient = new QueryClient();

export function App() {
  const [board, setBoard] = useState<BoardState>(() => createSeedBoard());
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState("Loading");
  const [toast, setToast] = useState("");
  const hydratedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let active = true;
    loadBoard()
      .then((storedBoard) => {
        if (!active) return;
        setBoard(storedBoard);
        setSaveStatus("Saved locally");
      })
      .catch((error) => {
        if (!active) return;
        setToast(error instanceof Error ? error.message : "Storage failed");
        setBoard(createSeedBoard());
        setSaveStatus("Using seed board");
      })
      .finally(() => {
        if (!active) return;
        hydratedRef.current = true;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;

    setSaveStatus("Saving");
    const timeout = window.setTimeout(() => {
      saveBoard(board)
        .then(() => setSaveStatus("Saved locally"))
        .catch((error) => {
          setSaveStatus("Save failed");
          setToast(error instanceof Error ? error.message : "Save failed");
        });
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [board]);

  function handleDetections(detections: WallDetection[]) {
    setBoard((current) => applyWallDetections(current, detections));
  }

  async function resetBoard() {
    await clearBoard();
    const seed = createSeedBoard();
    setBoard(seed);
    setToast("Board reset");
  }

  function exportBoard() {
    const blob = new Blob([JSON.stringify(board, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "physical-kanban-board.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function importBoard(file: File | undefined) {
    if (!file) return;
    try {
      const parsed = parseBoardState(JSON.parse(await file.text()));
      setBoard(parsed);
      setToast("Board imported");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Import failed");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <main className="app-shell">
          <header className="app-header">
            <div>
              <p className="eyebrow">Physical Kanban Sync</p>
              <h1>Wall to Web</h1>
            </div>

            <nav aria-label="Project links" className="header-links">
              <a href={LIVE_URL}>
                <Wifi size={18} />
                Live
              </a>
              <a href={REPOSITORY_URL}>
                <Star size={18} />
                Star repo
              </a>
              <a href={PAYPAL_URL}>
                <HeartHandshake size={18} />
                PayPal
              </a>
            </nav>
          </header>

          <section className="meta-strip" aria-label="Build metadata">
            <span>v{APP_VERSION}</span>
            <span data-testid="commit">commit {APP_COMMIT}</span>
            <span>{saveStatus}</span>
            <time dateTime={APP_BUILD_TIME}>
              built {new Date(APP_BUILD_TIME).toLocaleDateString()}
            </time>
          </section>

          <div className="workspace-layout">
            <KanbanBoard board={board} onBoardChange={setBoard} onReset={resetBoard} />

            <aside className="side-rail" aria-label="Board tools">
              <ScannerPanel
                board={board}
                onBoardChange={setBoard}
                onDetections={handleDetections}
              />
              <SyncPanel board={board} onRemoteBoard={setBoard} />
              <section className="panel" aria-labelledby="backup-title">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">JSON</p>
                    <h2 id="backup-title">Backup</h2>
                  </div>
                </div>
                <div className="button-row">
                  <button
                    className="icon-button primary"
                    type="button"
                    onClick={exportBoard}
                    title="Export board"
                  >
                    <Download size={18} />
                    <span>Export</span>
                  </button>
                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Import board"
                  >
                    <Upload size={18} />
                    <span>Import</span>
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  className="sr-only"
                  type="file"
                  accept="application/json"
                  onChange={(event) => importBoard(event.currentTarget.files?.[0])}
                />
              </section>
              <AssistantPanel board={board} />
              <TagSheet cards={board.cards} />
            </aside>
          </div>

          {loading ? <div className="loading-scrim">Loading board</div> : null}
          {toast ? (
            <button className="toast" type="button" onClick={() => setToast("")}>
              {toast}
            </button>
          ) : null}
        </main>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

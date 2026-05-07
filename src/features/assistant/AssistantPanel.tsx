import { BrainCircuit, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import type { BoardState } from "../board/boardTypes";
import { createRuleBasedSummary, runWebGpuSummary } from "./localAssistant";

type AssistantPanelProps = {
  board: BoardState;
};

export function AssistantPanel({ board }: AssistantPanelProps) {
  const fallbackSummary = useMemo(() => createRuleBasedSummary(board), [board]);
  const [summary, setSummary] = useState(fallbackSummary);
  const [progress, setProgress] = useState("");
  const [busy, setBusy] = useState(false);

  async function runAssistant() {
    setBusy(true);
    setProgress("Starting");
    try {
      const result = await runWebGpuSummary(board, ({ text, progress }) => {
        const percent = progress === undefined ? "" : ` ${Math.round(progress * 100)}%`;
        setProgress(`${text}${percent}`);
      });
      setSummary(result);
      setProgress("Ready");
    } catch (error) {
      setSummary(fallbackSummary);
      setProgress(error instanceof Error ? error.message : "Assistant unavailable");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel" aria-labelledby="assistant-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">WebGPU</p>
          <h2 id="assistant-title">Local LLM</h2>
        </div>
        <BrainCircuit size={22} aria-hidden="true" />
      </div>

      <pre className="assistant-output">{summary}</pre>
      <div className="button-row">
        <button
          className="icon-button primary"
          type="button"
          onClick={runAssistant}
          disabled={busy}
          title="Run local assistant"
        >
          <Sparkles size={18} />
          <span>{busy ? "Running" : "Assist"}</span>
        </button>
        <span className="subtle-status">{progress || "Rule summary"}</span>
      </div>
    </section>
  );
}

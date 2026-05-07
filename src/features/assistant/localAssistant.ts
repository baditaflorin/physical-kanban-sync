import type { BoardState } from "../board/boardTypes";
import { cardsForColumn } from "../board/boardLogic";

export type AssistantProgress = {
  text: string;
  progress?: number;
};

const MODEL_ID = "SmolLM2-360M-Instruct-q4f16_1-MLC";

let cachedEngine: unknown = null;

export function createRuleBasedSummary(board: BoardState) {
  const lines = board.columns.map((column) => {
    const cards = cardsForColumn(board, column.id);
    const titles = cards
      .slice(0, 3)
      .map((card) => card.title)
      .join(", ");
    return `${column.title}: ${cards.length}${titles ? ` (${titles})` : ""}`;
  });

  const reviewCount = cardsForColumn(board, "review").length;
  const doingCount = cardsForColumn(board, "doing").length;
  const nudge =
    reviewCount > doingCount
      ? "Review has the most leverage right now."
      : "Keep WIP tight and pull one card at a time.";

  return `${lines.join("\n")}\n\n${nudge}`;
}

export async function runWebGpuSummary(
  board: BoardState,
  onProgress: (progress: AssistantProgress) => void,
) {
  if (!("gpu" in navigator)) {
    throw new Error("WebGPU is not available in this browser.");
  }

  onProgress({ text: "Loading WebLLM runtime" });
  const webllm = await import("@mlc-ai/web-llm");

  if (!cachedEngine) {
    cachedEngine = await webllm.CreateMLCEngine(MODEL_ID, {
      initProgressCallback: (progress) => {
        onProgress({
          text: progress.text,
          progress: progress.progress,
        });
      },
    });
  }

  const engine = cachedEngine as {
    chat: {
      completions: {
        create(options: {
          messages: Array<{ role: "system" | "user"; content: string }>;
          temperature: number;
          max_tokens: number;
        }): Promise<{ choices: Array<{ message?: { content?: string } }> }>;
      };
    };
  };

  const boardSnapshot = board.columns
    .map((column) => {
      const cards = cardsForColumn(board, column.id)
        .map((card) => `#${card.tagId} ${card.title}: ${card.description}`)
        .join("; ");
      return `${column.title}: ${cards || "empty"}`;
    })
    .join("\n");

  onProgress({ text: "Thinking locally" });
  const completion = await engine.chat.completions.create({
    temperature: 0.2,
    max_tokens: 180,
    messages: [
      {
        role: "system",
        content:
          "You summarize Kanban boards. Be concise, operational, and avoid markdown tables.",
      },
      {
        role: "user",
        content: `Summarize this physical Kanban board and suggest the next 3 actions:\n${boardSnapshot}`,
      },
    ],
  });

  return (
    completion.choices[0]?.message?.content?.trim() ||
    "The local model returned an empty response."
  );
}

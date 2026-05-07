import { Printer } from "lucide-react";
import { useMemo } from "react";
import { AprilTagFamily, type Pixel } from "apriltag";
import tag36h11 from "apriltag/families/36h11.json";
import type { KanbanCard } from "../board/boardTypes";

type TagSheetProps = {
  cards: KanbanCard[];
};

export function TagSheet({ cards }: TagSheetProps) {
  const family = useMemo(() => new AprilTagFamily(tag36h11), []);
  const visibleCards = cards.slice(0, 12);

  return (
    <section className="panel tag-panel" aria-labelledby="tags-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">36h11</p>
          <h2 id="tags-title">Tag Kit</h2>
        </div>
        <button
          className="icon-only"
          type="button"
          onClick={() => window.print()}
          title="Print tags"
        >
          <Printer size={18} />
        </button>
      </div>
      <div className="tag-grid">
        {visibleCards.map((card) => (
          <div className="tag-tile" key={card.id}>
            <AprilTagSvg pixels={family.render(card.tagId)} />
            <span>#{card.tagId}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function AprilTagSvg({ pixels }: { pixels: Pixel[][] }) {
  const size = pixels.length;

  return (
    <svg
      className="april-tag"
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="AprilTag marker"
      shapeRendering="crispEdges"
    >
      <rect width={size} height={size} fill="#fff" />
      {pixels.flatMap((row, y) =>
        row.map((pixel, x) =>
          pixel === "b" ? (
            <rect fill="#111" height="1" key={`${x}-${y}`} width="1" x={x} y={y} />
          ) : null,
        ),
      )}
    </svg>
  );
}

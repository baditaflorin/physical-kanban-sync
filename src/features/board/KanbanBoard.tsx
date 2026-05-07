import { ArrowLeft, ArrowRight, Plus, RotateCcw, Tag, Trash2 } from "lucide-react";
import {
  type BoardState,
  type ColumnId,
  type KanbanCard,
  noteColors,
} from "./boardTypes";
import {
  addManualCard,
  cardsForColumn,
  moveCardToColumn,
  removeCard,
  updateCard,
} from "./boardLogic";

type KanbanBoardProps = {
  board: BoardState;
  onBoardChange: (board: BoardState) => void;
  onReset: () => void;
};

export function KanbanBoard({ board, onBoardChange, onReset }: KanbanBoardProps) {
  function update(cardId: string, patch: Parameters<typeof updateCard>[2]) {
    onBoardChange(updateCard(board, cardId, patch));
  }

  function move(card: KanbanCard, direction: -1 | 1) {
    const currentIndex = board.columns.findIndex(
      (column) => column.id === card.columnId,
    );
    const nextColumn = board.columns[currentIndex + direction];
    if (nextColumn) {
      onBoardChange(moveCardToColumn(board, card.id, nextColumn.id));
    }
  }

  function handleDrop(columnId: ColumnId, cardId: string) {
    onBoardChange(moveCardToColumn(board, cardId, columnId));
  }

  return (
    <section className="board-shell" aria-labelledby="board-title">
      <div className="board-toolbar">
        <div>
          <p className="eyebrow">Physical wall</p>
          <h1 id="board-title">{board.title}</h1>
        </div>
        <div className="button-row">
          <button
            className="icon-button"
            type="button"
            onClick={() => onBoardChange(addManualCard(board))}
            title="Add card"
          >
            <Plus size={18} />
            <span>Add</span>
          </button>
          <button
            className="icon-button"
            type="button"
            onClick={onReset}
            title="Reset board"
          >
            <RotateCcw size={18} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      <div className="kanban-grid" data-testid="kanban-board">
        {board.columns.map((column) => (
          <section
            className="kanban-column"
            key={column.id}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              const cardId = event.dataTransfer.getData("text/plain");
              if (cardId) handleDrop(column.id, cardId);
            }}
            aria-labelledby={`${column.id}-title`}
          >
            <header>
              <h2 id={`${column.id}-title`}>{column.title}</h2>
              <span>{cardsForColumn(board, column.id).length}</span>
            </header>
            <div className="column-stack">
              {cardsForColumn(board, column.id).map((card) => (
                <StickyCard
                  board={board}
                  card={card}
                  key={card.id}
                  onMove={move}
                  onRemove={(cardId) => onBoardChange(removeCard(board, cardId))}
                  onUpdate={update}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

type StickyCardProps = {
  board: BoardState;
  card: KanbanCard;
  onUpdate: (cardId: string, patch: Parameters<typeof updateCard>[2]) => void;
  onMove: (card: KanbanCard, direction: -1 | 1) => void;
  onRemove: (cardId: string) => void;
};

function StickyCard({ board, card, onUpdate, onMove, onRemove }: StickyCardProps) {
  const columnIndex = board.columns.findIndex((column) => column.id === card.columnId);

  return (
    <article
      className={`sticky-card note-${card.color}`}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", card.id);
        event.dataTransfer.effectAllowed = "move";
      }}
    >
      <div className="card-topline">
        <span className="tag-chip">
          <Tag size={14} />
          {card.tagId}
        </span>
        <select
          aria-label={`Color for tag ${card.tagId}`}
          value={card.color}
          onChange={(event) =>
            onUpdate(card.id, {
              color: event.target.value as KanbanCard["color"],
            })
          }
        >
          {noteColors.map((color) => (
            <option key={color} value={color}>
              {color}
            </option>
          ))}
        </select>
      </div>
      <input
        aria-label={`Title for tag ${card.tagId}`}
        className="card-title-input"
        value={card.title}
        onChange={(event) => onUpdate(card.id, { title: event.target.value })}
      />
      <textarea
        aria-label={`Description for tag ${card.tagId}`}
        className="card-description-input"
        value={card.description}
        onChange={(event) => onUpdate(card.id, { description: event.target.value })}
      />
      <div className="card-actions">
        <button
          className="icon-only"
          type="button"
          onClick={() => onMove(card, -1)}
          disabled={columnIndex === 0}
          title="Move left"
        >
          <ArrowLeft size={16} />
        </button>
        <button
          className="icon-only"
          type="button"
          onClick={() => onMove(card, 1)}
          disabled={columnIndex === board.columns.length - 1}
          title="Move right"
        >
          <ArrowRight size={16} />
        </button>
        <button
          className="icon-only danger"
          type="button"
          onClick={() => onRemove(card.id)}
          title="Remove card"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </article>
  );
}

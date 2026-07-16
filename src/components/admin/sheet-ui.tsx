import { useCallback, useRef, useState, type DragEvent } from "react";
import { COLUMN_DRAG_MIME, ROW_DRAG_MIME } from "@/lib/trip-list-columns";
import { cn } from "@/lib/utils";

type EditableCellProps = {
  value: string;
  editable: boolean;
  onSave: (value: string) => void | Promise<void>;
  className?: string;
  mono?: boolean;
};

export function EditableCell({ value, editable, onSave, className, mono }: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    if (!editable) return;
    setDraft(value);
    setEditing(true);
    requestAnimationFrame(() => inputRef.current?.select());
  };

  const commit = async () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed !== value) {
      await onSave(trimmed);
    }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => void commit()}
        onKeyDown={(e) => {
          if (e.key === "Enter") void commit();
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        className={cn(
          "h-8 w-full rounded border border-forest/40 bg-white px-2 text-sm outline-none ring-1 ring-forest/20",
          mono && "font-mono",
          className,
        )}
        autoFocus
      />
    );
  }

  return (
    <button
      type="button"
      onClick={startEdit}
      disabled={!editable}
      className={cn(
        "block w-full truncate text-left text-sm",
        editable && "cursor-text rounded px-1 py-0.5 hover:bg-[#e8f0fe]/60",
        mono && "font-mono font-medium text-forest",
        !value && editable && "text-muted-foreground italic",
        className,
      )}
    >
      {value || (editable ? "Cliquer pour éditer" : "—")}
    </button>
  );
}

export function DragHandle({
  draggable,
  onDragStart,
  onDragEnd,
}: {
  draggable: boolean;
  onDragStart: (e: DragEvent<HTMLButtonElement>) => void;
  onDragEnd: () => void;
}) {
  if (!draggable) return <span className="inline-block w-5" />;
  return (
    <button
      type="button"
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
      aria-label="Déplacer la ligne"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden>
        <circle cx="4" cy="3" r="1.2" />
        <circle cx="10" cy="3" r="1.2" />
        <circle cx="4" cy="7" r="1.2" />
        <circle cx="10" cy="7" r="1.2" />
        <circle cx="4" cy="11" r="1.2" />
        <circle cx="10" cy="11" r="1.2" />
      </svg>
    </button>
  );
}

export function useRowDragReorder<T extends { id: string }>(
  items: T[],
  onReorder: (reordered: T[]) => void | Promise<void>,
) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const handleDragStart = useCallback((id: string) => (e: DragEvent) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.setData(ROW_DRAG_MIME, id);
  }, []);

  const handleDragOver = useCallback(
    (id: string) => (e: DragEvent) => {
      if (e.dataTransfer.types.includes(COLUMN_DRAG_MIME)) return;
      e.preventDefault();
      if (dragId && dragId !== id) setOverId(id);
    },
    [dragId],
  );

  const handleDrop = useCallback(
    (targetId: string) => async (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer.types.includes(COLUMN_DRAG_MIME)) return;
      const sourceId = dragId ?? e.dataTransfer.getData("text/plain");
      setDragId(null);
      setOverId(null);
      if (!sourceId || sourceId === targetId) return;

      const from = items.findIndex((i) => i.id === sourceId);
      const to = items.findIndex((i) => i.id === targetId);
      if (from < 0 || to < 0) return;

      const next = [...items];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      await onReorder(next);
    },
    [dragId, items, onReorder],
  );

  const handleDragEnd = useCallback(() => {
    setDragId(null);
    setOverId(null);
  }, []);

  return { dragId, overId, handleDragStart, handleDragOver, handleDrop, handleDragEnd };
}

export function useColumnDragReorder<T extends { id: string }>(
  items: T[],
  onReorder: (reordered: T[]) => void | Promise<void>,
) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const handleDragStart = useCallback((id: string) => (e: DragEvent) => {
    e.stopPropagation();
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData(COLUMN_DRAG_MIME, id);
  }, []);

  const handleDragOver = useCallback(
    (id: string) => (e: DragEvent) => {
      if (!e.dataTransfer.types.includes(COLUMN_DRAG_MIME)) return;
      e.preventDefault();
      e.stopPropagation();
      if (dragId && dragId !== id) setOverId(id);
    },
    [dragId],
  );

  const handleDrop = useCallback(
    (targetId: string) => async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const sourceId = dragId ?? e.dataTransfer.getData(COLUMN_DRAG_MIME);
      setDragId(null);
      setOverId(null);
      if (!sourceId || sourceId === targetId) return;

      const from = items.findIndex((i) => i.id === sourceId);
      const to = items.findIndex((i) => i.id === targetId);
      if (from < 0 || to < 0) return;

      const next = [...items];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      await onReorder(next);
    },
    [dragId, items, onReorder],
  );

  const handleDragEnd = useCallback(() => {
    setDragId(null);
    setOverId(null);
  }, []);

  return { dragId, overId, handleDragStart, handleDragOver, handleDrop, handleDragEnd };
}

export function DraggableColumnHead({
  columnId,
  label,
  draggable,
  isOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  columnId: string;
  label: string;
  draggable: boolean;
  isOver: boolean;
  onDragStart: (e: DragEvent<HTMLTableCellElement>) => void;
  onDragOver: (e: DragEvent<HTMLTableCellElement>) => void;
  onDrop: (e: DragEvent<HTMLTableCellElement>) => void;
  onDragEnd: () => void;
}) {
  return (
    <th
      className={cn(
        SHEET_HEAD,
        "min-w-[130px] select-none",
        draggable && "cursor-grab active:cursor-grabbing",
        isOver && "bg-[#e8f0fe] ring-2 ring-inset ring-forest/30",
      )}
      draggable={draggable}
      onDragStart={draggable ? onDragStart : undefined}
      onDragOver={draggable ? onDragOver : undefined}
      onDrop={draggable ? onDrop : undefined}
      onDragEnd={draggable ? onDragEnd : undefined}
      aria-label={draggable ? `Colonne ${label}, glisser pour réorganiser` : label}
    >
      <span className="flex items-center gap-1.5">
        {draggable && (
          <svg width="12" height="12" viewBox="0 0 14 14" fill="currentColor" className="shrink-0 text-muted-foreground" aria-hidden>
            <circle cx="4" cy="3" r="1.2" />
            <circle cx="10" cy="3" r="1.2" />
            <circle cx="4" cy="7" r="1.2" />
            <circle cx="10" cy="7" r="1.2" />
            <circle cx="4" cy="11" r="1.2" />
            <circle cx="10" cy="11" r="1.2" />
          </svg>
        )}
        {label}
      </span>
    </th>
  );
}

export const SHEET_HEAD =
  "sticky top-0 z-20 border border-border bg-[#f1f3f4] px-3 py-2.5 text-left text-sm font-semibold text-foreground shadow-[0_1px_0_0_hsl(var(--border))]";
export const SHEET_CELL = "border border-border px-3 py-2.5 text-sm text-foreground align-middle";
export const SHEET_ROW_NUM =
  "sticky left-0 z-10 border border-border bg-[#f8f9fa] px-2 py-2.5 text-center text-sm font-medium text-muted-foreground";

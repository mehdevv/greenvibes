import { useMemo } from "react";
import type { Destination } from "@/api/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NONE_VALUE = "__none__";

type DestinationSelectProps = {
  value: string;
  onChange: (destinationId: string) => void;
  destinations: Destination[];
  linkedDestination?: Destination | null;
  disabled?: boolean;
};

export function DestinationSelect({
  value,
  onChange,
  destinations,
  linkedDestination,
  disabled,
}: DestinationSelectProps) {
  const options = useMemo(() => {
    const list = [...destinations];
    if (linkedDestination && !list.some((d) => d.id === linkedDestination.id)) {
      list.unshift(linkedDestination);
    }
    return list;
  }, [destinations, linkedDestination]);

  const selected = options.find((d) => d.id === value);

  return (
    <div className="space-y-2">
      <Select
        key={`${value || NONE_VALUE}-${options.map((d) => d.id).join(",")}`}
        value={value || NONE_VALUE}
        onValueChange={(next) => onChange(next === NONE_VALUE ? "" : next)}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder="Choisir une destination..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE_VALUE}>Aucune destination</SelectItem>
          {options.map((d) => (
            <SelectItem key={d.id} value={d.id}>
              {d.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selected && (
        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground">
          {selected.title}
        </span>
      )}
    </div>
  );
}

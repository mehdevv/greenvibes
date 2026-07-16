import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type {
  CreateTripSheetInput,
  TripSheet,
  TripSheetColumn,
  TripSheetRow,
  UpdateTripSheetInput,
} from "./types";
import { getActiveSupabase } from "@/lib/supabase";
import { formatPostgrestError } from "./db-utils";
import { parseListColumns } from "@/lib/trip-list-columns";
import { updateReservationStatusById } from "./reservation-mutations";
import { ensureDefaultSheetForTrip } from "./reservation-sheet-sync";

function mapSheet(row: Record<string, unknown>): TripSheet {
  return {
    id: String(row.id),
    tripId: String(row.trip_id),
    name: String(row.name),
    isDefault: Boolean(row.is_default ?? false),
    sortOrder: Number(row.sort_order ?? 0),
    createdAt: String(row.created_at),
  };
}

function mapRow(row: Record<string, unknown>): TripSheetRow {
  const cells = row.cells;
  return {
    id: String(row.id),
    sheetId: String(row.sheet_id),
    sortOrder: Number(row.sort_order ?? 0),
    cells:
      cells && typeof cells === "object" && !Array.isArray(cells)
        ? Object.fromEntries(
            Object.entries(cells as Record<string, unknown>).map(([k, v]) => [k, String(v ?? "")]),
          )
        : {},
    reservationId: row.reservation_id ? String(row.reservation_id) : null,
    createdAt: String(row.created_at),
  };
}

async function nextRowSortOrder(sheetId: string): Promise<number> {
  const { data } = await getActiveSupabase()
    .from("trip_sheet_rows")
    .select("sort_order")
    .eq("sheet_id", sheetId)
    .order("sort_order", { ascending: false })
    .limit(1);
  return data?.length ? Number(data[0].sort_order) + 1 : 0;
}

export function useListTripSheets(tripId: string) {
  return useQuery({
    queryKey: ["trip-sheets", tripId],
    enabled: Boolean(tripId),
    queryFn: async (): Promise<TripSheet[]> => {
      const { data, error } = await getActiveSupabase()
        .from("trip_sheets")
        .select("*")
        .eq("trip_id", tripId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw new Error(formatPostgrestError(error));
      const sheets = (data ?? []).map((r) => mapSheet(r));
      if (!sheets.some((s) => s.isDefault)) {
        await ensureDefaultSheetForTrip(tripId);
        const { data: refreshed, error: refreshError } = await getActiveSupabase()
          .from("trip_sheets")
          .select("*")
          .eq("trip_id", tripId)
          .order("sort_order", { ascending: true });
        if (refreshError) throw new Error(formatPostgrestError(refreshError));
        return (refreshed ?? []).map((r) => mapSheet(r));
      }
      return sheets;
    },
  });
}

export function useListTripSheetRows(sheetId: string) {
  return useQuery({
    queryKey: ["trip-sheet-rows", sheetId],
    enabled: Boolean(sheetId),
    queryFn: async (): Promise<TripSheetRow[]> => {
      const { data, error } = await getActiveSupabase()
        .from("trip_sheet_rows")
        .select("*")
        .eq("sheet_id", sheetId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw new Error(formatPostgrestError(error));
      return (data ?? []).map((r) => mapRow(r));
    },
  });
}

export function useCreateTripSheet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTripSheetInput): Promise<TripSheet> => {
      const { data: existing } = await getActiveSupabase()
        .from("trip_sheets")
        .select("sort_order")
        .eq("trip_id", input.tripId)
        .order("sort_order", { ascending: false })
        .limit(1);

      const nextOrder = existing?.length ? Number(existing[0].sort_order) + 1 : 0;

      const { data, error } = await getActiveSupabase()
        .from("trip_sheets")
        .insert({
          trip_id: input.tripId,
          name: input.name.trim(),
          sort_order: nextOrder,
          is_default: false,
          columns: [],
        })
        .select("*")
        .single();
      if (error) throw new Error(formatPostgrestError(error));
      return mapSheet(data);
    },
    onSuccess: (sheet) => {
      qc.invalidateQueries({ queryKey: ["trip-sheets", sheet.tripId] });
    },
  });
}

export function useUpdateTripSheet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateTripSheetInput): Promise<TripSheet> => {
      const patch: Record<string, unknown> = {};
      if (input.name !== undefined) patch.name = input.name.trim();
      if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder;

      const { data, error } = await getActiveSupabase()
        .from("trip_sheets")
        .update(patch)
        .eq("id", input.id)
        .select("*")
        .single();
      if (error) throw new Error(formatPostgrestError(error));
      return mapSheet(data);
    },
    onSuccess: (sheet) => {
      qc.invalidateQueries({ queryKey: ["trip-sheets", sheet.tripId] });
    },
  });
}

export function useTripListColumns(tripId: string) {
  return useQuery({
    queryKey: ["trip-list-columns", tripId],
    enabled: Boolean(tripId),
    queryFn: async (): Promise<TripSheetColumn[]> => {
      const { data, error } = await getActiveSupabase()
        .from("trips")
        .select("list_columns")
        .eq("id", tripId)
        .single();
      if (error) {
        if (error.code === "42703") return parseListColumns(null);
        throw new Error(formatPostgrestError(error));
      }
      return parseListColumns(data.list_columns);
    },
  });
}

export function useUpdateTripListColumns() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ tripId, columns }: { tripId: string; columns: TripSheetColumn[] }) => {
      const { data: rpcData, error: rpcError } = await getActiveSupabase().rpc("update_trip_list_columns", {
        p_trip_id: tripId,
        p_columns: columns,
      });

      if (!rpcError) {
        return { tripId, columns: parseListColumns(rpcData) };
      }

      if (rpcError.code !== "42883") {
        throw new Error(formatPostgrestError(rpcError));
      }

      const { data, error } = await getActiveSupabase()
        .from("trips")
        .update({ list_columns: columns })
        .eq("id", tripId)
        .select("list_columns")
        .single();
      if (error) throw new Error(formatPostgrestError(error));
      if (!data) throw new Error("Permission refusée ou voyage introuvable");
      return { tripId, columns: parseListColumns(data.list_columns) };
    },
    onSuccess: ({ tripId, columns }) => {
      qc.setQueryData(["trip-list-columns", tripId], columns);
      qc.invalidateQueries({ queryKey: ["trips"] });
      qc.invalidateQueries({ queryKey: ["trip-sheets", tripId] });
    },
  });
}

export function useDeleteTripSheet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, tripId, isDefault }: { id: string; tripId: string; isDefault: boolean }) => {
      if (isDefault) throw new Error("La feuille Participants ne peut pas être supprimée.");
      const { error } = await getActiveSupabase().from("trip_sheets").delete().eq("id", id);
      if (error) throw new Error(formatPostgrestError(error));
      return tripId;
    },
    onSuccess: (tripId) => {
      qc.invalidateQueries({ queryKey: ["trip-sheets", tripId] });
      qc.invalidateQueries({ queryKey: ["trip-sheet-rows"] });
    },
  });
}

export function useCreateTripSheetRow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sheetId: string): Promise<TripSheetRow> => {
      const nextOrder = await nextRowSortOrder(sheetId);
      const { data, error } = await getActiveSupabase()
        .from("trip_sheet_rows")
        .insert({ sheet_id: sheetId, sort_order: nextOrder, cells: {} })
        .select("*")
        .single();
      if (error) throw new Error(formatPostgrestError(error));
      return mapRow(data);
    },
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ["trip-sheet-rows", row.sheetId] });
    },
  });
}

export function useUpdateTripSheetRow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      cells,
      sortOrder,
    }: {
      id: string;
      cells?: Record<string, string>;
      sortOrder?: number;
    }): Promise<TripSheetRow> => {
      const patch: Record<string, unknown> = {};
      if (cells !== undefined) patch.cells = cells;
      if (sortOrder !== undefined) patch.sort_order = sortOrder;

      const { data, error } = await getActiveSupabase()
        .from("trip_sheet_rows")
        .update(patch)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw new Error(formatPostgrestError(error));
      return mapRow(data);
    },
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ["trip-sheet-rows", row.sheetId] });
    },
  });
}

export function useMoveTripSheetRow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ rowId, toSheetId }: { rowId: string; toSheetId: string }) => {
      const { data: row, error: fetchError } = await getActiveSupabase()
        .from("trip_sheet_rows")
        .select("sheet_id")
        .eq("id", rowId)
        .single();
      if (fetchError) throw new Error(formatPostgrestError(fetchError));

      const fromSheetId = String(row.sheet_id);
      if (fromSheetId === toSheetId) return { fromSheetId, toSheetId };

      const nextOrder = await nextRowSortOrder(toSheetId);
      const { error } = await getActiveSupabase()
        .from("trip_sheet_rows")
        .update({ sheet_id: toSheetId, sort_order: nextOrder })
        .eq("id", rowId);
      if (error) throw new Error(formatPostgrestError(error));
      return { fromSheetId, toSheetId };
    },
    onSuccess: ({ fromSheetId, toSheetId }) => {
      qc.invalidateQueries({ queryKey: ["trip-sheet-rows", fromSheetId] });
      qc.invalidateQueries({ queryKey: ["trip-sheet-rows", toSheetId] });
    },
  });
}

export function useReorderTripSheetRows() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ sheetId, items }: { sheetId: string; items: { id: string; sortOrder: number }[] }) => {
      const updates = items.map(({ id, sortOrder }) =>
        getActiveSupabase().from("trip_sheet_rows").update({ sort_order: sortOrder }).eq("id", id),
      );
      const results = await Promise.all(updates);
      const failed = results.find((r) => r.error);
      if (failed?.error) throw new Error(formatPostgrestError(failed.error));
      return sheetId;
    },
    onSuccess: (sheetId) => {
      qc.invalidateQueries({ queryKey: ["trip-sheet-rows", sheetId] });
    },
  });
}

export function useDeleteTripSheetRow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, sheetId, reservationId }: { id: string; sheetId: string; reservationId?: string | null }) => {
      if (reservationId) {
        await updateReservationStatusById(reservationId, "cancelled");
      }
      const { error } = await getActiveSupabase().from("trip_sheet_rows").delete().eq("id", id);
      if (error) throw new Error(formatPostgrestError(error));
      return sheetId;
    },
    onSuccess: (sheetId) => {
      qc.invalidateQueries({ queryKey: ["trip-sheet-rows", sheetId] });
      qc.invalidateQueries({ queryKey: ["reservations"] });
      qc.invalidateQueries({ queryKey: ["trips"] });
    },
  });
}

export function useTripSheetsRealtime(tripId: string) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!tripId) return;

    const channel = getActiveSupabase()
      .channel(`trip-sheets-${tripId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trip_sheets", filter: `trip_id=eq.${tripId}` },
        () => qc.invalidateQueries({ queryKey: ["trip-sheets", tripId] }),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "trip_sheet_rows" }, () => {
        qc.invalidateQueries({ queryKey: ["trip-sheet-rows"] });
      })
      .subscribe();

    return () => {
      getActiveSupabase().removeChannel(channel);
    };
  }, [tripId, qc]);
}

export { parseListColumns };

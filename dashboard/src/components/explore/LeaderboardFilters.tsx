"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export type StatusFilter = "all" | "active" | "frozen" | "closed";
export type SortField = "volume" | "transactions";

export function LeaderboardFilters({
  statusFilter,
  onStatusChange,
  sortField,
  onSortChange,
  onRefresh,
  loading,
}: {
  statusFilter: StatusFilter;
  onStatusChange: (v: StatusFilter) => void;
  sortField: SortField;
  onSortChange: (v: SortField) => void;
  onRefresh: () => void;
  loading: boolean;
}) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <Select
        value={statusFilter}
        onValueChange={(v) => onStatusChange(v as StatusFilter)}
      >
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="frozen">Frozen</SelectItem>
          <SelectItem value="closed">Closed</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={sortField}
        onValueChange={(v) => onSortChange(v as SortField)}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="volume">Total Volume</SelectItem>
          <SelectItem value="transactions">Transactions</SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="icon"
        onClick={onRefresh}
        disabled={loading}
      >
        <RefreshCw
          className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
        />
      </Button>
    </div>
  );
}

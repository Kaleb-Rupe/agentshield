"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSearch } from "@/hooks/useSearch";
import { SearchResults } from "./SearchResults";

export function GlobalSearch({ className }: { className?: string }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const { search, result, loading, reset } = useSearch();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      reset();
      return;
    }
    debounceRef.current = setTimeout(() => {
      search(query);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className || ""}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by address or .sol domain..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="pl-9 w-full"
        />
      </div>
      {open && result.kind !== "idle" && (
        <div className="absolute top-full mt-1.5 w-full rounded-xl border border-white/[0.08] bg-card/95 backdrop-blur-2xl shadow-xl z-50">
          <SearchResults
            result={result}
            loading={loading}
            onSelect={() => {
              setOpen(false);
              setQuery("");
              reset();
            }}
          />
        </div>
      )}
    </div>
  );
}

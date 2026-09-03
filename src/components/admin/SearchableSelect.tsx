"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, X as XIcon } from "lucide-react";

interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder: string; // shown as the "All ..." option / empty state
  active: boolean; // drives the gold-highlighted styling, same as getSelectClass
  className?: string;
}

/**
 * A searchable, type-to-filter dropdown built to visually and behaviorally
 * match the pill-style native <select> filters elsewhere in
 * ProfileFiltersBar.tsx (same gold "active" highlight, same rounded-xl
 * pill shape), but backed by a real text input + custom listbox instead of
 * a native <select>.
 *
 * Why not a native <select>: native selects support keyboard "type-ahead"
 * (typing a letter jumps to the first matching option), which for a list
 * like Communities can look like free typing without actually being a
 * search — you still have to already know/see the exact option to land on
 * it. This component instead filters the visible list live as you type,
 * so incomplete or partial text ("modi", "nam") narrows the list before
 * you pick.
 *
 * Behavior:
 * - Click/focus opens the list and shows all options.
 * - Typing filters options by substring match (case-insensitive) against
 *   each option's label.
 * - Click, or Arrow keys + Enter, selects an option and immediately calls
 *   onChange (matching the "select applies the filter instantly" pattern
 *   used by the other dropdowns in this file).
 * - A small X clears the current selection once one is set.
 * - Clicking outside closes the list without changing the selection.
 */
export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
  active,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const selectedLabel = options.find((o) => o.value === value)?.label || "";

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  // Reset the highlighted row whenever the filtered list changes, so it
  // never points past the end of a shorter, filtered list.
  useEffect(() => {
    setHighlighted(0);
  }, [filtered.length]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const commit = (val: string) => {
    onChange(val);
    setOpen(false);
    setQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && filtered[highlighted]) commit(filtered[highlighted].value);
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div
        className={
          className ||
          [
            "flex items-center gap-1 text-xs font-medium border rounded-xl px-3 py-2 transition-all duration-150 cursor-text shadow-2xs min-w-[150px]",
            active
              ? "bg-gold/15 border-gold/50 text-navy-dark font-semibold shadow-xs"
              : "bg-gray-50/80 border-gray-200/80 text-gray-700 hover:bg-white hover:border-gray-300",
          ].join(" ")
        }
        onClick={() => {
          setOpen(true);
          inputRef.current?.focus();
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={open ? query : selectedLabel}
          placeholder={placeholder}
          onFocus={() => {
            setOpen(true);
            setQuery("");
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className="bg-transparent outline-none placeholder:text-gray-400 w-full min-w-0"
        />
        {value ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              commit("");
            }}
            className="text-gray-400 hover:text-rose-500 flex-shrink-0"
            aria-label={`Clear ${placeholder}`}
          >
            <XIcon className="w-3 h-3" />
          </button>
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        )}
      </div>

      {open && (
        <div className="absolute z-30 mt-1.5 w-full min-w-[200px] max-h-60 overflow-auto bg-white border border-gray-200/80 rounded-xl shadow-xl py-1.5">
          <button
            type="button"
            onClick={() => commit("")}
            className="w-full text-left px-3.5 py-2 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors"
          >
            {placeholder}
          </button>
          {filtered.length === 0 && (
            <p className="px-3.5 py-2 text-xs text-gray-400 italic">No matches</p>
          )}
          {filtered.map((opt, i) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => commit(opt.value)}
              onMouseEnter={() => setHighlighted(i)}
              className={[
                "w-full text-left px-3.5 py-2 text-xs font-semibold transition-colors",
                i === highlighted ? "bg-gold/10 text-navy-dark" : "text-gray-700 hover:bg-gray-50",
                opt.value === value ? "text-gold-dark" : "",
              ].join(" ")}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { useStationSearch } from "../lib/useStationSearch";
import SearchResult from "./SearchResult";

interface SearchInputProps {
  search: boolean;
}

export default function SearchInput({}: SearchInputProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [onSearch, setOnSearch] = useState("");

  const {
    isLoading,
    results,
    collectionStatus,
    error,
    refreshCollectionStatus,
  } = useStationSearch(query);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setOnSearch("");
  };

  const handleClear = () => {
    setQuery("");
    setOnSearch("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div
      className={`absolute top-0 left-0 w-full z-30 gap-y-2 ${
        query ? "bg-background  h-full" : ""
      } ${
        isLoading || query ? "justify-center bg-background items-center" : ""
      } `}
    >
      <div className="p-3">
        <div className="relative flex items-center">
          <div className="absolute inset-y-0 left-0 flex items-center justify-center pl-3 pointer-events-none">
            <Search
              className={
                query ? "w-5 h-5 text-white" : "w-5 h-5 text-secondary"
              }
            />
          </div>

          {/* <Input */}
          <input
            ref={inputRef}
            type="text"
            className="block w-full p-3 pl-10 pr-10 text-lg bg-background-secondary outline-none shadow-sm rounded-lg"
            placeholder="Bahnhof eingeben..."
            value={query}
            onBlur={() => setIsFocused(false)}
            onFocus={() => setIsFocused(true)}
            onChange={handleChange}
            autoComplete="off"
            // autoFocus={false}
          />
          {query && (
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3"
              onClick={handleClear}
            >
              <X className="w-4 h-4 text-secondary hover:text-white" />
            </button>
          )}
        </div>
      </div>
      {isLoading && (
        // 64px = navbar, 76px = searchbar
        <div className="flex flex-col justify-center items-center text-center h-[calc(100vh-64px-76px)] w-full gap-6">
          <div className="w-20 h-20 border-8 border-white border-t-action rounded-full animate-spin"></div>

          <p className="text-2xl font-bold">Lädt...</p>
        </div>
      )}
      {!isLoading &&
        query &&
        results.map((result) => (
          <SearchResult
            station={result.station}
            key={result.station.id}
            collectionStatus={collectionStatus[result.station.id]}
            refreshCollectionStatus={refreshCollectionStatus}
            // collected={result}
          />
        ))}
    </div>
  );
}

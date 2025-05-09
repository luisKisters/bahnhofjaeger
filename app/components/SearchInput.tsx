"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";

interface SearchInputProps {
  search: boolean;
}

export default function SearchInput({}: SearchInputProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [onSearch, setOnSearch] = useState("");

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
    <div className="absolute top-0 left-0 w-full z-30 gap-y-2">
      <div className="p-3">
        <div className="relative flex items-center">
          <div className="absolute inset-y-0 left-0 flex items-center justify-center pl-3 pointer-events-none">
            <Search
              className={
                query ? "w-5 h-5 text-white" : "w-5 h-5 text-secondary"
              }
            />
          </div>

          <input
            ref={inputRef}
            type="text"
            className="block w-full p-3 pl-10 pr-10 text-lg bg-background-secondary outline-none shadow-sm rounded-lg focus:ring-2 focus:ring-action"
            placeholder="Bahnhof eingeben..."
            value={query}
            onBlur={() => setIsFocused(false)}
            onFocus={() => setIsFocused(true)}
            onChange={handleChange}
            autoComplete="off"
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
      {query && (
        <div className="absolut m-3">
          <p>hello</p>
        </div>
      )}
    </div>
  );
}

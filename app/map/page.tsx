"use client";

import React from "react";
import StationMap from "../components/StationMap";
import { useCollection } from "../lib/useCollection";

export default function MapPage() {
  const { isLoading, entries, stats, error, removeStation, refreshCollection } =
    useCollection();

  const handleCollectionUpdated = () => {
    refreshCollection();
  };

  return (
    <div className="w-full h-[calc(100vh-80px)]">
      <StationMap
        entries={entries}
        onCollectionUpdated={handleCollectionUpdated}
      />
    </div>
  );
}

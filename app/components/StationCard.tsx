"use client";

import React from "react";
import { Station } from "@/app/lib/db";

interface StationCardProps {
  station: Station;
  isCollected: boolean;
  onAddToCollection?: () => void;
  onRemoveFromCollection?: () => void;
  matchScore?: number;
}

export default function StationCard({
  station,
  isCollected,
  onAddToCollection,
  onRemoveFromCollection,
  matchScore,
}: StationCardProps) {
  // Function to safely handle the remove action
  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onRemoveFromCollection) {
      onRemoveFromCollection();
    }
  };

  // Function to safely handle the add action
  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddToCollection) {
      onAddToCollection();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-lg font-medium text-gray-800">{station.name}</h2>
          <p className="text-sm text-gray-600">
            Price Class: {station.priceClass} · State: {station.state}
          </p>

          {/* Show additional information from enriched data */}
          {station.productLine && (
            <p className="text-sm text-gray-600">
              Type: {station.productLine}
              {station.segment && ` (${station.segment})`}
            </p>
          )}

          {station.city && (
            <p className="text-sm text-gray-600">
              {station.city}
              {station.zipcode && `, ${station.zipcode}`}
              {station.street && ` · ${station.street}`}
            </p>
          )}

          {station.aufgabentraegerShortName && (
            <p className="text-sm text-gray-600">
              Operator: {station.aufgabentraegerShortName}
            </p>
          )}

          {/* Show amenities */}
          <div className="mt-1 text-sm text-gray-600">
            {(station.hasWifi || station.hasParking || station.hasDBLounge) && (
              <div className="flex flex-wrap gap-1 mt-1">
                {station.isMainStation && (
                  <span className="bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-medium">
                    Main Station
                  </span>
                )}
                {station.hasWifi && (
                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                    WiFi
                  </span>
                )}
                {station.hasParking && (
                  <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-xs">
                    Parking
                  </span>
                )}
                {station.hasDBLounge && (
                  <span className="bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full text-xs">
                    DB Lounge
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center mt-1">
            <p className="text-sm font-bold text-blue-700">
              {station.pointValue} Points
            </p>
          </div>
        </div>
        <div>
          {isCollected ? (
            <button
              onClick={handleRemove}
              className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm hover:bg-red-200 transition-colors"
            >
              Remove
            </button>
          ) : (
            <button
              onClick={handleAdd}
              className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm hover:bg-blue-200 transition-colors"
            >
              Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

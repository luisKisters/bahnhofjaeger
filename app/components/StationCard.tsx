"use client";

import React from "react";
import { Station } from "@/app/lib/db";

interface StationCardProps {
  station: Station;
  isCollected?: boolean;
  onAddToCollection?: () => void;
  onRemoveFromCollection?: () => void;
}

export default function StationCard({
  station,
  isCollected = false,
  onAddToCollection,
  onRemoveFromCollection,
}: StationCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-3">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            {station.name}
          </h3>
          <p className="text-sm text-gray-500">{station.state}</p>
        </div>

        <div className="flex flex-col items-end">
          <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
            PK{station.priceClass}
          </span>
          <span className="text-md font-bold text-green-600 mt-1">
            {station.pointValue} pts
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-3 flex justify-end">
        {!isCollected && onAddToCollection && (
          <button
            onClick={onAddToCollection}
            className="flex items-center justify-center px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <svg
              className="w-4 h-4 mr-1"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add to Collection
          </button>
        )}

        {isCollected && onRemoveFromCollection && (
          <button
            onClick={onRemoveFromCollection}
            className="flex items-center justify-center px-3 py-1.5 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <svg
              className="w-4 h-4 mr-1"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

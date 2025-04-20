import React from "react";

export default function StatisticBar({
  percentage,
  collected,
  total,
  name,
}: {
  percentage: number;
  collected: number;
  total: number;
  name: string;
}) {
  // TODO: make mainstations stand out more
  //   const isMainStation = name === "Main Stations";

  return (
    <div key={name} className="mb-2">
      <div className="flex justify-between text-xs font-medium mb-1">
        <span className="text-gray-800">{name}</span>
        <span className="text-gray-800">
          {percentage}% ({collected}/{total})
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-blue-600 h-2.5 rounded-full"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}

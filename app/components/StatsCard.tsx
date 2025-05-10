"use client";

import React from "react";
import { CollectionStats } from "@/app/lib/db";
import StatisticBar from "@/app/components/StatisticBar";

export default function StatsCard(props: { stats: CollectionStats }) {
  const { stats } = props;

  // Format the last updated date
  const formatDate = (timestamp: number) => {
    if (!timestamp) return "Never";

    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get current month name
  const getCurrentMonthName = () => {
    return new Date().toLocaleString("default", { month: "long" });
  };

  // Level gradient styles based on level name
  const getLevelStyle = (level: string) => {
    if (level.toLowerCase().includes("diamant")) {
      // Diamond gradient from first image
      return {
        background:
          "linear-gradient(90deg, #FDFFFE 0%, #7ABBAC 23%, #B1FFEF 39%, #8AD2C3 54%, #CFFEF4 75%, #6CA196 92%, #35544E 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      };
    } else if (level.toLowerCase().includes("master")) {
      // Master gradient from second image
      return {
        background:
          "linear-gradient(90deg, #CCE8FE 0%, #CDA0FF 24%, #8489F5 40%, #CDF1FF 71%, #B591E9 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      };
    } else if (level.toLowerCase().includes("gold")) {
      return {
        background:
          "linear-gradient(-72deg, #ffde45, #ffffff 16%, #ffde45 21%, #ffffff 24%, #452100 27%, #ffde45 36%, #ffffff 45%, #ffffff 60%, #ffde45 72%, #ffffff 80%, #ffde45 84%, #452100)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      };
    } else if (
      level.toLowerCase().includes("silber") ||
      level.toLowerCase().includes("silver")
    ) {
      return {
        background:
          "linear-gradient(-72deg, #dedede, #ffffff 16%, #dedede 21%, #ffffff 24%, #454545 27%, #dedede 36%, #ffffff 45%, #ffffff 60%, #dedede 72%, #ffffff 80%, #dedede 84%, #a1a1a1)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      };
    } else if (level.toLowerCase().includes("bronze")) {
      return {
        background:
          "linear-gradient(-72deg, #ca7345, #ffdeca 16%, #ca7345 21%, #ffdeca 24%, #a14521 27%, #ca7345 36%, #ffdeca 45%, #ffdeca 60%, #ca7345 72%, #ffdeca 80%, #ca7345 84%, #732100)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      };
    } else if (
      level.toLowerCase().includes("platin") ||
      level.toLowerCase().includes("platinum")
    ) {
      return {
        background:
          "linear-gradient(-72deg, #dedeff, #ffffff 16%, #dedeff 21%, #ffffff 24%, #555564 27%, #dedeff 36%, #ffffff 45%, #ffffff 60%, #dedeff 72%, #ffffff 80%, #dedeff 84%, #555564)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      };
    } else if (level.toLowerCase().includes("perl")) {
      return {
        background:
          "linear-gradient(-72deg, #dedede, #ffffff 16%, #dedede 21%, #ffffff 24%, #caa1de 27%, #dea1ca 30%, #dedede 38%, #ffffff 45%, #ffffff 60%, #dedede 72%, #ffffff 80%, #dedede 84%, #caa1de 93%, #dea1ca)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      };
    } else if (level.toLowerCase().includes("china")) {
      return {
        background: "linear-gradient(#ffffff, #e3e3e3)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      };
    } else if (level.toLowerCase().includes("woody")) {
      return {
        background:
          "linear-gradient(#ca7321, #ffcaa1 15%, #dea173 20%, #a16421 15%, #ca7321 30%, #ffcaa1 35%, #ca7321 40%, #ffcaa1 50%, #a16421 55%, #ca7321 60%, #ffcaa1 65%, #ca7321 75%, #dea173 80%, #ffcaa1 90%, #dea173 80%, #ca7321)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      };
    } else if (level.toLowerCase().includes("carbon")) {
      return {
        background:
          "repeating-linear-gradient(top, #565656, #131313 2px, #565656 1px)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      };
    } else if (
      level.toLowerCase().includes("eisen") ||
      level.toLowerCase().includes("iron")
    ) {
      return {
        background: "linear-gradient(to right, #71797E, #D3D3D3)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      };
    } else {
      // Default gradient
      return {
        background: "linear-gradient(to right, #3366ff, #00ccff)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      };
    }
  };

  return (
    <div className="">
      <h2 className="text-xl mb-2 ">Punkte und Level</h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col justify-center item-center text-center bg-background-secondary p-4 rounded-lg h-26">
          <div className="text-3xl font-bold text-shadow-lg">
            {stats.totalPoints}
          </div>
          <div className="font-medium text-sm text-shadow-lg">Sammelpunkte</div>
        </div>

        <div className="flex flex-col justify-center item-center text-center bg-background-secondary p-4 rounded-lg h-26">
          <div
            className="text-3xl font-bold text-shadow-lg"
            style={getLevelStyle(stats.level)}
            // style={getLevelStyle(stats.level)}
          >
            {stats.level}
          </div>
          <div className="text-sm font-medium text-shadow-lg">Stations</div>
        </div>

        <div className="flex flex-col justify-center item-center text-center bg-background-secondary p-4 rounded-lg h-26">
          <div className="text-3xl font-bold text-shadow-lg">
            {stats.monthStreak} {stats.monthStreak === 1 ? "Monat" : "Monate"}
          </div>
          <div className="text-sm font-medium text-shadow-lg">Streak 🔥</div>
        </div>

        <div className="flex flex-col justify-center item-center text-center bg-background-secondary p-4 rounded-lg h-26">
          <div className="text-3xl font-bold text-shadow-lg">
            {stats.totalStations}
          </div>
          <div className="text-sm font-medium text-shadow-lg">Stationen</div>
        </div>
      </div>
    </div>
  );
}

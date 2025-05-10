"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";

export default function RanglistePage() {
  return (
    <div className="flex flex-col items-center justify-center h-[90vh] p-4 text-center">
      <AlertTriangle className="w-16 h-16 text-white mb-4" />
      <h1 className="text-2xl font-bold mb-2">Work in Progress 🚧</h1>
      <p className="text-secondary">
        Die Rangliste ist aktuell in Entwicklung und wird bald verfügbar sein.
      </p>
    </div>
  );
}

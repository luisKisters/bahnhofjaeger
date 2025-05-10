"use client";

import React from "react";
import { useInitialization } from "@/app/lib/useInitialization";

export default function InitializationScreen({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, isInitialized, error, stationCount, resetDatabase } =
    useInitialization();

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
        <div className="bg-background-secondary p-6 rounded-lg shadow-lg w-full max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Initialization Error
          </h2>
          <p className="text-primary mb-6">
            There was an error initializing the application:
            <span className="block mt-2 text-sm bg-red-50 p-2 rounded border border-red-200">
              {error.message}
            </span>
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2 bg-action text-white rounded-md hover:bg-action focus:outline-none focus:ring-2 focus:ring-action mb-2"
          >
            Try Again
          </button>
          <button
            onClick={resetDatabase}
            className="w-full py-2 bg-action text-white rounded-md hover:bg-action/80 focus:outline-none focus:ring-2 focus:ring-action"
          >
            Reset Database
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 border-4 border-secondary border-t-action rounded-full animate-spin"></div>
        </div>
        <h2 className="text-xl font-semibold text-white">
          Bahnhofjaeger lädt...
        </h2>
        <p className="text-secondary mt-2">Dein Zug Abenteuer wird geladen</p>
        {stationCount > 0 && (
          <p className="text-green-600 mt-2">Loaded {stationCount} stations!</p>
        )}
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
        <div className="bg-background-secondary p-6 rounded-lg shadow-lg w-full max-w-md">
          <h2 className="text-2xl font-bold text-primary mb-4">
            Welcome to Bahnhofjaeger
          </h2>
          <p className="text-secondary mb-6">
            Initializing the application for the first time. This may take a
            moment...
          </p>
          <div className="w-full bg-background rounded-full h-2.5 mb-4">
            <div className="bg-action h-2.5 rounded-full w-3/4 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // If everything is initialized correctly, render children
  return <>{children}</>;
}

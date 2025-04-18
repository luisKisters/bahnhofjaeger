"use client";

import React, { useState } from "react";
import Link from "next/link";
import Layout from "@/app/components/Layout";
import InitializationScreen from "@/app/components/InitializationScreen";
import StatsCard from "@/app/components/StatsCard";
import { useCollection } from "@/app/lib/useCollection";
import { getAllStations } from "@/app/lib/stations";

export default function HomePage() {
  const { stats, isLoading } = useCollection();
  const [dbInfo, setDbInfo] = useState<{
    totalStations: number;
    samples: any[];
  } | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  const checkDatabase = async () => {
    try {
      const stations = await getAllStations();
      setDbInfo({
        totalStations: stations.length,
        samples: stations.slice(0, 3),
      });
      setShowDebug(true);
    } catch (error) {
      console.error("Failed to load database info:", error);
      alert("Error loading database info");
    }
  };

  return (
    <InitializationScreen>
      <Layout>
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            Bahnhofjaeger
          </h1>

          {/* Collection Stats */}
          {!isLoading && (
            <StatsCard stats={stats} showPriceClassCompletion={false} />
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="flex justify-center my-8">
              <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          )}

          {/* Debug Info */}
          <div className="mb-6">
            <button
              onClick={checkDatabase}
              className="bg-gray-200 text-gray-800 rounded-lg p-2 text-sm w-full mb-2"
            >
              Check Database
            </button>

            {showDebug && dbInfo && (
              <div className="bg-gray-100 p-4 rounded-lg text-sm mb-4">
                <h3 className="font-semibold">Database Info</h3>
                <p>Total stations: {dbInfo.totalStations}</p>
                {dbInfo.samples.length > 0 ? (
                  <div>
                    <p className="mt-2 font-semibold">Sample stations:</p>
                    <pre className="bg-gray-50 p-2 rounded overflow-auto max-h-40 text-xs">
                      {JSON.stringify(dbInfo.samples, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <p className="text-red-500">No stations found in database!</p>
                )}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-1 gap-4 mb-6">
            <Link
              href="/search"
              className="bg-blue-600 text-white rounded-lg shadow-md p-6 text-center hover:bg-blue-700 transition-colors"
            >
              <div className="flex flex-col items-center">
                <svg
                  className="w-8 h-8 mb-2"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <span className="text-xl font-semibold">Search Stations</span>
              </div>
            </Link>

            <Link
              href="/collection"
              className="bg-green-600 text-white rounded-lg shadow-md p-6 text-center hover:bg-green-700 transition-colors"
            >
              <div className="flex flex-col items-center">
                <svg
                  className="w-8 h-8 mb-2"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                <span className="text-xl font-semibold">View Collection</span>
              </div>
            </Link>
          </div>

          {/* App Info */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              About Bahnhofjaeger
            </h2>
            <p className="text-gray-600 mb-2">
              Collect train stations and earn points based on their price class.
              Higher price classes earn more points!
            </p>
            <p className="text-sm text-gray-500">
              This app works offline - perfect for your train journeys.
            </p>
          </div>
        </div>
      </Layout>
    </InitializationScreen>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import InitializationScreen from "@/app/components/InitializationScreen";
import StatsCard from "@/app/components/StatsCard";
import { useCollection } from "@/app/lib/useCollection";

export default function HomePage() {
  const { stats, isLoading } = useCollection();

  return (
    <InitializationScreen>
      <div className="">
        <h1 className="text-3xl font-bold">Bahnhofjäger</h1>
        <p className="text-lg text-secondary mb-8 font-light">
          Sammle Bahnhöfe und erhalte Punkte!
        </p>

        {/* Collection Stats */}
        {!isLoading && <StatsCard stats={stats} />}

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center my-8">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        )}

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
        <div className="bg-white rounded-lg shadow-md p-4 mb-2">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            About Bahnhofjger
          </h2>
          <p className="text-gray-600 mb-2">
            Collect train stations and earn points based on their price class.
            Higher price classes earn more points!
          </p>
          <p className="text-sm text-gray-500">
            This app works offline - perfect for your train journeys.
          </p>
        </div>
        <div className="text-xs text-gray-400 text-center mt-2">
          <Link href="/privacy" className="underline hover:text-blue-600">
            Privacy Policy
          </Link>
        </div>
      </div>
    </InitializationScreen>
  );
}

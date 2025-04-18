"use client";

import React from "react";
import Layout from "@/app/components/Layout";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <Layout>
      <div className="max-w-md mx-auto text-center py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          You're Offline
        </h1>

        <div className="bg-yellow-50 p-4 rounded-lg mb-6">
          <p className="text-yellow-800 mb-2">
            You appear to be offline. Some features may not be available.
          </p>
          <p className="text-sm text-yellow-700">
            Bahnhofjaeger works offline for previously visited pages and your
            collection data is stored locally.
          </p>
        </div>

        <div className="grid gap-4">
          <Link
            href="/"
            className="bg-blue-600 text-white rounded-lg p-4 text-center hover:bg-blue-700 transition-colors"
          >
            Go to Home
          </Link>

          <Link
            href="/collection"
            className="bg-green-600 text-white rounded-lg p-4 text-center hover:bg-green-700 transition-colors"
          >
            View My Collection
          </Link>
        </div>
      </div>
    </Layout>
  );
}

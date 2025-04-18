"use client";

import React, { useRef, useEffect, useState } from "react";
import * as maptilersdk from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";
import { CollectionEntry } from "@/app/lib/db";

// Initialize MapTiler with your API key
maptilersdk.config.apiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY || "";

interface StationMapProps {
  entries: CollectionEntry[];
}

export default function StationMap({ entries }: StationMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maptilersdk.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const validEntries = entries.filter(
    (entry) => entry.station.latitude && entry.station.longitude
  );

  // Default center to Germany if no stations or all invalid
  const defaultCenter: [number, number] = [10.4515, 51.1657]; // Center of Germany [lng, lat]

  useEffect(() => {
    if (!mapContainer.current) return;
    if (map.current) return; // Initialize map only once

    // Initialize map
    map.current = new maptilersdk.Map({
      container: mapContainer.current,
      style: maptilersdk.MapStyle.STREETS,
      center: defaultCenter,
      zoom: 5,
    });

    // Add navigation controls
    map.current.addControl(new maptilersdk.NavigationControl());

    map.current.on("load", () => {
      setMapLoaded(true);
    });

    // Cleanup on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Add markers after map is loaded
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const mapInstance = map.current;

    // Add markers for each station
    validEntries.forEach((entry) => {
      if (!entry.station.latitude || !entry.station.longitude) return;

      // Create popup content
      const popupNode = document.createElement("div");
      popupNode.innerHTML = `
        <h3 class="font-medium">${entry.station.name}</h3>
        <p class="text-sm">Price Class: ${entry.station.priceClass}</p>
        <p class="text-sm">Points: ${entry.station.pointValue}</p>
        ${
          entry.station.operator
            ? `<p class="text-sm">Operator: ${entry.station.operator}</p>`
            : ""
        }
      `;

      // Create popup
      const popup = new maptilersdk.Popup().setDOMContent(popupNode);

      // Create marker with popup
      new maptilersdk.Marker({ color: "#FF0000" })
        .setLngLat([entry.station.longitude, entry.station.latitude])
        .setPopup(popup)
        .addTo(mapInstance);
    });
  }, [validEntries, mapLoaded]);

  if (validEntries.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-4 text-center">
        <p className="text-gray-600">
          No stations with map coordinates in your collection
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <h2 className="text-lg font-medium text-gray-800 mb-3">Station Map</h2>
      <div ref={mapContainer} style={{ height: "400px", width: "100%" }} />
    </div>
  );
}

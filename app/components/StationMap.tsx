"use client";

import React, { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { CollectionEntry } from "@/app/lib/db";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

interface StationMapProps {
  entries: CollectionEntry[];
}

export default function StationMap({ entries }: StationMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const validEntries = entries.filter(
    (entry) => entry.station.latitude && entry.station.longitude
  );

  // Default center to Germany if no stations or all invalid
  const defaultCenter: [number, number] = [10.4515, 51.1657]; // Center of Germany [lng, lat]

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: defaultCenter,
      zoom: 5,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl());

    map.current.on("load", () => {
      setMapLoaded(true);
    });

    // Cleanup on unmount
    return () => {
      if (map.current) {
        map.current.remove();
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

      // Create marker with popup
      new mapboxgl.Marker()
        .setLngLat([entry.station.longitude, entry.station.latitude])
        .setPopup(new mapboxgl.Popup().setDOMContent(popupNode))
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

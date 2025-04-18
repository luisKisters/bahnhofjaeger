"use client";

import React, { useRef, useEffect, useState } from "react";
import * as maptilersdk from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";
import { CollectionEntry, Station } from "@/app/lib/db";
import { getAllStations } from "@/app/lib/stations";

// Initialize MapTiler with your API key
maptilersdk.config.apiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY || "";

interface StationMapProps {
  entries: CollectionEntry[];
}

export default function StationMap({ entries }: StationMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maptilersdk.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [allStations, setAllStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapInitialized, setMapInitialized] = useState(false);
  const markersRef = useRef<maptilersdk.Marker[]>([]);

  // Create a Set of collected station IDs for quick lookups
  const collectedStationIds = new Set(entries.map((entry) => entry.stationId));

  // Get valid entries from collection (those with coordinates)
  const validCollectionEntries = entries.filter(
    (entry) => entry.station.latitude && entry.station.longitude
  );

  // Default center to Germany if no stations or all invalid
  const defaultCenter: [number, number] = [10.4515, 51.1657]; // Center of Germany [lng, lat]

  // Function to determine marker scale based on price class (with smaller values)
  const getMarkerScale = (priceClass: number, isCollected: boolean): number => {
    // Invert scale so that priceClass 1 is largest
    const invertedScale = 8 - priceClass; // This gives 7 for class 1, 6 for class 2, etc.

    // Base scale from price class
    const baseScale = 0.5 + invertedScale * 0.1;

    // Apply collection status multiplier
    return isCollected ? baseScale * 1.3 : baseScale * 0.85;
  };

  // Function to create a custom HTML marker element
  const createCustomMarker = (
    station: Station,
    isCollected: boolean
  ): HTMLElement => {
    // Set color based on collection status
    const color = isCollected ? "#0066ff" : "#808080"; // Blue for collected, gray for uncollected

    // Get scale based on price class (1-7) and collection status
    const scale = getMarkerScale(station.priceClass, isCollected);

    // Base size - make markers overall smaller
    const baseSize = 12;
    const size = Math.round(baseSize * scale);

    // Create the marker element
    const el = document.createElement("div");

    // Style the marker
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.borderRadius = "50%";
    el.style.backgroundColor = color;
    el.style.border = "1px solid white";
    el.style.boxShadow = "0 0 3px rgba(0,0,0,0.3)";

    // For larger markers, add the price class as text
    if (size >= 14) {
      // Add price class as text in the center of the marker
      const textEl = document.createElement("div");
      textEl.textContent = station.priceClass.toString();
      textEl.style.color = "white";
      textEl.style.fontWeight = "bold";
      textEl.style.textAlign = "center";
      textEl.style.lineHeight = `${size}px`;
      textEl.style.fontSize = `${Math.max(8, size / 2)}px`;
      el.appendChild(textEl);
    }

    // Set z-index for collected stations to be higher (on top)
    if (isCollected) {
      el.style.zIndex = "1000";
    }

    return el;
  };

  // Load all stations from database
  useEffect(() => {
    async function loadAllStations() {
      try {
        setLoading(true);
        const stations = await getAllStations();
        const validStations = stations.filter(
          (station) => station.latitude && station.longitude
        );
        console.log(
          `Loaded ${validStations.length} valid stations with coordinates`
        );
        setAllStations(validStations);
        setLoading(false);
      } catch (error) {
        console.error("Error loading stations:", error);
        setLoading(false);
      }
    }

    loadAllStations();
  }, []);

  // Initialize map once container is ready and stations are loaded
  useEffect(() => {
    // Ensure the map is initialized only once
    if (mapInitialized) return;

    // Wait for the mapContainer to be available in the DOM
    const initializeMap = () => {
      if (!mapContainer.current) {
        console.log("Map container not ready yet, retrying soon...");
        return false;
      }

      try {
        console.log("Initializing MapTiler map...");

        // Initialize map
        map.current = new maptilersdk.Map({
          container: mapContainer.current,
          style: maptilersdk.MapStyle.STREETS,
          center: defaultCenter,
          zoom: 5,
          maxZoom: 18,
          minZoom: 3,
          attributionControl: false,
        });

        // Add navigation and attribution controls
        map.current.addControl(new maptilersdk.NavigationControl());
        map.current.addControl(
          new maptilersdk.AttributionControl({
            compact: true,
          })
        );

        map.current.on("load", () => {
          console.log("Map loaded successfully");
          setMapLoaded(true);
        });

        map.current.on("error", (e) => {
          console.error("Map error:", e);
        });

        setMapInitialized(true);
        return true;
      } catch (error) {
        console.error("Error initializing map:", error);
        return false;
      }
    };

    // Try to initialize the map immediately
    if (!initializeMap()) {
      // If it fails, retry after a short delay to ensure DOM is ready
      const timeoutId = setTimeout(() => {
        if (!mapInitialized && mapContainer.current) {
          console.log("Retrying map initialization...");
          initializeMap();
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    }

    // Cleanup on unmount
    return () => {
      if (map.current) {
        console.log("Removing map instance");
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapInitialized]);

  // Clean up any previous markers
  const cleanupMarkers = () => {
    if (markersRef.current.length > 0) {
      console.log(`Removing ${markersRef.current.length} previous markers`);
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
    }
  };

  // Add markers after map is loaded and stations data is available
  useEffect(() => {
    if (!map.current || !mapLoaded || loading || allStations.length === 0) {
      console.log("Skipping marker creation:", {
        mapExists: !!map.current,
        mapLoaded,
        loading,
        stationCount: allStations.length,
      });
      return;
    }

    console.log("Adding markers to map");
    const mapInstance = map.current;

    // Clean up any previous markers first
    cleanupMarkers();

    // Add markers for each station - limit to visible area to improve performance
    const bounds = mapInstance.getBounds();
    const visibleStations = allStations.filter((station) => {
      if (!station.latitude || !station.longitude) return false;

      // Check if station is within current map bounds
      return bounds.contains([
        station.longitude as number,
        station.latitude as number,
      ]);
    });

    // If too many stations are visible, only show some based on price class
    // to avoid overloading the map with markers
    let stationsToShow = visibleStations;
    const maxMarkers = 400; // Limit maximum number of markers for performance

    if (visibleStations.length > maxMarkers) {
      console.log(
        `Too many stations (${visibleStations.length}), filtering to important ones`
      );

      // Always show collected stations
      const collectedStations = visibleStations.filter((station) =>
        collectedStationIds.has(station.id)
      );

      // Then add higher price classes until we reach the limit
      const uncollectedStations = visibleStations
        .filter((station) => !collectedStationIds.has(station.id))
        .sort((a, b) => a.priceClass - b.priceClass); // Sort by price class (ascending)

      // Calculate how many uncollected stations we can show
      const remainingSlots = Math.max(0, maxMarkers - collectedStations.length);
      const uncollectedToShow = uncollectedStations.slice(0, remainingSlots);

      stationsToShow = [...collectedStations, ...uncollectedToShow];
    }

    // Sort stations so that collected ones are added last (will be on top)
    stationsToShow.sort((a, b) => {
      const aCollected = collectedStationIds.has(a.id);
      const bCollected = collectedStationIds.has(b.id);

      if (aCollected === bCollected) {
        // If both are collected or both are uncollected, sort by price class
        return a.priceClass - b.priceClass; // Lower price class (higher value stations) on top
      }

      // Put uncollected first, so collected ones are added last (will be on top)
      return aCollected ? 1 : -1;
    });

    // Create and add markers
    stationsToShow.forEach((station) => {
      // These should be defined at this point due to our filtering above
      const longitude = station.longitude as number;
      const latitude = station.latitude as number;

      // Check if station is in collection
      const isCollected = collectedStationIds.has(station.id);

      // Create popup content
      const popupNode = document.createElement("div");
      popupNode.innerHTML = `
        <h3 class="font-medium">${station.name}</h3>
        <p class="text-sm">Price Class: ${station.priceClass}</p>
        <p class="text-sm">Points: ${station.pointValue}</p>
        ${
          station.operator
            ? `<p class="text-sm">Operator: ${station.operator}</p>`
            : ""
        }
        ${
          isCollected
            ? `<p class="text-sm text-green-600">In your collection</p>`
            : `<p class="text-sm text-gray-500">Not collected yet</p>`
        }
      `;

      // Create popup
      const popup = new maptilersdk.Popup({
        closeButton: true,
        closeOnClick: true,
        offset: 10,
        className: "station-popup",
      }).setDOMContent(popupNode);

      // Create custom marker element
      const markerElement = createCustomMarker(station, isCollected);

      // Create marker with popup
      const marker = new maptilersdk.Marker({
        element: markerElement,
      })
        .setLngLat([longitude, latitude])
        .setPopup(popup)
        .addTo(mapInstance);

      markersRef.current.push(marker);
    });

    console.log(`Added ${markersRef.current.length} markers to the map`);

    // Update markers when map is moved
    const updateMarkers = () => {
      if (!map.current || !mapLoaded) return;
      cleanupMarkers();

      const newBounds = map.current.getBounds();
      const newVisibleStations = allStations.filter((station) => {
        if (!station.latitude || !station.longitude) return false;
        return newBounds.contains([
          station.longitude as number,
          station.latitude as number,
        ]);
      });

      // Sort stations (collected ones last to be on top)
      const sortedStations = [...newVisibleStations].sort((a, b) => {
        const aCollected = collectedStationIds.has(a.id);
        const bCollected = collectedStationIds.has(b.id);

        if (aCollected === bCollected) {
          return a.priceClass - b.priceClass; // Lower price class on top
        }

        return aCollected ? 1 : -1;
      });

      // Apply the same filtering logic as above
      let newStationsToShow = sortedStations;
      if (sortedStations.length > maxMarkers) {
        const collectedStations = sortedStations.filter((station) =>
          collectedStationIds.has(station.id)
        );

        const uncollectedStations = sortedStations
          .filter((station) => !collectedStationIds.has(station.id))
          .sort((a, b) => a.priceClass - b.priceClass);

        const remainingSlots = Math.max(
          0,
          maxMarkers - collectedStations.length
        );
        const uncollectedToShow = uncollectedStations.slice(0, remainingSlots);

        newStationsToShow = [...uncollectedToShow, ...collectedStations];
      }

      newStationsToShow.forEach((station) => {
        const longitude = station.longitude as number;
        const latitude = station.latitude as number;
        const isCollected = collectedStationIds.has(station.id);
        const markerElement = createCustomMarker(station, isCollected);

        // Create marker with popup for popup interaction
        const popupNode = document.createElement("div");
        popupNode.innerHTML = `
          <h3 class="font-medium">${station.name}</h3>
          <p class="text-sm">Price Class: ${station.priceClass}</p>
          <p class="text-sm">Points: ${station.pointValue}</p>
          ${
            station.operator
              ? `<p class="text-sm">Operator: ${station.operator}</p>`
              : ""
          }
          ${
            isCollected
              ? `<p class="text-sm text-green-600">In your collection</p>`
              : `<p class="text-sm text-gray-500">Not collected yet</p>`
          }
        `;

        // Create popup
        const popup = new maptilersdk.Popup({
          closeButton: true,
          closeOnClick: true,
          offset: 10,
          className: "station-popup",
        }).setDOMContent(popupNode);

        const marker = new maptilersdk.Marker({
          element: markerElement,
        })
          .setLngLat([longitude, latitude])
          .setPopup(popup)
          .addTo(map.current!);

        markersRef.current.push(marker);
      });
    };

    // Add event listeners for map movement
    mapInstance.on("moveend", updateMarkers);

    // Cleanup markers on component update
    return () => {
      mapInstance.off("moveend", updateMarkers);
      cleanupMarkers();
    };
  }, [allStations, mapLoaded, loading, collectedStationIds]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-4 text-center">
        <p className="text-gray-600">Loading stations map...</p>
      </div>
    );
  }

  if (allStations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-4 text-center">
        <p className="text-gray-600">
          No stations with map coordinates available
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <h2 className="text-lg font-medium text-gray-800 mb-3">Station Map</h2>
      <div className="mb-2 text-sm">
        <span className="inline-block mr-4">
          <span className="inline-block w-3 h-3 rounded-full bg-[#0066ff] mr-1"></span>{" "}
          Collected
        </span>
        <span className="inline-block">
          <span className="inline-block w-3 h-3 rounded-full bg-[#808080] mr-1"></span>{" "}
          Not collected
        </span>
        <span className="ml-4 text-xs text-gray-500">
          Larger markers = higher price class (lower number)
        </span>
      </div>
      <div
        ref={mapContainer}
        id="map-container"
        className="relative w-full h-[400px] overflow-hidden"
        style={{
          position: "relative",
          width: "100%",
          height: "400px",
          overflow: "hidden",
        }}
      />
    </div>
  );
}

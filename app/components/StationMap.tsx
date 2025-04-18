"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Icon, IconOptions, LatLngTuple } from "leaflet";
import { CollectionEntry } from "@/app/lib/db";

// Fix for Leaflet marker icon issue in Next.js
const createIcon = () => {
  return new Icon({
    iconUrl: "/marker-icon.png",
    shadowUrl: "/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  } as IconOptions);
};

interface StationMapProps {
  entries: CollectionEntry[];
}

export default function StationMap({ entries }: StationMapProps) {
  const validEntries = entries.filter(
    (entry) => entry.station.latitude && entry.station.longitude
  );

  // Default center to Germany if no stations or all invalid
  const defaultCenter: LatLngTuple = [51.1657, 10.4515]; // Center of Germany

  // Find stations with coordinates
  const hasValidStations = validEntries.length > 0;

  // Dynamic import for marker icon fix
  useEffect(() => {
    // Fix Leaflet icon issue
    delete (Icon.Default.prototype as any)._getIconUrl;
    Icon.Default.mergeOptions({
      iconRetinaUrl: "/marker-icon-2x.png",
      iconUrl: "/marker-icon.png",
      shadowUrl: "/marker-shadow.png",
    });
  }, []);

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
      <div style={{ height: "400px", width: "100%" }}>
        <MapContainer
          center={defaultCenter}
          zoom={5}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {validEntries.map((entry) =>
            entry.station.latitude && entry.station.longitude ? (
              <Marker
                key={entry.stationId}
                position={
                  [
                    entry.station.latitude,
                    entry.station.longitude,
                  ] as LatLngTuple
                }
                icon={createIcon()}
              >
                <Popup>
                  <div>
                    <h3 className="font-medium">{entry.station.name}</h3>
                    <p className="text-sm">
                      Price Class: {entry.station.priceClass}
                    </p>
                    <p className="text-sm">
                      Points: {entry.station.pointValue}
                    </p>
                    {entry.station.operator && (
                      <p className="text-sm">
                        Operator: {entry.station.operator}
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ) : null
          )}
        </MapContainer>
      </div>
    </div>
  );
}

"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import * as maptilersdk from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";
import { CollectionEntry, Station } from "@/app/lib/db";
import { getAllStations } from "@/app/lib/stations";
import { Button } from "@/app/components/ui/button";
import { Settings, Loader2, WifiOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { Switch } from "@/app/components/ui/switch";
import { addStationToCollection as addStationToClientDb } from "@/app/lib/collection";
import { BottomSheet } from "@/app/components/ui/BottomSheet";

// Initialize MapTiler with your API key
if (!process.env.NEXT_PUBLIC_MAPTILER_API_KEY) {
  console.error(
    "NEXT_PUBLIC_MAPTILER_API_KEY is not set - maps will not work!"
  );
} else {
  maptilersdk.config.apiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;
}

// Type for Nominatim API response
interface NominatimResponse {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address: {
    railway?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city_district?: string;
    city?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
    [key: string]: string | undefined;
  };
  boundingbox: string[];
}

interface StationMapProps {
  entries: CollectionEntry[];
  onCollectionUpdated?: () => void;
}

export default function StationMap({
  entries,
  onCollectionUpdated,
}: StationMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maptilersdk.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [allStationsData, setAllStationsData] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapInitialized, setMapInitialized] = useState(false);
  const markersRef = useRef<maptilersdk.Marker[]>([]);
  const [showUncollected, setShowUncollected] = useState(true);
  const [addingToCollection, setAddingToCollection] = useState<string | null>(
    null
  );
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [locationDetails, setLocationDetails] =
    useState<NominatimResponse | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // State to hold the set of collected station IDs to trigger re-renders
  const [collectedStationIds, setCollectedStationIds] = useState(
    new Set(entries.map((entry) => entry.stationId))
  );

  // Check online status
  useEffect(() => {
    const handleOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    // Set initial status
    setIsOnline(navigator.onLine);

    // Add event listeners
    window.addEventListener("online", handleOnlineStatus);
    window.addEventListener("offline", handleOnlineStatus);

    // Cleanup
    return () => {
      window.removeEventListener("online", handleOnlineStatus);
      window.removeEventListener("offline", handleOnlineStatus);
    };
  }, []);

  useEffect(() => {
    // When the entries prop changes (from useCollection), update our local state Set
    setCollectedStationIds(new Set(entries.map((entry) => entry.stationId)));
  }, [entries]);

  const isStationCollected = useCallback(
    (stationId: string): boolean => {
      return collectedStationIds.has(stationId);
    },
    [collectedStationIds]
  );

  const validCollectionEntries = entries.filter(
    (entry) => entry.station.latitude && entry.station.longitude
  );

  const defaultCenter: [number, number] = [10.4515, 51.1657];

  const getMarkerScale = (priceClass: number, isCollected: boolean): number => {
    const invertedScale = 8 - priceClass;
    const baseScale = 0.5 + invertedScale * 0.1;
    return isCollected ? baseScale * 1.2 : baseScale * 0.85;
  };

  const createCustomMarker = (
    station: Station,
    isCollected: boolean,
    isSelected: boolean
  ): HTMLElement => {
    const color = isCollected
      ? "var(--color-action)"
      : "var(--color-secondary-marker, #777777)";
    const scale = getMarkerScale(station.priceClass, isCollected);
    const baseSize = 12;
    const size = Math.round(baseSize * scale);
    const el = document.createElement("div");
    const wrapper = document.createElement("div");
    wrapper.style.width = `${size + 2}px`;
    wrapper.style.height = `${size + 2}px`;
    wrapper.style.display = "flex";
    wrapper.style.justifyContent = "center";
    wrapper.style.alignItems = "center";
    wrapper.style.cursor = "pointer";
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.borderRadius = "50%";
    el.style.backgroundColor = color;
    el.style.boxShadow = "0 0 3px rgba(0,0,0,0.3)";
    if (isSelected) {
      el.style.border = "2px solid white";
    } else {
      el.style.border = "none";
    }
    if (size >= 14) {
      const textEl = document.createElement("div");
      textEl.textContent = station.priceClass.toString();
      textEl.style.color = "white";
      textEl.style.fontWeight = "bold";
      textEl.style.textAlign = "center";
      textEl.style.lineHeight = `${size}px`;
      textEl.style.fontSize = `${Math.max(8, size / 2)}px`;
      el.appendChild(textEl);
    }
    if (isCollected) {
      el.style.zIndex = "1000";
    }
    wrapper.appendChild(el);
    return wrapper;
  };

  const handleAddToClientCollection = async (
    stationToCollect: Station
  ): Promise<boolean> => {
    if (!stationToCollect) return false;

    // 1. Set loading state for the specific station being added
    setAddingToCollection(stationToCollect.id);

    try {
      // 2. Attempt to add to client-side IndexedDB
      const success = await addStationToClientDb(stationToCollect);

      if (success) {
        console.log("Successfully added to client DB");

        // 3. Notify parent to refresh the main collection data (`entries` prop)
        // This is the primary mechanism for updating the UI to "collected"
        if (onCollectionUpdated) {
          onCollectionUpdated();
        }

        // 4. (Optional) Notify the server (fire-and-forget)
        fetch("/api/collection/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stationId: stationToCollect.id }),
        })
          .then(async (apiResponse) => {
            if (!apiResponse.ok) {
              const errorData = await apiResponse.json();
              console.warn(
                "API call to acknowledge station addition failed:",
                errorData.error || apiResponse.statusText
              );
            } else {
              console.log(
                "API call to acknowledge station addition successful."
              );
            }
          })
          .catch((apiError) => {
            console.warn(
              "API call to acknowledge station addition failed:",
              apiError
            );
          });

        return true;
      } else {
        console.log("Station already in client DB or failed to add.");
        // If addStationToClientDb returns false (e.g. already exists),
        // onCollectionUpdated() might not have been called or won't change entries.
        // The UI should already reflect it as collected if it was already in DB.
        return false;
      }
    } catch (error) {
      console.error("Error adding station to client collection:", error);
      return false;
    } finally {
      // 5. Clear loading state for this specific station
      setAddingToCollection(null);
    }
  };

  const fetchLocationDetails = async (lat: number, lon: number) => {
    try {
      setLocationLoading(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
        {
          headers: {
            "User-Agent": "Bahnhofjaeger/1.0 (luis.w.kisters@gmail.com)",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch location details");
      const data: NominatimResponse = await response.json();
      setLocationDetails(data);
    } catch (error) {
      console.error("Error fetching location details:", error);
      setLocationDetails(null);
    } finally {
      setLocationLoading(false);
    }
  };

  const openStationDetails = (station: Station) => {
    setSelectedStation(station);
    setBottomSheetOpen(true);
    setLocationDetails(null);
    if (station.latitude && station.longitude) {
      fetchLocationDetails(station.latitude, station.longitude);
    }
  };

  useEffect(() => {
    async function loadStationsForMap() {
      try {
        setLoading(true);
        const stations = await getAllStations();
        const validStations = stations.filter(
          (station) => station.latitude && station.longitude
        );
        setAllStationsData(validStations);
      } catch (error) {
        console.error("Error loading stations for map:", error);
        setLoadError("Fehler beim Laden der Stationsdaten");
      } finally {
        setLoading(false);
      }
    }
    loadStationsForMap();
  }, []);

  useEffect(() => {
    if (mapInitialized || !isOnline) return;

    const initializeMap = () => {
      if (!mapContainer.current) return false;
      try {
        map.current = new maptilersdk.Map({
          container: mapContainer.current,
          style: maptilersdk.MapStyle.BASIC.DARK,
          center: defaultCenter,
          zoom: 5,
          maxZoom: 18,
          minZoom: 3,
          attributionControl: false,
          navigationControl: false,
          geolocateControl: false,
        });
        map.current.on("load", () => setMapLoaded(true));
        map.current.on("error", (e) => {
          console.error("Map error:", e);
          setLoadError("Fehler beim Laden der Karte");
        });
        setMapInitialized(true);
        return true;
      } catch (error) {
        console.error("Error initializing map:", error);
        setLoadError("Fehler beim Initialisieren der Karte");
        return false;
      }
    };
    if (!initializeMap()) {
      const timeoutId = setTimeout(() => {
        if (!mapInitialized && mapContainer.current) initializeMap();
      }, 500);
      return () => clearTimeout(timeoutId);
    }
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapInitialized, isOnline]);

  const cleanupMarkers = () => {
    if (markersRef.current.length > 0) {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
    }
  };

  useEffect(() => {
    if (!map.current || !mapLoaded || loading || allStationsData.length === 0) {
      return;
    }
    const mapInstance = map.current;
    const maxMarkers = 400;
    cleanupMarkers();

    const bounds = mapInstance.getBounds();
    const visibleStations = allStationsData.filter((station) => {
      if (!station.latitude || !station.longitude) return false;
      return bounds.contains([
        station.longitude as number,
        station.latitude as number,
      ]);
    });

    let filteredStations = visibleStations;
    if (!showUncollected) {
      filteredStations = visibleStations.filter((station) =>
        collectedStationIds.has(station.id)
      );
    }

    let stationsToShow = filteredStations;
    if (filteredStations.length > maxMarkers) {
      const collectedInView = filteredStations.filter((s) =>
        collectedStationIds.has(s.id)
      );
      const uncollectedInView = filteredStations
        .filter((s) => !collectedStationIds.has(s.id))
        .sort((a, b) => a.priceClass - b.priceClass);
      const remainingSlots = Math.max(0, maxMarkers - collectedInView.length);
      stationsToShow = [
        ...collectedInView,
        ...uncollectedInView.slice(0, remainingSlots),
      ];
    }

    stationsToShow.sort((a, b) => {
      const aCollected = collectedStationIds.has(a.id);
      const bCollected = collectedStationIds.has(b.id);
      if (aCollected === bCollected) return a.priceClass - b.priceClass;
      return aCollected ? 1 : -1;
    });

    stationsToShow.forEach((station) => {
      const longitude = station.longitude as number;
      const latitude = station.latitude as number;
      const isCollected = collectedStationIds.has(station.id);
      const markerElement = createCustomMarker(station, isCollected, false);
      const marker = new maptilersdk.Marker({ element: markerElement })
        .setLngLat([longitude, latitude])
        .addTo(mapInstance);
      marker
        .getElement()
        .addEventListener("click", () => openStationDetails(station));
      markersRef.current.push(marker);
    });

    const handleMoveEnd = () => {
      console.log(
        "Map move end, markers might re-evaluate based on visibility logic."
      );
    };

    mapInstance.on("moveend", handleMoveEnd);
    return () => {
      mapInstance.off("moveend", handleMoveEnd);
      cleanupMarkers();
    };
  }, [
    allStationsData,
    mapLoaded,
    loading,
    collectedStationIds,
    showUncollected,
    createCustomMarker,
    openStationDetails,
  ]);

  // Render loading state
  if (!isOnline) {
    return (
      <div className="bg-background-secondary text-white flex flex-col items-center justify-center h-full p-6">
        <WifiOff className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Keine Internetverbindung</h2>
        <p className="text-center text-muted-foreground max-w-xs">
          Die Karte benötigt eine aktive Internetverbindung. Bitte überprüfe
          deine Verbindung und versuche es erneut.
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="bg-background-secondary text-white flex flex-col items-center justify-center h-full p-6">
        <div className="rounded-full bg-red-900/20 p-4 mb-4">
          <WifiOff className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Fehler beim Laden</h2>
        <p className="text-center text-muted-foreground max-w-xs mb-4">
          {loadError}. Bitte versuche es später erneut.
        </p>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          className="border-white/30 hover:bg-white/10 text-white"
        >
          Erneut versuchen
        </Button>
      </div>
    );
  }

  if (loading && allStationsData.length === 0) {
    return (
      <div className="bg-background text-white flex flex-col items-center justify-center h-full">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-lg font-medium">Karte wird geladen...</p>
        <p className="text-sm text-muted-foreground mt-2">
          Stationsdaten werden vorbereitet
        </p>
      </div>
    );
  }

  if (allStationsData.length === 0 && !loading) {
    return (
      <div className="bg-background-secondary text-white text-center p-6">
        <div className="rounded-full bg-yellow-900/20 p-4 mx-auto mb-4 inline-block">
          <WifiOff className="h-8 w-8 text-yellow-500" />
        </div>
        <p className="text-lg font-medium mb-2">
          Keine Stationsdaten verfügbar
        </p>
        <p className="text-sm text-muted-foreground">
          Es sind keine Stationen mit Koordinaten verfügbar
        </p>
      </div>
    );
  }

  return (
    <div className="bg-background w-full h-full flex flex-col">
      <div className="flex-1 relative min-h-0">
        <div
          ref={mapContainer}
          id="map-container"
          className="absolute inset-0"
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            overflow: "hidden",
          }}
        />
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogTrigger asChild>
            <Button
              variant="secondary"
              className="absolute top-4 right-4 z-10 shadow-lg rounded-lg mt-[60px] bg-background-secondary w-14 h-14 p-1 flex items-center justify-center"
              aria-label="Map Settings"
            >
              <Settings
                strokeWidth={2.5}
                style={{ width: "1rem", height: "1rem" }}
                className="text-white"
              />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Karten Einstellungen</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="show-uncollected"
                  className="text-sm font-medium"
                >
                  Unbesuchte Bahnhöfe anzeigen
                </label>
                <Switch
                  id="show-uncollected"
                  checked={showUncollected}
                  onCheckedChange={setShowUncollected}
                />
              </div>
              <div className="mt-4 pt-4 border-t">
                <h3 className="text-sm font-medium mb-2">Legende</h3>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center">
                    <span className="inline-block w-3 h-3 rounded-full bg-[var(--color-action)] mr-2"></span>{" "}
                    Collected Station (Red)
                  </div>
                  <div className="flex items-center">
                    <span className="inline-block w-3 h-3 rounded-full bg-[var(--color-secondary-marker, #777777)] mr-2"></span>{" "}
                    Not Collected Station (Gray)
                  </div>
                  <p className="text-gray-500 mt-1">
                    Größere Marker = höhere Preisklasse (kleinere Zahl).
                  </p>
                  <p className="text-gray-500 mt-1">
                    Weniger wichtige Bahnhöfe (höhere Preisklasse) werden bei
                    niedrigerem Zoom ausgeblendet.
                  </p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <BottomSheet
        station={selectedStation}
        isOpen={bottomSheetOpen}
        onClose={() => setBottomSheetOpen(false)}
        onAddToClientCollection={handleAddToClientCollection}
        isCollected={isStationCollected}
        isAddingToCollection={addingToCollection}
        locationDetails={locationDetails}
        locationLoading={locationLoading}
      />
    </div>
  );
}

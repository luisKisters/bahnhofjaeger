"use client";

import React, { useRef, useEffect, useState } from "react";
import { Station } from "@/app/lib/db";
import { Button } from "@/app/components/ui/button";
import {
  X,
  ChevronUp,
  Map,
  MapPinned,
  Info,
  Loader2,
  Package,
  MapPinPlusInside,
} from "lucide-react";

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

interface BottomSheetProps {
  station: Station | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToClientCollection: (station: Station) => Promise<boolean>;
  isCollected: (stationId: string) => boolean;
  isAddingToCollection: string | null;
  locationDetails: NominatimResponse | null;
  locationLoading: boolean;
}

export function BottomSheet({
  station,
  isOpen,
  onClose,
  onAddToClientCollection,
  isCollected,
  isAddingToCollection,
  locationDetails,
  locationLoading,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [showDetailedInfo, setShowDetailedInfo] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);

  useEffect(() => {
    setShowDetailedInfo(false);
  }, [station, isOpen]);

  const toggleDetailView = () => {
    setShowDetailedInfo(!showDetailedInfo);
  };

  const handleDragStart = (clientY: number) => {
    if (!sheetRef.current || showDetailedInfo) return;
    setIsDragging(true);
    setStartY(clientY);
    sheetRef.current.style.transition = "none";
  };

  const handleDragMove = (clientY: number) => {
    if (!isDragging || !sheetRef.current || showDetailedInfo) return;
    const deltaY = clientY - startY;
    if (deltaY >= 0) {
      sheetRef.current.style.transform = `translateY(${deltaY}px)`;
    }
  };

  const handleDragEnd = () => {
    if (!isDragging || !sheetRef.current || showDetailedInfo) return;
    setIsDragging(false);
    sheetRef.current.style.transition = "transform 0.3s ease-out";

    const transformStyle = sheetRef.current.style.transform;
    const translateYMatch = transformStyle.match(/translateY\(([^px%]+)px\)/);
    let currentTranslateY = 0;
    if (translateYMatch && translateYMatch[1]) {
      currentTranslateY = parseFloat(translateYMatch[1]);
    }

    if (currentTranslateY > 100) {
      onClose();
    } else {
      sheetRef.current.style.transform = "translateY(0%)";
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => handleDragStart(e.clientY);
  const handleMouseMove = (e: React.MouseEvent) => handleDragMove(e.clientY);
  const handleMouseUp = () => handleDragEnd();
  const handleTouchStart = (e: React.TouchEvent) =>
    handleDragStart(e.touches[0].clientY);
  const handleTouchMove = (e: React.TouchEvent) =>
    handleDragMove(e.touches[0].clientY);
  const handleTouchEnd = () => handleDragEnd();

  if (!isOpen) return null;

  const sheetStyle: React.CSSProperties = {
    position: "fixed",
    left: 0,
    right: 0,
    boxShadow: "0 -2px 10px rgba(0,0,0,0.1)",
    overflowY: "auto",
  };

  if (!isDragging) {
    sheetStyle.transition =
      "transform 0.3s ease-out, height 0.3s ease-out, top 0.3s ease-out, border-radius 0.3s ease-out";
  }

  if (showDetailedInfo) {
    sheetStyle.top = "0px";
    sheetStyle.bottom = "0px";
    sheetStyle.height = "100vh";
    sheetStyle.maxHeight = "100vh";
    sheetStyle.borderRadius = "0px";
    sheetStyle.zIndex = 60;
    sheetStyle.transform = "translateY(0%)";
  } else {
    sheetStyle.bottom = "0px";
    sheetStyle.top = "auto";
    sheetStyle.maxHeight = "75vh";
    sheetStyle.height = "auto";
    sheetStyle.borderRadius = "1rem 1rem 0 0";
    sheetStyle.zIndex = 35;
    if (!isDragging) {
      sheetStyle.transform = "translateY(0%)";
    }
  }
  if (!isOpen) {
    sheetStyle.transform = "translateY(100%)";
  } else if (!isDragging && !showDetailedInfo) {
    if (
      sheetRef.current &&
      sheetRef.current.style.transform !== "translateY(0%)"
    ) {
      // Empty block to match original code
    }
  }

  return (
    <div
      ref={sheetRef}
      style={sheetStyle}
      className={`p-4 bg-background-secondary select-none`}
      onMouseMove={
        isDragging && !showDetailedInfo ? handleMouseMove : undefined
      }
      onMouseUp={isDragging && !showDetailedInfo ? handleMouseUp : undefined}
      onMouseLeave={isDragging && !showDetailedInfo ? handleMouseUp : undefined}
      onTouchMove={
        isDragging && !showDetailedInfo ? handleTouchMove : undefined
      }
      onTouchEnd={isDragging && !showDetailedInfo ? handleTouchEnd : undefined}
    >
      {!showDetailedInfo && (
        <div
          className="w-12 h-1.5 bg-background rounded-full mx-auto mb-3 cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        />
      )}
      <Button
        variant="ghost"
        className="absolute top-3 right-3 text-muted-foreground hover:bg-muted/50 rounded-full z-10"
        onClick={showDetailedInfo ? toggleDetailView : onClose}
      >
        {showDetailedInfo ? (
          <ChevronUp className="h-5 w-5" />
        ) : (
          <X className="h-5 w-5" />
        )}
        <span className="sr-only">{showDetailedInfo ? "Back" : "Close"}</span>
      </Button>
      {station ? (
        <div className={`pt-2 ${showDetailedInfo ? "pb-28" : ""}`}>
          <h2 className="text-xl font-semibold mb-1 leading-tight text-white">
            {station.name}
          </h2>
          <p className="text-xs text-muted-foreground mb-3">
            {station.priceClass && `Preisklasse ${station.priceClass} \u00B7 `}
            {station.pointValue} Punkte
          </p>
          {showDetailedInfo ? (
            <>
              <div className="space-y-3 mt-6 text-sm text-white">
                <h3 className="text-base font-medium mb-2">Grunddaten</h3>
                <div className="grid grid-cols-2 gap-y-2">
                  {station.city && (
                    <>
                      <span className="text-muted-foreground">Ort</span>
                      <span className="font-medium">{station.city}</span>
                    </>
                  )}
                  {station.state && (
                    <>
                      <span className="text-muted-foreground">Bundesland</span>
                      <span className="font-medium">{station.state}</span>
                    </>
                  )}
                  {station.verbund && (
                    <>
                      <span className="text-muted-foreground">Verbund</span>
                      <span className="font-medium">{station.verbund}</span>
                    </>
                  )}
                  {station.priceClass && (
                    <>
                      <span className="text-muted-foreground">Preisklasse</span>
                      <span className="font-medium">{station.priceClass}</span>
                    </>
                  )}
                  {station.pointValue && (
                    <>
                      <span className="text-muted-foreground">Punkte</span>
                      <span className="font-medium">{station.pointValue}</span>
                    </>
                  )}
                  {station.stationNumber && (
                    <>
                      <span className="text-muted-foreground">
                        Bahnhofsnummer
                      </span>
                      <span className="font-medium">
                        {station.stationNumber}
                      </span>
                    </>
                  )}
                  {station.evaNumber && (
                    <>
                      <span className="text-muted-foreground">EVA-Nummer</span>
                      <span className="font-medium">{station.evaNumber}</span>
                    </>
                  )}
                </div>

                <h3 className="text-base font-medium mb-2 mt-6">Ausstattung</h3>
                <div className="grid grid-cols-2 gap-y-2">
                  <span className="text-muted-foreground">WLAN</span>
                  <span className="font-medium">
                    {station.hasWifi ? "Ja" : "Nein"}
                  </span>
                  <span className="text-muted-foreground">DB Lounge</span>
                  <span className="font-medium">
                    {station.hasDBLounge ? "Ja" : "Nein"}
                  </span>
                  {station.hasParking !== undefined && (
                    <>
                      <span className="text-muted-foreground">Parkplatz</span>
                      <span className="font-medium">
                        {station.hasParking ? "Ja" : "Nein"}
                      </span>
                    </>
                  )}
                </div>

                {(station.aufgabentraegerShortName ||
                  station.aufgabentraegerName) && (
                  <>
                    <h3 className="text-base font-medium mb-2 mt-6">
                      Aufgabenträger
                    </h3>
                    <div className="grid grid-cols-2 gap-y-2">
                      {station.aufgabentraegerShortName && (
                        <>
                          <span className="text-muted-foreground">Kürzel</span>
                          <span className="font-medium text-right">
                            {station.aufgabentraegerShortName}
                          </span>
                        </>
                      )}
                      {station.aufgabentraegerName && (
                        <>
                          <span className="text-muted-foreground">Name</span>
                          <span className="font-medium text-right">
                            {station.aufgabentraegerName}
                          </span>
                        </>
                      )}
                    </div>
                  </>
                )}
                {locationLoading && (
                  <div className="flex flex-row items-center justify-center mt-3 py-2">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="ml-2 text-sm text-muted-foreground">
                      Standortdetails werden geladen...
                    </span>
                  </div>
                )}
                {locationDetails && (
                  <div className="mt-6">
                    <h3 className="text-base font-medium mb-2 text-white">
                      OpenStreetMap Details
                    </h3>
                    <div className="grid grid-cols-2 gap-y-2">
                      {locationDetails.address.road && (
                        <>
                          <span className="text-muted-foreground">Straße</span>
                          <span className="font-medium">
                            {locationDetails.address.road}
                          </span>
                        </>
                      )}
                      {locationDetails.address.suburb && (
                        <>
                          <span className="text-muted-foreground">
                            Stadtteil
                          </span>
                          <span className="font-medium">
                            {locationDetails.address.suburb}
                          </span>
                        </>
                      )}
                      {locationDetails.address.city_district && (
                        <>
                          <span className="text-muted-foreground">Bezirk</span>
                          <span className="font-medium">
                            {locationDetails.address.city_district}
                          </span>
                        </>
                      )}
                      {locationDetails.address.city && !station.city && (
                        <>
                          <span className="text-muted-foreground">Stadt</span>
                          <span className="font-medium">
                            {locationDetails.address.city}
                          </span>
                        </>
                      )}
                      {locationDetails.address.postcode && (
                        <>
                          <span className="text-muted-foreground">PLZ</span>
                          <span className="font-medium">
                            {locationDetails.address.postcode}
                          </span>
                        </>
                      )}
                      {locationDetails.address.county && (
                        <>
                          <span className="text-muted-foreground">Kreis</span>
                          <span className="font-medium">
                            {locationDetails.address.county}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="fixed bottom-0 left-0 right-0 p-4 bg-background-secondary border-t border-border/20 flex space-x-3 z-20">
                <Button
                  variant="destructive"
                  className="flex-1 shadow-sm flex items-center justify-center gap-2 h-11"
                  onClick={toggleDetailView}
                >
                  <X strokeWidth={3} className="w-5 h-5" />
                  Schließen
                </Button>
                {station.latitude && station.longitude && (
                  <Button
                    variant="secondary"
                    className="flex-1 shadow-sm text-white flex items-center justify-center gap-2 h-11"
                    onClick={() =>
                      window.open(
                        `https://www.openstreetmap.org/?mlat=${station.latitude}&mlon=${station.longitude}#map=17/${station.latitude}/${station.longitude}`,
                        "_blank"
                      )
                    }
                  >
                    <Map strokeWidth={3} className="w-5 h-5" />
                    Karte öffnen
                  </Button>
                )}
              </div>
            </>
          ) : (
            // Compact view
            <>
              <div className="flex space-x-3 mb-4">
                <Button
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm flex items-center justify-center gap-2 h-11"
                  onClick={async () => {
                    if (
                      station &&
                      !isCollected(station.id) &&
                      isAddingToCollection !== station.id
                    ) {
                      await onAddToClientCollection(station);
                    }
                  }}
                  disabled={
                    isAddingToCollection === station.id ||
                    (station && isCollected(station.id))
                  }
                >
                  {isAddingToCollection === station.id ? (
                    <Loader2 strokeWidth={3} className="animate-spin" />
                  ) : station && isCollected(station.id) ? (
                    <Package strokeWidth={3} />
                  ) : (
                    <MapPinPlusInside strokeWidth={3} className="w-6 h-6" />
                  )}
                  {isAddingToCollection === station.id
                    ? "Wird hinzugefügt..."
                    : station && isCollected(station.id)
                    ? "Gesammelt"
                    : "Sammeln"}
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1 shadow-sm flex items-center justify-center gap-2 h-11 text-white"
                  onClick={toggleDetailView}
                >
                  <Info strokeWidth={3} className="w-6 h-6" />
                  Info
                </Button>
              </div>
              <div className="py-2 text-center text-white">
                <p className="text-sm text-muted-foreground">
                  {station.city || station.state || ""}
                  {station.city && station.state && `, ${station.state}`}
                </p>
                {station.priceClass && (
                  <span className="inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                    Preisklasse {station.priceClass}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="text-center py-10 text-white">
          <MapPinned className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-md font-medium">Kein Bahnhof ausgewählt</p>
          <p className="text-xs text-muted-foreground mt-1">
            Klicke auf einen Bahnhof auf der Karte, um Details anzuzeigen oder
            suche oben nach einem Bahnhof.
          </p>
        </div>
      )}
    </div>
  );
}

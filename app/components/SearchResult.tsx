"use client";

import { Check, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { Station } from "../lib/db";
import { addStationToCollection } from "../lib/collection";
import { useState } from "react";

export default function SearchResult(props: {
  station: Station;
  collectionStatus: any;
  refreshCollectionStatus: () => void;
}) {
  const { station, collectionStatus, refreshCollectionStatus } = props;
  const [loading, setLoading] = useState(false);
  const [collected, setCollected] = useState(collectionStatus);

  async function handleAddStation() {
    setLoading(true);
    try {
      console.log("trying to collect station", station);
      const success = await addStationToCollection(station);
      if (!success) {
        // TODO: Show error toast
        console.error("Failed to add station");
      } else {
        console.log("station added to collection");
        setCollected(true);
        refreshCollectionStatus();
      }
    } catch (error) {
      console.error("Error adding station:", error);
    } finally {
      setLoading(false);
      setCollected(true);
    }
  }

  return (
    <div className="flex justify-between items-center bg-background-element mx-3 my-1 p-3 rounded-lg shadow-2xl mb-3.5">
      <div className="flex-row">
        <p className="text-xl">{station.name}</p>
        <p className="text-sm text-secondary -mt-1  ">
          Preisklasse {station.priceClass} • {station.state}
        </p>
      </div>
      <div className="flex items-center gap-x-3">
        {/* <Button>
        Hinzufügen
        <Plus className="" strokeWidth={2.5} size={30} />
      </Button> */}
        <p className="text-secondary">{station.pointValue} Punkte</p>
        <Button
          className="shadow-lg"
          onClick={handleAddStation}
          disabled={collected}
        >
          {collected ? (
            <Check className="" strokeWidth={3} size={30} />
          ) : (
            <Plus className="" strokeWidth={3} size={30} />
          )}
        </Button>
      </div>
    </div>
  );
}

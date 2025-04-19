import { NextRequest, NextResponse } from "next/server";
import { addStationToCollection } from "@/app/lib/collection";
import { getAllStations } from "@/app/lib/stations";

export async function POST(request: NextRequest) {
  try {
    const { stationId } = await request.json();

    if (!stationId) {
      return NextResponse.json(
        { error: "Station ID is required" },
        { status: 400 }
      );
    }

    // Get all stations to find the one with matching ID
    const allStations = await getAllStations();
    const station = allStations.find((s) => s.id === stationId);

    if (!station) {
      return NextResponse.json({ error: "Station not found" }, { status: 404 });
    }

    const success = await addStationToCollection(station);

    if (success) {
      return NextResponse.json({
        success: true,
        message: "Station added to collection",
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Station already in collection or could not be added",
        },
        { status: 409 }
      );
    }
  } catch (error) {
    console.error("Error adding station to collection:", error);
    return NextResponse.json(
      {
        error: "Failed to add station to collection",
      },
      { status: 500 }
    );
  }
}

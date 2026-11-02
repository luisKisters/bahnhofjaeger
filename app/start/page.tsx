import type { Metadata } from "next";
import LandingPage from "@/app/components/LandingPage";

export const metadata: Metadata = {
  title: "Bahnhofjäger – Sammle Bahnhöfe",
  description: "Sammle Bahnhöfe und erhalte Punkte!",
};

export default function StartPage() {
  return <LandingPage />;
}

# Bahnhofjäger

Sammle Bahnhöfe der Deutschen Bahn und erhalte Punkte. Eine offline-fähige PWA fürs Handy.

**[bahnhofjaeger.vercel.app](https://bahnhofjaeger.vercel.app)** · [Landing Page](https://bahnhofjaeger.vercel.app/start)

## Features

- Über 5.400 DB-Bahnhöfe suchen und sammeln (Fuzzy-Suche)
- Punkte nach DB-Preisklasse: kleine Bahnhöfe bringen mehr
- Karte mit gesammelten und offenen Bahnhöfen
- Statistiken und Fortschritt
- Offline-first: alle Daten liegen lokal im Browser, kein Konto nötig

## Tech Stack

Next.js (App Router) · React · TypeScript · Tailwind CSS · IndexedDB · MapTiler SDK · Service Worker / PWA · Vercel

## Quickstart

```bash
pnpm install
echo "NEXT_PUBLIC_MAPTILER_API_KEY=dein_key" > .env.local
pnpm dev
```

Dann [http://localhost:3000](http://localhost:3000) öffnen.

## Datenquellen

Stationsdaten, Preisklassen und Anreicherungs-Skripte (StaDa API) sind in [`resources.md`](./resources.md) beschrieben.

## Play Store Early Access

Die Android-App ist im geschlossenen Test im Google Play Store. Für Early Access [schreib mir eine E-Mail](mailto:luis.w.kisters@gmail.com).

## Lizenz

Für private und Lernzwecke. Fragen zur Lizenz: [Kontakt](mailto:luis.w.kisters@gmail.com).

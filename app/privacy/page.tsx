import React from "react";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="max-w-md mx-auto p-4 text-white">
      <h1 className="text-2xl font-bold mb-4">Datenschutzerklärung</h1>
      <p className="mb-2 text-sm text-gray-500">
        Letzte Aktualisierung: 1. Mai 2025
      </p>
      <h2 className="text-lg font-semibold mt-4 mb-2">1. Überblick</h2>
      <p>
        Bahnhofjaeger ist eine mobile Progressive Web App (PWA) zum Sammeln von
        Bahnhöfen. Deine Privatsphäre ist uns wichtig. Die App funktioniert
        komplett offline und speichert alle Daten ausschließlich lokal auf
        deinem Gerät.
      </p>
      <h2 className="text-lg font-semibold mt-4 mb-2">
        2. Welche Daten werden gespeichert?
      </h2>
      <ul className="list-disc ml-6 mb-2">
        <li>
          Alle Stationsdaten, deine Sammlung und Statistiken werden nur lokal im
          Browser (IndexedDB) gespeichert.
        </li>
        <li>
          Es werden keine persönlichen Daten an uns oder Dritte übertragen.
        </li>
        <li>Es ist keine Registrierung oder Anmeldung erforderlich.</li>
        <li>Es gibt keine Analyse- oder Werbedienste.</li>
      </ul>
      <h2 className="text-lg font-semibold mt-4 mb-2">
        3. Drittanbieter-Dienste
      </h2>
      <p>
        Für Kartenfunktionen werden Kartendaten von MapTiler geladen. Dabei kann
        deine IP-Adresse an MapTiler übermittelt werden. Weitere Informationen
        findest du in der{" "}
        <a
          href="https://www.maptiler.com/privacy-policy/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-blue-600"
        >
          MapTiler Datenschutzerklärung
        </a>
        .
      </p>
      <h2 className="text-lg font-semibold mt-4 mb-2">
        4. Offline-Funktionalität
      </h2>
      <p>
        Die App ist vollständig offline nutzbar. Alle Funktionen stehen auch
        ohne Internetverbindung zur Verfügung.
      </p>
      <h2 className="text-lg font-semibold mt-4 mb-2">5. Daten löschen</h2>
      <p>
        Du kannst jederzeit die Browserdaten löschen, um alle App-Daten von
        deinem Gerät zu entfernen.
      </p>
      <h2 className="text-lg font-semibold mt-4 mb-2">6. Änderungen</h2>
      <p>
        Bei Änderungen an der App wird diese Datenschutzerklärung entsprechend
        aktualisiert. Die jeweils aktuelle Version findest du immer auf dieser
        Seite.
      </p>
      <h2 className="text-lg font-semibold mt-4 mb-2">7. Kontakt</h2>
      <p>
        Bei Fragen zum Datenschutz kontaktiere uns über die Projektseite oder
        den App Store Eintrag.
      </p>
      <div className="text-xs text-gray-400 text-center mt-2">
        <Link href="/privacy" className="underline hover:text-blue-600">
          Privacy Policy
        </Link>
      </div>
    </div>
  );
}

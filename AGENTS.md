# Hinweise für KI-Agenten

Dieses Dokument enthält spezifische Richtlinien und Konventionen für zukünftige KI-Agenten, die an diesem Repository arbeiten.

## Projektstruktur
- `src/App.tsx`: Hauptkomponente und UI-Layout (React).
- `src/services/gemini.ts`: Kernlogik für die Kommunikation mit der Gemini API und Definition der Agenten-Werkzeuge.
- `src/data.json`: Mock-Datenbank für Bestellungen und Bewertungen.
- `vite.config.ts`: Vite-Konfiguration, die den `GEMINI_API_KEY` aus der Umgebung in die App injiziert.

## Wichtige Konventionen
- **Sprache**: Die gesamte Benutzeroberfläche und alle Agenten-Antworten müssen auf Deutsch sein.
- **Styling**: Tailwind CSS wird für das Styling verwendet. Keine separaten CSS-Dateien für Komponenten erstellen.
- **Icons**: Verwenden Sie ausschließlich `lucide-react`.
- **Zustandsverwaltung**: React Hooks (`useState`, `useEffect`) werden für den lokalen Zustand verwendet.

## Setup & Verifizierung
- Stellen Sie sicher, dass der `GEMINI_API_KEY` in der `.env` Datei vorhanden ist, bevor Sie die Agenten-Funktionen testen.
- Der Entwicklungsserver läuft standardmäßig auf Port 3000.
- Wenn Sie neue Umgebungsvariablen hinzufügen, müssen diese in `vite.config.ts` unter `define` hinzugefügt und in `.env.example` dokumentiert werden.

## Bekannte Fallstricke
- **HMR (Hot Module Replacement)**: HMR ist in der AI Studio-Umgebung deaktiviert (`DISABLE_HMR=true`), um Flackern zu vermeiden. Ändern Sie diese Einstellung nicht.
- **Vite Env Vars**: Die App verwendet `process.env.GEMINI_API_KEY` anstelle von `import.meta.env`, da dies in der `vite.config.ts` explizit so definiert wurde. Behalten Sie dieses Muster für den API-Schlüssel bei.

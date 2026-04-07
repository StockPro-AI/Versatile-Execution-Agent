# Hinweise für KI-Agenten

Dieses Dokument enthält spezifische Richtlinien und Konventionen für zukünftige KI-Agenten, die an diesem Repository arbeiten.

## Projektstruktur
- `src/App.tsx`: Hauptkomponente und UI-Layout (React). Enthält auch den API Manager und Cost Tracker.
- `src/services/gemini.ts`: Kernlogik für die Kommunikation mit LLMs und Definition der Agenten-Werkzeuge. Unterstützt Gemini und andere OpenAI-kompatible Provider.
- `src/contexts/ProviderContext.tsx`: Verwaltet den Zustand der LLM-Provider (API-Schlüssel, Modelle, Kosten) und speichert diese in `localStorage`.
- `src/data.json`: Mock-Datenbank für Bestellungen und Bewertungen.
- `vite.config.ts`: Vite-Konfiguration, die den `GEMINI_API_KEY` aus der Umgebung in die App injiziert.

## Wichtige Konventionen
- **Sprache**: Die gesamte Benutzeroberfläche und alle Agenten-Antworten müssen auf Deutsch sein. Code und Variablen auf Englisch.
- **Styling**: Tailwind CSS wird für das Styling verwendet. Das Design folgt einem futuristischen Dark-Theme mit Glassmorphismus, Tiefenstaffelung und Gold/Silber-Akzenten (definiert in `src/index.css`).
- **Icons**: Verwenden Sie ausschließlich `lucide-react`.
- **Zustandsverwaltung**: React Hooks (`useState`, `useEffect`) und Context API (`ProviderContext`) werden verwendet.

## Setup & Verifizierung
- Stellen Sie sicher, dass der `GEMINI_API_KEY` in der `.env` Datei vorhanden ist, bevor Sie die Agenten-Funktionen testen.
- Weitere API-Schlüssel (OpenAI, Mistral, etc.) können über den API Manager in der UI konfiguriert werden.
- Der Entwicklungsserver läuft standardmäßig auf Port 3000.
- Wenn Sie neue Umgebungsvariablen hinzufügen, müssen diese in `vite.config.ts` unter `define` hinzugefügt und in `.env.example` dokumentiert werden.

## Bekannte Fallstricke
- **HMR (Hot Module Replacement)**: HMR ist in der AI Studio-Umgebung deaktiviert (`DISABLE_HMR=true`), um Flackern zu vermeiden. Ändern Sie diese Einstellung nicht.
- **Vite Env Vars**: Die App verwendet `process.env.GEMINI_API_KEY` anstelle von `import.meta.env`, da dies in der `vite.config.ts` explizit so definiert wurde. Behalten Sie dieses Muster für den API-Schlüssel bei.
- **Tool-Calling bei Drittanbietern**: Aktuell werden Tools (Function Calling) primär für Gemini unterstützt. Bei anderen Providern wird ein Fallback auf reine Textgenerierung verwendet. Für eine vollständige Integration müssen die Gemini-Tools in das OpenAI-Format konvertiert werden.

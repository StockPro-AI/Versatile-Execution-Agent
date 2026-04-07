# Retail Agenten-Dashboard

Ein React-basiertes Dashboard für E-Commerce-Operationen, das den Gemini API-Agenten integriert.

## Voraussetzungen
- Node.js (v20 oder neuer empfohlen)
- npm
- Ein Gemini API Key

## Setup & Lokale Entwicklung

1. Repository klonen und in das Verzeichnis wechseln.
2. Kopieren Sie die `.env.example` zu `.env` und fügen Sie Ihren Gemini API Key ein:
   ```bash
   cp .env.example .env
   ```
3. Abhängigkeiten installieren:
   ```bash
   npm install
   ```
4. Entwicklungsserver starten:
   ```bash
   npm run dev
   ```
   Die Anwendung ist dann unter `http://localhost:3000` erreichbar.

## Docker Nutzung

Sie können die Anwendung auch mit Docker ausführen:

```bash
docker-compose up --build
```
Die Anwendung wird auf Port 3000 gestartet. Stellen Sie sicher, dass Ihre `.env` Datei existiert.

## Windows One-Click Start

Für Windows-Nutzer gibt es eine `start.bat` Datei. Ein Doppelklick darauf installiert die Abhängigkeiten und startet den Server automatisch. Falls noch keine `.env` Datei existiert, wird diese aus der `.env.example` erstellt.

## Fehlerbehebung
- **Fehlender API-Key**: Wenn der Agent nicht antwortet, prüfen Sie, ob der `GEMINI_API_KEY` in der `.env` korrekt gesetzt ist.
- **Port-Konflikte**: Der Standardport ist 3000. Falls dieser belegt ist, können Sie ihn in der `package.json` anpassen.

# Retail Agenten-Dashboard

Ein React-basiertes Dashboard für E-Commerce-Operationen, das KI-Agenten integriert.

## 🚀 Empfohlenes Setup: Windows One-Click Start

Für Windows-Nutzer bieten wir einen vollautomatischen One-Click Start an. Dies ist die bevorzugte und einfachste Methode, um das Projekt zu starten.

1. Führen Sie einfach einen Doppelklick auf die Datei `start.bat` im Hauptverzeichnis aus.
2. Das Skript installiert automatisch alle Abhängigkeiten und startet den Server.
3. Falls noch keine `.env` Datei existiert, wird diese aus der `.env.example` erstellt. Sie werden dann aufgefordert, Ihre API-Schlüssel einzutragen.

---

## Alternative Setup-Methoden

### Voraussetzungen
- Node.js (v20 oder neuer empfohlen)
- npm
- Entsprechende API Keys für die gewünschten LLM-Anbieter

### Setup & Lokale Entwicklung (Manuell)

1. Repository klonen und in das Verzeichnis wechseln.
2. Kopieren Sie die `.env.example` zu `.env` und fügen Sie Ihre API Keys ein:
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

### Docker Nutzung

Sie können die Anwendung auch mit Docker ausführen:

```bash
docker-compose up --build
```
Die Anwendung wird auf Port 3000 gestartet. Stellen Sie sicher, dass Ihre `.env` Datei existiert.

## Fehlerbehebung
- **Fehlende API-Keys**: Wenn der Agent nicht antwortet, prüfen Sie, ob die API-Schlüssel in der `.env` oder im API Manager der App korrekt gesetzt sind.
- **Port-Konflikte**: Der Standardport ist 3000. Falls dieser belegt ist, können Sie ihn in der `package.json` anpassen.

@echo off
echo Starte Setup und Anwendung...

IF NOT EXIST ".env" (
    echo Erstelle .env Datei aus .env.example...
    copy .env.example .env
    echo BITTE TRAGEN SIE IHREN GEMINI_API_KEY IN DIE .ENV DATEI EIN!
    pause
)

echo Installiere Abhängigkeiten...
call npm install

echo Starte Entwicklungsserver...
call npm run dev

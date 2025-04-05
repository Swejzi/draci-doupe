# AI Dračí doupě

Webová aplikace pro hraní RPG hry "Dračí doupě" s Pánem jeskyně řízeným umělou inteligencí Google Gemini.

## Struktura projektu

-   `/backend`: Node.js (Express) server pro API, herní logiku a integraci s AI.
-   `/frontend`: React (Vite) aplikace pro uživatelské rozhraní.
-   `/stories`: Adresář pro JSON/YAML soubory s herními příběhy.

## Požadavky

-   Node.js (doporučená verze 18+)
-   npm nebo yarn
-   PostgreSQL databáze (běžící lokálně nebo vzdáleně)
-   API klíč pro Google Gemini (nastavit v `backend/.env`)

## Nastavení

1.  **Backend:**
    ```bash
    cd backend
    npm install
    # Vytvořte soubor .env z .env.example (nebo ho vytvořte ručně)
    # cp .env.example .env
    # Upravte .env - nastavte GEMINI_API_KEY a údaje pro připojení k databázi
    # Spusťte databázové migrace (bude implementováno později)
    ```
2.  **Frontend:**
    ```bash
    cd ../frontend
    npm install
    ```

## Spuštění (Vývoj)

1.  **Backend:**
    ```bash
    cd backend
    npm run dev
    # Server poběží na http://localhost:3001 (nebo dle PORT v .env)
    ```
2.  **Frontend:**
    ```bash
    cd ../frontend
    npm run dev
    # Aplikace poběží na http://localhost:5173 (nebo jiném portu dle Vite)
    ```

## Další kroky

-   Implementace databázového schématu a migrací.
-   Vývoj API endpointů pro uživatele, postavy, hru.
-   Implementace logiky pro načítání a zpracování příběhů.
-   Integrace s Google Gemini API pro generování odpovědí PJ.
-   Vývoj React komponent pro herní rozhraní.

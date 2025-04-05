# AI Dračí doupě

Webová aplikace pro hraní RPG hry "Dračí doupě" s Pánem jeskyně řízeným umělou inteligencí Google Gemini. Projekt umožňuje hráčům vytvářet postavy, prozkoumávat svět a účastnit se dobrodružství s AI Dungeon Masterem.

## Funkce

- **Systém uživatelů**: Registrace, přihlášení a správa uživatelských účtů
- **Vytváření postav**: Vytvořte si vlastní postavu s různými rasami a třídami
- **Herní systém**: Implementace základních pravidel Dračího doupěte
- **Soubojový systém**: Dynamické souboje s iniciativou a různými typy útoků
- **Inventář**: Systém pro správu předmětů a vybavení
- **AI Dungeon Master**: Integrace s Google Gemini pro generování příběhu a odpovědí

## Struktura projektu

-   `/backend`: Node.js (Express) server pro API, herní logiku a integraci s AI.
-   `/frontend`: React (Vite) aplikace pro uživatelské rozhraní.
-   `/stories`: Adresář pro JSON soubory s herními příběhy.

## Technologie

### Backend
- Node.js s Express.js
- PostgreSQL databáze
- Google Gemini AI API
- JWT pro autentizaci
- ESLint a Jest pro testování

### Frontend
- React s Vite
- React Router pro navigaci
- Axios pro API komunikaci
- ESLint a Jest pro testování

## Požadavky

-   Node.js (verze 18+)
-   npm nebo yarn
-   PostgreSQL databáze (běžící lokálně nebo vzdáleně)
-   API klíč pro Google Gemini (nastavit v `backend/.env`)

## Nastavení

1.  **Backend:**
    ```bash
    cd backend
    npm install
    # Vytvořte soubor .env s následujícími proměnnými:
    # JWT_SECRET=your-secret-key-for-jwt-tokens
    # GEMINI_API_KEY=your-gemini-api-key
    # DB_USER=postgres
    # DB_PASSWORD=postgres
    # DB_HOST=localhost
    # DB_PORT=5432
    # DB_NAME=draci_doupe_db
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
    # Server poběží na http://localhost:3001
    ```

2.  **Frontend:**
    ```bash
    cd ../frontend
    npm run dev
    # Aplikace poběží na http://localhost:5173 (nebo jiném portu dle Vite)
    ```

## Testování

```bash
# Backend testy
cd backend
npm test

# Frontend testy
cd frontend
npm test
```

## Aktuální stav projektu

- [x] Základní autentizace uživatelů
- [x] Vytváření a správa postav
- [x] Integrace s Google Gemini AI
- [x] Základní herní mechaniky
- [x] Soubojový systém s iniciativou
- [x] Systém inventáře
- [ ] Pokročilé herní mechaniky (kouzla, schopnosti)
- [ ] Systém úkolů a odměn
- [ ] Mapa světa a navigace
- [ ] Multiplayer funkce

## Další kroky

- Implementace pokročilých herních mechanik
- Rozšíření systému úkolů a odměn
- Vylepšení uživatelského rozhraní
- Přidání více příběhů a obsahu
- Optimalizace výkonu a UX

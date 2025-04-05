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

## Continuous Integration

Projekt používá GitHub Actions pro automatické testování při každém push nebo pull requestu.

### Workflow soubory

- `.github/workflows/backend.yml` - Testování backendu
- `.github/workflows/frontend.yml` - Testování frontendu
- `.github/workflows/ci.yml` - Kombinovaný workflow pro testování celého projektu

### Co se testuje

- **Backend**:
  - Linting pomocí ESLint
  - Unit testy pomocí Jest
  - Testování s PostgreSQL databází

- **Frontend**:
  - Linting pomocí ESLint
  - Unit testy pomocí Jest
  - Build aplikace

## Aktuální stav projektu

- [x] Základní autentizace uživatelů
- [x] Vytváření a správa postav
  - [x] Ruční i náhodné generování atributů
  - [x] Výpočet bonusů z atributů
- [x] Integrace s Google Gemini AI
- [x] Základní herní mechaniky
  - [x] Systém úrovní a zkušeností
  - [x] Odpočinek a regenerace
- [x] Soubojový systém s iniciativou
  - [x] Různé typy útoků (rychlý, silný, obranný)
  - [x] Výpočet útočného bonusu podle povolání a atributů
  - [x] Výpočet zranění s kritickými zásahy
- [x] Systém inventáře
  - [x] Přidávání a používání předmětů
  - [x] Efekty předmětů (léčení, mana)
- [x] Systém úkolů
  - [x] Hlavní a vedlejší úkoly
  - [x] Cíle úkolů a jejich plnění
  - [x] Odměny za splnění úkolů
- [ ] Pokročilé herní mechaniky
- [ ] Mapa světa a navigace
- [ ] Multiplayer funkce

## Chybějící herní mechaniky

Následující herní mechaniky ještě nejsou implementovány nebo jsou implementovány jen částečně:

### 1. Systém kouzel a magie
- Implementace kouzlení a kouzel
- Různé typy kouzel (útočná, obranná, podpůrná)
- Mechanika sesílání kouzel (mana, cooldown)
- Efekty kouzel (zranění, léčení, buffs/debuffs)

### 2. Systém dovedností (skills)
- Implementace dovedností jako je zámečnictví, plížení, přesvědčování
- Mechanika testů dovedností
- Zlepšování dovedností s postupem úrovní

### 3. Systém schopností (abilities)
- Speciální schopnosti povolání (např. zákeřný útok zloděje)
- Pasivní schopnosti
- Aktivní schopnosti s cooldownem nebo omezeným počtem použití

### 4. Pokročilý soubojový systém
- Obrana a vyhýbání se útokům
- Různé typy zranění (fyzické, magické, elementální)
- Odolnosti a zranitelnosti
- Stavy (omráčení, otrávení, atd.)

### 5. Ekonomický systém
- Pokročilý obchodní systém
- Ceny závislé na reputaci
- Smlouvání

### 6. Systém reputace
- Implementace reputace u frakcí
- Důsledky reputace (ceny, dialogy, dostupné úkoly)

### 7. Systém craftingu
- Výroba předmětů
- Recepty a suroviny
- Vylepšování předmětů

### 8. Systém počasí a času
- Implementace denního cyklu
- Efekty počasí na gameplay
- Časové limity pro úkoly

### 9. Systém dialogů a rozhodnutí
- Větvení dialogů
- Důsledky rozhodnutí
- Podmíněné dialogy (podle atributů, reputace)

### 10. Systém vybavení a zbroje
- Výpočet obranné hodnoty (AC)
- Sloty pro vybavení
- Požadavky na vybavení

## Další kroky

- Implementace systému kouzel a magie
- Implementace systému dovedností a schopností
- Rozšíření soubojového systému
- Implementace systému vybavení a zbroje
- Vylepšení uživatelského rozhraní
- Přidání více příběhů a obsahu
- Optimalizace výkonu a UX

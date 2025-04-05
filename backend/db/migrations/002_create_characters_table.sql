-- Migrace pro vytvoření tabulky characters

CREATE TABLE IF NOT EXISTS characters (
    id SERIAL PRIMARY KEY,                      -- Unikátní identifikátor postavy
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Odkaz na uživatele, kterému postava patří (CASCADE smaže postavy při smazání uživatele)
    name VARCHAR(100) NOT NULL,                 -- Jméno postavy
    race VARCHAR(50) NOT NULL,                  -- Rasa postavy (např. 'Člověk', 'Elf')
    class VARCHAR(50) NOT NULL,                 -- Třída/Povolání postavy (např. 'Bojovník', 'Mág')
    level INTEGER NOT NULL DEFAULT 1,           -- Úroveň postavy
    experience INTEGER NOT NULL DEFAULT 0,      -- Zkušenostní body
    
    -- Základní atributy (dle pravidel Dračího doupěte - můžeme upravit)
    strength INTEGER NOT NULL DEFAULT 10,       -- Síla
    dexterity INTEGER NOT NULL DEFAULT 10,      -- Obratnost
    constitution INTEGER NOT NULL DEFAULT 10,   -- Odolnost
    intelligence INTEGER NOT NULL DEFAULT 10,   -- Inteligence
    wisdom INTEGER NOT NULL DEFAULT 10,         -- Moudrost
    charisma INTEGER NOT NULL DEFAULT 10,       -- Charisma

    -- Další herní statistiky
    max_health INTEGER NOT NULL DEFAULT 10,     -- Maximální zdraví (závisí na odolnosti, třídě, úrovni)
    current_health INTEGER NOT NULL DEFAULT 10, -- Aktuální zdraví
    max_mana INTEGER DEFAULT 0,                 -- Maximální mana (pro kouzelníky)
    current_mana INTEGER DEFAULT 0,             -- Aktuální mana

    -- Inventář a vybavení (zjednodušeně, můžeme později rozdělit do samostatných tabulek)
    inventory JSONB DEFAULT '[]',               -- Inventář jako JSON pole (např. [{ "item_id": "healing_potion", "quantity": 2 }])
    equipment JSONB DEFAULT '{}',               -- Vybavení jako JSON objekt (např. { "weapon": "sword_1", "armor": "leather_armor" })
    
    -- Informace o herním stavu
    current_location_id VARCHAR(100),           -- ID aktuální lokace postavy (může být NULL, pokud není ve hře)
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- Čas vytvoření postavy
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP  -- Čas poslední aktualizace postavy
);

-- Indexy pro rychlejší vyhledávání
CREATE INDEX IF NOT EXISTS idx_characters_user_id ON characters(user_id);
CREATE INDEX IF NOT EXISTS idx_characters_name ON characters(name); -- Pokud budeme hledat podle jména

-- Trigger pro automatickou aktualizaci updated_at
DROP TRIGGER IF EXISTS update_characters_updated_at ON characters; -- Odstraníme starý trigger, pokud existuje
CREATE TRIGGER update_characters_updated_at
BEFORE UPDATE ON characters
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column(); -- Použijeme stejnou funkci jako pro users

-- Komentáře
COMMENT ON TABLE characters IS 'Tabulka pro ukládání informací o herních postavách.';
COMMENT ON COLUMN characters.user_id IS 'Odkaz na vlastníka postavy v tabulce users.';
COMMENT ON COLUMN characters.inventory IS 'Seznam předmětů v inventáři postavy (JSONB pole).';
COMMENT ON COLUMN characters.equipment IS 'Aktuálně vybavené předměty postavy (JSONB objekt).';
COMMENT ON COLUMN characters.current_location_id IS 'ID lokace, kde se postava aktuálně nachází.';

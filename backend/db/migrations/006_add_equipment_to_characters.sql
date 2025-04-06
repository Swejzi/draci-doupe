-- Migrace pro přidání sloupců souvisejících s vybavením do tabulky characters

-- Kontrola, zda sloupce již existují
DO $$
BEGIN
    -- Přidání sloupce equipment jako JSONB objekt
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'characters' AND column_name = 'equipment'
    ) THEN
        ALTER TABLE characters
        ADD COLUMN equipment JSONB DEFAULT '{}';
        
        COMMENT ON COLUMN characters.equipment IS 'Vybavené předměty postavy jako JSONB objekt.';
    END IF;

    -- Přidání sloupce attributeBonuses jako JSONB objekt
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'characters' AND column_name = 'attributeBonuses'
    ) THEN
        ALTER TABLE characters
        ADD COLUMN attributeBonuses JSONB DEFAULT '{}';
        
        COMMENT ON COLUMN characters.attributeBonuses IS 'Bonusy k atributům z vybavení jako JSONB objekt.';
    END IF;

    -- Přidání sloupce acBonus
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'characters' AND column_name = 'acBonus'
    ) THEN
        ALTER TABLE characters
        ADD COLUMN acBonus INTEGER DEFAULT 0;
        
        COMMENT ON COLUMN characters.acBonus IS 'Bonus k obranné hodnotě (AC) z vybavení.';
    END IF;

    -- Přidání sloupce attackBonus
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'characters' AND column_name = 'attackBonus'
    ) THEN
        ALTER TABLE characters
        ADD COLUMN attackBonus INTEGER DEFAULT 0;
        
        COMMENT ON COLUMN characters.attackBonus IS 'Bonus k útoku z vybavení.';
    END IF;

    -- Přidání sloupce damageBonus
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'characters' AND column_name = 'damageBonus'
    ) THEN
        ALTER TABLE characters
        ADD COLUMN damageBonus INTEGER DEFAULT 0;
        
        COMMENT ON COLUMN characters.damageBonus IS 'Bonus k poškození z vybavení.';
    END IF;

    -- Přidání sloupce resistances jako JSONB objekt
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'characters' AND column_name = 'resistances'
    ) THEN
        ALTER TABLE characters
        ADD COLUMN resistances JSONB DEFAULT '{}';
        
        COMMENT ON COLUMN characters.resistances IS 'Odolnosti postavy jako JSONB objekt.';
    END IF;
END
$$;

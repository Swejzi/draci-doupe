-- Migrace pro přidání sloupce abilities do tabulky characters

-- Kontrola, zda sloupec již existuje
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'characters' AND column_name = 'abilities'
    ) THEN
        -- Přidání sloupce abilities jako JSONB pole
        ALTER TABLE characters
        ADD COLUMN abilities JSONB DEFAULT '[]';

        -- Přidání komentáře ke sloupci
        COMMENT ON COLUMN characters.abilities IS 'Seznam schopností postavy jako JSONB pole.';
    END IF;
END
$$;

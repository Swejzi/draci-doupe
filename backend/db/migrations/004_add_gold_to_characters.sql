-- Migrace pro přidání sloupce gold do tabulky characters

ALTER TABLE characters
ADD COLUMN gold INTEGER NOT NULL DEFAULT 0;

-- Můžeme přidat i komentář ke sloupci
COMMENT ON COLUMN characters.gold IS 'Aktuální množství zlata postavy.';
